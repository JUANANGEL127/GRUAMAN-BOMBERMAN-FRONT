import {
  CAMPAIGN_SCHEDULE_TYPES,
  createDefaultCampaign,
  isCampaignActive,
  normalizeCampaignDate,
  normalizeCampaignStatus,
  resolveCampaignScheduleType,
  resolveCampaignStatus,
} from "../campaignContracts";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value !== null && value !== undefined && value !== "") return value;
  }

  return null;
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (["true", "1", "yes", "si", "s\u00ed", "active", "activo"].includes(normalizedValue)) {
      return true;
    }

    if (["false", "0", "no", "inactive", "inactivo"].includes(normalizedValue)) {
      return false;
    }
  }

  return fallback;
}

function unwrapCandidate(payload) {
  if (Array.isArray(payload)) return payload;
  if (!isPlainObject(payload)) return {};

  if (isPlainObject(payload.campaign)) return payload.campaign;
  if (isPlainObject(payload.campana)) return payload.campana;
  if (isPlainObject(payload.activeCampaign)) return payload.activeCampaign;
  if (isPlainObject(payload.active_campaign)) return payload.active_campaign;

  if (isPlainObject(payload.data)) {
    if (isPlainObject(payload.data.campaign)) return payload.data.campaign;
    if (isPlainObject(payload.data.campana)) return payload.data.campana;
    if (isPlainObject(payload.data.activeCampaign)) return payload.data.activeCampaign;
    if (isPlainObject(payload.data.active_campaign)) return payload.data.active_campaign;

    if (Array.isArray(payload.data.campaigns)) return payload.data.campaigns;
    if (Array.isArray(payload.data.campanas)) return payload.data.campanas;
    if (Array.isArray(payload.data.items)) return payload.data.items;

    return payload.data;
  }

  return payload;
}

function getCampaignArraySources(payload) {
  const candidate = unwrapCandidate(payload);

  if (Array.isArray(candidate)) {
    return [candidate];
  }

  if (!isPlainObject(candidate)) {
    return [];
  }

  return [
    candidate.campaigns,
    candidate.campanas,
    candidate.items,
    candidate.results,
    candidate.rows,
    candidate.data?.campaigns,
    candidate.data?.campanas,
    candidate.data?.items,
  ];
}

function resolveEnabled(candidate) {
  const explicitStatus = normalizeCampaignStatus(
    firstNonEmpty(candidate.status, candidate.estado)
  );

  if (explicitStatus === "inactive") {
    return false;
  }

  if (typeof candidate.enabled === "boolean") {
    return candidate.enabled;
  }

  return toBoolean(
    firstNonEmpty(
      candidate.is_active,
      candidate.isActive,
      candidate.active,
      candidate.activo,
      candidate.enabled,
      candidate.habilitado,
      candidate.publicado,
      candidate.published
    ),
    true
  );
}

function buildDeduplicationKey(campaign) {
  return (
    campaign.id ||
    [
      campaign.title,
      campaign.scheduleType,
      campaign.startsAt || "null",
      campaign.endsAt || "null",
      campaign.imageUrl,
    ].join("::")
  );
}

function resolveSingleCandidate(payload) {
  const candidate = unwrapCandidate(payload);

  if (Array.isArray(candidate)) return null;
  if (isPlainObject(candidate)) return candidate;
  return null;
}

export function normalizeCampaign(payload = {}, options = {}) {
  const fallback = createDefaultCampaign();
  const candidate = resolveSingleCandidate(payload);

  if (!candidate) {
    return { ...fallback };
  }

  const startsAt = normalizeCampaignDate(
    firstNonEmpty(candidate.starts_at, candidate.startsAt, candidate.fecha_inicio, candidate.fechaInicio)
  );
  const endsAt = normalizeCampaignDate(
    firstNonEmpty(candidate.ends_at, candidate.endsAt, candidate.fecha_fin, candidate.fechaFin)
  );
  const scheduleType = resolveCampaignScheduleType({
    scheduleType: firstNonEmpty(candidate.schedule_type, candidate.scheduleType, candidate.tipo_programacion),
    permanent: firstNonEmpty(candidate.permanent, candidate.permanente),
    startsAt,
    endsAt,
  });
  const enabled = resolveEnabled(candidate);
  const normalizedStatus = resolveCampaignStatus({
    enabled,
    scheduleType,
    status: firstNonEmpty(candidate.status, candidate.estado),
    startsAt,
    endsAt,
    referenceDate: options.referenceDate,
  });
  const hasRangeSchedule = scheduleType === CAMPAIGN_SCHEDULE_TYPES.RANGE;
  const imageUrl = ensureString(
    firstNonEmpty(
      candidate.image_url,
      candidate.imageUrl,
      candidate.imagen_url,
      candidate.imagenUrl,
      candidate.image,
      candidate.imagen,
      candidate.url
    )
  );

  return {
    ...fallback,
    id: ensureString(firstNonEmpty(candidate.id, candidate.campaign_id, candidate.campaignId)),
    title: ensureString(firstNonEmpty(candidate.title, candidate.titulo, candidate.nombre, candidate.name)),
    imageUrl,
    thumbnailUrl: ensureString(
      firstNonEmpty(
        candidate.thumbnail_url,
        candidate.thumbnailUrl,
        candidate.miniatura_url,
        candidate.miniaturaUrl,
        imageUrl
      )
    ),
    permanent: scheduleType === CAMPAIGN_SCHEDULE_TYPES.PERMANENT,
    enabled,
    scheduleType,
    status: normalizedStatus,
    startsAt: hasRangeSchedule ? startsAt : null,
    endsAt: hasRangeSchedule ? endsAt : null,
    isActive: normalizedStatus === "active",
  };
}

export function normalizeCampaignResponse(payload = {}, options = {}) {
  const singleCandidate = resolveSingleCandidate(payload);

  if (singleCandidate) {
    return normalizeCampaign(singleCandidate, options);
  }

  const campaigns = normalizeCampaignCollection(payload, options);
  return campaigns[0] ?? null;
}

export function normalizeCampaignCollection(payload = {}, options = {}) {
  const normalizedCampaigns = getCampaignArraySources(payload)
    .flatMap((source) => ensureArray(source))
    .map((campaign) => normalizeCampaign(campaign, options))
    .filter((campaign) => Boolean(campaign.id || campaign.title || campaign.imageUrl));

  const uniqueCampaigns = new Map();

  normalizedCampaigns.forEach((campaign) => {
    const deduplicationKey = buildDeduplicationKey(campaign);

    if (!uniqueCampaigns.has(deduplicationKey)) {
      uniqueCampaigns.set(deduplicationKey, campaign);
    }
  });

  return [...uniqueCampaigns.values()];
}

export function resolveEffectiveActiveCampaign(campaigns = []) {
  const normalizedCampaigns = ensureArray(campaigns);
  return normalizedCampaigns.find((campaign) => isCampaignActive(campaign)) ?? null;
}

export function normalizeActiveCampaignResponse(payload = {}, options = {}) {
  const singleCandidate = resolveSingleCandidate(payload);

  if (singleCandidate) {
    const normalizedCampaign = normalizeCampaign(singleCandidate, options);
    return isCampaignActive(normalizedCampaign) ? normalizedCampaign : null;
  }

  return resolveEffectiveActiveCampaign(
    normalizeCampaignCollection(payload, options)
  );
}

export function toCampaignPayload(campaign = {}, options = {}) {
  const normalizedCampaign = normalizeCampaign(campaign, options);
  const hasRangeSchedule =
    normalizedCampaign.scheduleType === CAMPAIGN_SCHEDULE_TYPES.RANGE;
  const payload = {
    title: normalizedCampaign.title,
    enabled: Boolean(normalizedCampaign.enabled),
    permanent: normalizedCampaign.scheduleType === CAMPAIGN_SCHEDULE_TYPES.PERMANENT,
    startsAt: hasRangeSchedule ? normalizedCampaign.startsAt : null,
    endsAt: hasRangeSchedule ? normalizedCampaign.endsAt : null,
  };

  if (normalizedCampaign.imageUrl) {
    payload.imageUrl = normalizedCampaign.imageUrl;
  }

  if (normalizedCampaign.id) {
    payload.id = normalizedCampaign.id;
  }

  return payload;
}

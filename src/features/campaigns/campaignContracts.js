import { toYMD, todayStrBogota } from "../../utils/dateUtils";

export const CAMPAIGN_SCHEDULE_TYPES = Object.freeze({
  PERMANENT: "permanent",
  RANGE: "range",
});

export const CAMPAIGN_STATUSES = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  SCHEDULED: "scheduled",
});

export const CAMPAIGN_FIRST_EXAMPLE_RANGE = Object.freeze({
  startsAt: "2026-06-16",
  endsAt: "2026-07-15",
});

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function normalizeCampaignDate(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) return null;
  if (ISO_DATE_PATTERN.test(normalizedValue)) return normalizedValue;

  try {
    const normalizedDate = toYMD(value);
    return ISO_DATE_PATTERN.test(normalizedDate) ? normalizedDate : null;
  } catch {
    return null;
  }
}

export function normalizeCampaignScheduleType(value) {
  const normalizedValue = normalizeText(value).toLowerCase();

  if (normalizedValue === CAMPAIGN_SCHEDULE_TYPES.PERMANENT) {
    return CAMPAIGN_SCHEDULE_TYPES.PERMANENT;
  }

  if (
    normalizedValue === CAMPAIGN_SCHEDULE_TYPES.RANGE ||
    normalizedValue === "scheduled_range"
  ) {
    return CAMPAIGN_SCHEDULE_TYPES.RANGE;
  }

  return null;
}

export function normalizeCampaignStatus(value) {
  const normalizedValue = normalizeText(value).toLowerCase();

  if (normalizedValue === CAMPAIGN_STATUSES.ACTIVE) {
    return CAMPAIGN_STATUSES.ACTIVE;
  }

  if (
    normalizedValue === CAMPAIGN_STATUSES.INACTIVE ||
    normalizedValue === "disabled"
  ) {
    return CAMPAIGN_STATUSES.INACTIVE;
  }

  if (normalizedValue === CAMPAIGN_STATUSES.SCHEDULED) {
    return CAMPAIGN_STATUSES.SCHEDULED;
  }

  return null;
}

export function isCampaignScheduleType(value) {
  return Boolean(normalizeCampaignScheduleType(value));
}

export function isCampaignStatus(value) {
  return Boolean(normalizeCampaignStatus(value));
}

export function getCampaignReferenceDate(referenceDate = todayStrBogota()) {
  return normalizeCampaignDate(referenceDate) || todayStrBogota();
}

export function resolveCampaignScheduleType({
  scheduleType,
  permanent,
  startsAt,
  endsAt,
} = {}) {
  const normalizedScheduleType = normalizeCampaignScheduleType(scheduleType);

  if (normalizedScheduleType) {
    return normalizedScheduleType;
  }

  if (typeof permanent === "boolean") {
    return permanent ? CAMPAIGN_SCHEDULE_TYPES.PERMANENT : CAMPAIGN_SCHEDULE_TYPES.RANGE;
  }

  if (startsAt || endsAt) {
    return CAMPAIGN_SCHEDULE_TYPES.RANGE;
  }

  return CAMPAIGN_SCHEDULE_TYPES.PERMANENT;
}

export function resolveCampaignStatus({
  enabled = true,
  scheduleType,
  status,
  startsAt,
  endsAt,
  referenceDate,
} = {}) {
  const effectiveStatus = normalizeCampaignStatus(status);
  const safeReferenceDate = getCampaignReferenceDate(referenceDate);
  const safeStartsAt = normalizeCampaignDate(startsAt);
  const safeEndsAt = normalizeCampaignDate(endsAt);
  const effectiveScheduleType = resolveCampaignScheduleType({
    scheduleType,
    startsAt: safeStartsAt,
    endsAt: safeEndsAt,
  });

  if (!enabled || effectiveStatus === CAMPAIGN_STATUSES.INACTIVE) {
    return CAMPAIGN_STATUSES.INACTIVE;
  }

  if (effectiveScheduleType === CAMPAIGN_SCHEDULE_TYPES.RANGE) {
    if (safeStartsAt && safeReferenceDate < safeStartsAt) {
      return CAMPAIGN_STATUSES.SCHEDULED;
    }

    if (safeStartsAt && safeEndsAt && safeEndsAt < safeStartsAt) {
      return CAMPAIGN_STATUSES.INACTIVE;
    }

    if (safeEndsAt && safeReferenceDate > safeEndsAt) {
      return CAMPAIGN_STATUSES.INACTIVE;
    }

    if (!safeStartsAt && !safeEndsAt) {
      return effectiveStatus === CAMPAIGN_STATUSES.SCHEDULED
        ? CAMPAIGN_STATUSES.SCHEDULED
        : CAMPAIGN_STATUSES.INACTIVE;
    }

    return CAMPAIGN_STATUSES.ACTIVE;
  }

  if (effectiveStatus === CAMPAIGN_STATUSES.SCHEDULED) {
    return CAMPAIGN_STATUSES.SCHEDULED;
  }

  return CAMPAIGN_STATUSES.ACTIVE;
}

export function createDefaultCampaign() {
  return {
    id: "",
    title: "",
    imageUrl: "",
    thumbnailUrl: "",
    scheduleType: CAMPAIGN_SCHEDULE_TYPES.PERMANENT,
    permanent: true,
    enabled: false,
    status: CAMPAIGN_STATUSES.INACTIVE,
    startsAt: null,
    endsAt: null,
    isActive: false,
  };
}

export function isCampaignActive(campaign) {
  return campaign?.status === CAMPAIGN_STATUSES.ACTIVE;
}

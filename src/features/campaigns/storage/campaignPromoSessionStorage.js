const CAMPAIGN_PROMO_SESSION_STORAGE_PREFIX = "campaigns.workerPromo.v1";
const CAMPAIGN_PROMO_CARRYOVER_SUFFIX = ":carryover-open";
const CAMPAIGN_PROMO_SUPPRESS_NEXT_MAP_SUFFIX = ":suppress-next-map";
export const CAMPAIGN_PROMO_DISPLAY_LIMIT = 4;

function isBrowserEnvironment() {
  return typeof window !== "undefined";
}

function getSessionStorage() {
  if (!isBrowserEnvironment()) {
    return null;
  }

  return window.sessionStorage ?? null;
}

function getNormalizedSessionIdentity(session) {
  if (session?.kind !== "worker") {
    return "";
  }

  const documentId =
    typeof session?.user?.documentId === "string" ? session.user.documentId.trim() : "";
  const userId = typeof session?.user?.id === "string" ? session.user.id.trim() : "";
  const expiresAt = typeof session?.expiresAt === "string" ? session.expiresAt.trim() : "";
  const identity = documentId || userId;

  if (!identity) {
    return "";
  }

  return `${CAMPAIGN_PROMO_SESSION_STORAGE_PREFIX}:${session.kind}:${identity}:${expiresAt || "no-expiry"}`;
}

function safeParseDisplayRecord(rawValue) {
  try {
    const parsed = JSON.parse(rawValue);
    const count = Number(parsed?.count);

    if (!Number.isFinite(count) || count < 0) {
      return null;
    }

    return {
      count,
      updatedAt: typeof parsed?.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

function readDisplayRecord(storageKey) {
  const storage = getSessionStorage();

  if (!storage || !storageKey) {
    return {
      count: 0,
      updatedAt: "",
    };
  }

  const rawValue = storage.getItem(storageKey);
  if (!rawValue) {
    return {
      count: 0,
      updatedAt: "",
    };
  }

  const parsed = safeParseDisplayRecord(rawValue);

  if (!parsed) {
    storage.removeItem(storageKey);
    return {
      count: 0,
      updatedAt: "",
    };
  }

  return parsed;
}

function writeRecord(storageKey, record) {
  const storage = getSessionStorage();

  if (!storage || !storageKey) {
    return;
  }

  storage.setItem(storageKey, JSON.stringify(record));
}

export function getCampaignPromoSessionStorageKey(session) {
  return getNormalizedSessionIdentity(session);
}

function getCampaignPromoCarryoverStorageKey(session) {
  const baseStorageKey = getCampaignPromoSessionStorageKey(session);

  if (!baseStorageKey) {
    return "";
  }

  return `${baseStorageKey}${CAMPAIGN_PROMO_CARRYOVER_SUFFIX}`;
}

function getCampaignPromoSuppressNextMapStorageKey(session) {
  const baseStorageKey = getCampaignPromoSessionStorageKey(session);

  if (!baseStorageKey) {
    return "";
  }

  return `${baseStorageKey}${CAMPAIGN_PROMO_SUPPRESS_NEXT_MAP_SUFFIX}`;
}

export function getCampaignPromoDisplayState(session) {
  const storageKey = getCampaignPromoSessionStorageKey(session);
  const record = readDisplayRecord(storageKey);

  return {
    storageKey,
    count: record.count,
    updatedAt: record.updatedAt,
    limit: CAMPAIGN_PROMO_DISPLAY_LIMIT,
    remaining: Math.max(CAMPAIGN_PROMO_DISPLAY_LIMIT - record.count, 0),
    canDisplay: record.count < CAMPAIGN_PROMO_DISPLAY_LIMIT,
  };
}

export function markCampaignPromoDisplayed(session) {
  const storageKey = getCampaignPromoSessionStorageKey(session);

  if (!storageKey) {
    return {
      storageKey: "",
      count: 0,
      updatedAt: "",
      limit: CAMPAIGN_PROMO_DISPLAY_LIMIT,
      remaining: CAMPAIGN_PROMO_DISPLAY_LIMIT,
      canDisplay: false,
    };
  }

  const currentState = readDisplayRecord(storageKey);
  const nextCount = Math.min(currentState.count + 1, CAMPAIGN_PROMO_DISPLAY_LIMIT);
  const nextUpdatedAt = new Date().toISOString();
  const nextState = {
    count: nextCount,
    updatedAt: nextUpdatedAt,
  };

  writeRecord(storageKey, nextState);

  return {
    storageKey,
    count: nextCount,
    updatedAt: nextUpdatedAt,
    limit: CAMPAIGN_PROMO_DISPLAY_LIMIT,
    remaining: Math.max(CAMPAIGN_PROMO_DISPLAY_LIMIT - nextCount, 0),
    canDisplay: nextCount < CAMPAIGN_PROMO_DISPLAY_LIMIT,
  };
}

export function isCampaignPromoCarryoverOpen(session) {
  const storage = getSessionStorage();
  const storageKey = getCampaignPromoCarryoverStorageKey(session);

  if (!storage || !storageKey) {
    return false;
  }

  return storage.getItem(storageKey) === "true";
}

export function setCampaignPromoCarryoverOpen(session, isOpen) {
  const storage = getSessionStorage();
  const storageKey = getCampaignPromoCarryoverStorageKey(session);

  if (!storage || !storageKey) {
    return;
  }

  if (isOpen) {
    storage.setItem(storageKey, "true");
    return;
  }

  storage.removeItem(storageKey);
}

export function shouldSuppressNextCampaignPromoMapDisplay(session) {
  const storage = getSessionStorage();
  const storageKey = getCampaignPromoSuppressNextMapStorageKey(session);

  if (!storage || !storageKey) {
    return false;
  }

  return storage.getItem(storageKey) === "true";
}

export function setCampaignPromoSuppressNextMapDisplay(session, shouldSuppress) {
  const storage = getSessionStorage();
  const storageKey = getCampaignPromoSuppressNextMapStorageKey(session);

  if (!storage || !storageKey) {
    return;
  }

  if (shouldSuppress) {
    storage.setItem(storageKey, "true");
    return;
  }

  storage.removeItem(storageKey);
}

export function clearCampaignPromoDisplayStateByKey(storageKey) {
  const storage = getSessionStorage();

  if (!storage || !storageKey) {
    return;
  }

  storage.removeItem(storageKey);
}

export function clearAllCampaignPromoDisplayState() {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  const keysToRemove = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (key && key.startsWith(CAMPAIGN_PROMO_SESSION_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
}

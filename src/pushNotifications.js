import api from "./utils/api";

const PUSH_SYNC_RETRY_COOLDOWN_MS = 15_000;
const PUSH_SYNC_MAX_RETRIES = 3;
const PUSH_SYNC_RETRY_BASE_DELAY_MS = 800;
const PUSH_PERMISSION_TIMEOUT_MS = 10_000;
const PUSH_SW_READY_TIMEOUT_MS = 10_000;
let pushSyncInFlight = null;
let lastPushSyncAttemptAt = 0;

export function canPromptPushPermission() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestPushPermissionFromUserGesture() {
  if (!canPromptPushPermission()) {
    return "denied";
  }

  const requestPermissionPromise = Promise.resolve(Notification.requestPermission());
  const timeoutPromise = new Promise((resolve) => {
    window.setTimeout(() => resolve("timeout"), PUSH_PERMISSION_TIMEOUT_MS);
  });

  const result = await Promise.race([requestPermissionPromise, timeoutPromise]);

  if (result === "timeout") {
    return Notification.permission;
  }

  return result;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function ensurePushSubscription(registration, vapidPublicKey) {
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    return existingSubscription;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

async function postSubscription(numeroIdentificacion, subscriptionJson) {
  const deviceMetadata = getLocalDeviceMetadata();

  await api.post("/push/subscribe", {
    numero_identificacion: numeroIdentificacion,
    subscription: subscriptionJson,
    device_id: deviceMetadata.deviceId,
    device_label: deviceMetadata.deviceLabel,
  });
}

function safeLocalStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return false;
  }

  return true;
}

function generateDeviceId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `dev-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function getDefaultDeviceLabel() {
  const userAgent = navigator?.userAgent?.toLowerCase?.() ?? "";
  const isMobile = /android|iphone|ipad|mobile/.test(userAgent);
  const platform = navigator?.platform || "unknown";
  return `${isMobile ? "Mobile" : "Desktop"} (${platform})`;
}

function getLocalDeviceMetadata() {
  const deviceIdKey = "push:device-id";
  const deviceLabelKey = "push:device-label";
  let deviceId = safeLocalStorageGet(deviceIdKey);
  let deviceLabel = safeLocalStorageGet(deviceLabelKey);

  if (!deviceId) {
    deviceId = generateDeviceId();
    safeLocalStorageSet(deviceIdKey, deviceId);
  }

  if (!deviceLabel) {
    deviceLabel = getDefaultDeviceLabel();
    safeLocalStorageSet(deviceLabelKey, deviceLabel);
  }

  return { deviceId, deviceLabel };
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function toPermissionRecoveryMessage(permission) {
  if (permission === "denied") {
    return "Notifications are blocked. Enable them in browser/site settings and reload the app.";
  }

  return "Notifications permission was not granted. Please enable notifications for this site.";
}

async function runPushSync(numeroIdentificacion, { allowPermissionPrompt = true } = {}) {
  if (
    typeof window === "undefined" ||
    !numeroIdentificacion ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return;
  }

  let permission = Notification.permission;
  if (permission === "default" && allowPermissionPrompt) {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return {
      ok: false,
      reason: "permission-not-granted",
      message: toPermissionRecoveryMessage(permission),
    };
  }

  const vapidKeyResponse = await api.get("/vapid-public-key", {
    responseType: "text",
  });
  const vapidPublicKey = String(vapidKeyResponse.data ?? "").trim();

  if (!vapidPublicKey) {
    throw new Error("Missing VAPID public key");
  }

  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error("Service worker readiness timed out"));
      }, PUSH_SW_READY_TIMEOUT_MS);
    }),
  ]);
  let lastError = null;

  for (let attempt = 1; attempt <= PUSH_SYNC_MAX_RETRIES; attempt += 1) {
    try {
      const subscription = await ensurePushSubscription(registration, vapidPublicKey);
      const subscriptionJson = subscription?.toJSON?.() ?? subscription;
      if (!subscriptionJson?.endpoint) {
        throw new Error("Invalid push subscription payload");
      }
      await postSubscription(numeroIdentificacion, subscriptionJson);

      return { ok: true };
    } catch (error) {
      lastError = error;

      if (attempt < PUSH_SYNC_MAX_RETRIES) {
        await delay(PUSH_SYNC_RETRY_BASE_DELAY_MS * attempt);
      }
    }
  }

  return {
    ok: false,
    reason: "subscription-sync-failed",
    message:
      "We could not enable notifications on this device. Check connection/site settings and try again.",
    error: lastError,
  };
}

export async function syncPushSubscriptionForAuthenticatedWorker(
  numeroIdentificacion,
  { onStatus, allowPermissionPrompt = true, force = false } = {}
) {
  const now = Date.now();

  if (pushSyncInFlight) {
    return pushSyncInFlight;
  }

  if (!force && now - lastPushSyncAttemptAt < PUSH_SYNC_RETRY_COOLDOWN_MS) {
    return;
  }

  lastPushSyncAttemptAt = now;
  pushSyncInFlight = runPushSync(numeroIdentificacion, { allowPermissionPrompt })
    .then((result) => {
      if (typeof onStatus === "function") {
        onStatus(result);
      }

      if (!result?.ok) {
        const isRecoverablePermissionMiss =
          !allowPermissionPrompt && result?.reason === "permission-not-granted";

        if (isRecoverablePermissionMiss) {
          window.console.warn(
            `[push-sync] ${result?.reason}: permission still pending explicit user action`
          );
        } else {
          window.console.error(
            `[push-sync] ${result?.reason ?? "unknown-error"}: ${result?.message ?? "sync failed"}`
          );
        }
      }

      return result;
    })
    .catch((error) => {
      const failure = {
        ok: false,
        reason: "unexpected-sync-error",
        message:
          "Unexpected notification setup error. Please retry from this device settings.",
        error,
      };

      if (typeof onStatus === "function") {
        onStatus(failure);
      }

      window.console.error(`[push-sync] ${failure.reason}: ${failure.message}`, error);
      return failure;
    })
    .finally(() => {
      pushSyncInFlight = null;
    });

  return pushSyncInFlight;
}

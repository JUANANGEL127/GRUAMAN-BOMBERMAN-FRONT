import api from "./utils/api";

const PUSH_SYNC_RETRY_COOLDOWN_MS = 60_000;
let pushSyncInFlight = null;
let lastPushSyncAttemptAt = 0;

export function canPromptPushPermission() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestPushPermissionFromUserGesture() {
  if (!canPromptPushPermission()) {
    return "denied";
  }

  return Notification.requestPermission();
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

function buildSubscriptionFingerprint(subscriptionJson) {
  if (!subscriptionJson?.endpoint) {
    return "";
  }

  const p256dh = subscriptionJson?.keys?.p256dh ?? "";
  const auth = subscriptionJson?.keys?.auth ?? "";
  return `${subscriptionJson.endpoint}|${p256dh}|${auth}`;
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
  await api.post("/push/subscribe", {
    numero_identificacion: numeroIdentificacion,
    subscription: subscriptionJson,
  });
}

async function runPushSync(numeroIdentificacion) {
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
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return;
  }

  const vapidKeyResponse = await api.get("/vapid-public-key", {
    responseType: "text",
  });
  const vapidPublicKey = String(vapidKeyResponse.data ?? "").trim();

  if (!vapidPublicKey) {
    throw new Error("Missing VAPID public key");
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await ensurePushSubscription(registration, vapidPublicKey);
  const subscriptionJson = subscription?.toJSON?.() ?? subscription;
  const nextFingerprint = buildSubscriptionFingerprint(subscriptionJson);

  if (!nextFingerprint) {
    throw new Error("Invalid push subscription payload");
  }

  const syncKey = `push-sync:${numeroIdentificacion}`;
  const lastFingerprint = window.localStorage.getItem(syncKey) ?? "";

  if (lastFingerprint === nextFingerprint) {
    return;
  }

  await postSubscription(numeroIdentificacion, subscriptionJson);
  window.localStorage.setItem(syncKey, nextFingerprint);
}

export async function syncPushSubscriptionForAuthenticatedWorker(numeroIdentificacion) {
  const now = Date.now();

  if (pushSyncInFlight) {
    return pushSyncInFlight;
  }

  if (now - lastPushSyncAttemptAt < PUSH_SYNC_RETRY_COOLDOWN_MS) {
    return;
  }

  lastPushSyncAttemptAt = now;
  pushSyncInFlight = runPushSync(numeroIdentificacion)
    .catch((error) => {
      window.console.error("[push-sync] Subscription sync failed", error);
    })
    .finally(() => {
      pushSyncInFlight = null;
    });

  return pushSyncInFlight;
}

export const AUTH_EVENTS = Object.freeze({
  SESSION_UPDATED: "auth:session-updated",
  UNAUTHORIZED: "auth:unauthorized",
  FORBIDDEN: "auth:forbidden",
  SIGNED_OUT: "auth:signed-out",
});

const fallbackEventTarget = new EventTarget();

function getAuthEventTarget() {
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    return window;
  }

  return fallbackEventTarget;
}

function createAuthEvent(type, detail) {
  if (typeof CustomEvent === "function") {
    return new CustomEvent(type, { detail });
  }

  const event = new Event(type);
  event.detail = detail;
  return event;
}

export function emitAuthEvent(type, detail = {}) {
  getAuthEventTarget().dispatchEvent(createAuthEvent(type, detail));
}

export function subscribeAuthEvent(type, handler) {
  const target = getAuthEventTarget();
  const listener = (event) => handler(event.detail ?? {});

  target.addEventListener(type, listener);

  return () => {
    target.removeEventListener(type, listener);
  };
}

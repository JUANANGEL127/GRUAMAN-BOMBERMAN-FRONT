/**
 * Gets a fresh geolocation sample from the browser.
 *
 * @param {{ timeoutMs?: number, enableHighAccuracy?: boolean, maximumAge?: number }} [options]
 * @returns {Promise<{ lat: number, lon: number, accuracy_meters: number | null, captured_at: string }>}
 */
export function acquireCurrentGeolocation(options = {}) {
  const {
    timeoutMs = 12000,
    enableHighAccuracy = true,
    maximumAge = 0,
  } = options;

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("GEOLOCATION_NOT_SUPPORTED"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy_meters: Number.isFinite(position.coords.accuracy)
            ? Number(position.coords.accuracy)
            : null,
          captured_at: new Date().toISOString(),
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy,
        timeout: timeoutMs,
        maximumAge,
      }
    );
  });
}


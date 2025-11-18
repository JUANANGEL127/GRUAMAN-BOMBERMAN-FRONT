export async function subscribeUser(trabajadorId) {
  // Obtén la clave pública VAPID del backend
  const vapidKeyRes = await fetch('/vapid-public-key');
  const vapidPublicKey = await vapidKeyRes.text();

  // Espera a que el Service Worker esté listo
  const registration = await navigator.serviceWorker.ready;

  // Suscribe al usuario
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });

  // Envía la suscripción al backend
  await fetch('/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trabajador_id: trabajadorId,
      subscription
    })
  });
}

// Utilidad para convertir la clave VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

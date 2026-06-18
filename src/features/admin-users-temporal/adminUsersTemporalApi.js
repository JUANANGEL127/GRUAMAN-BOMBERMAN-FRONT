import api from "../../utils/api";

export function fetchAdminUsersList(params) {
  return api.get("/admin_usuarios/listar", { params }).then((response) => response.data ?? {});
}

export function fetchWorkerTemporalTimeline(workerId) {
  return api
    .get(`/admin_usuarios/estado-temporal/${workerId}`)
    .then((response) => response.data ?? {});
}

export function createWorker(workerPayload) {
  return api
    .post("/admin_usuarios/agregar", workerPayload)
    .then((response) => response.data ?? {});
}

export function toggleWorkerActive(workerId, activo) {
  return api
    .patch(`/admin_usuarios/estado/${workerId}`, { activo })
    .then((response) => response.data ?? {});
}

export function toggleWorkerPin(workerId, pinHabilitado) {
  return api
    .patch(`/admin_usuarios/pin/${workerId}`, { pin_habilitado: pinHabilitado })
    .then((response) => response.data ?? {});
}

export function createWorkerTemporalState(workerId, payload) {
  return api
    .post(`/admin_usuarios/estado-temporal/${workerId}`, payload)
    .then((response) => response.data ?? {});
}

export function updateWorkerTemporalState(workerId, temporalStateId, payload) {
  return api
    .patch(`/admin_usuarios/estado-temporal/${workerId}/${temporalStateId}`, payload)
    .then((response) => response.data ?? {});
}

export function closeWorkerTemporalState(workerId, temporalStateId, payload = {}) {
  return api
    .post(`/admin_usuarios/estado-temporal/${workerId}/${temporalStateId}/cerrar`, payload)
    .then((response) => response.data ?? {});
}

export function annulWorkerTemporalState(workerId, temporalStateId, payload = {}) {
  return api
    .post(`/admin_usuarios/estado-temporal/${workerId}/${temporalStateId}/anular`, payload)
    .then((response) => response.data ?? {});
}


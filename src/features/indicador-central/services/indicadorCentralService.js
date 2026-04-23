import api from "../../../utils/api";

export const INDICADOR_CENTRAL_ENDPOINTS = Object.freeze({
  CONFIGURACION: "/administrador/indicador_central/configuracion",
  WORKBOOK_DOWNLOAD: "/administrador/registros_diarios/descargar",
  GET_EMPRESAS: "/roles/empresas/",
  GET_OBRAS: "/obras",
  LISTAR_TRABAJADORES: "/admin_usuarios/listar",
});

export async function getIndicadorCentralConfig() {
  const response = await api.get(INDICADOR_CENTRAL_ENDPOINTS.CONFIGURACION);
  return response.data;
}

export async function updateIndicadorCentralConfig(payload) {
  const response = await api.put(INDICADOR_CENTRAL_ENDPOINTS.CONFIGURACION, payload);
  return response.data;
}

export async function downloadIndicadorCentralWorkbook(payload = {}, axiosConfig = {}) {
  return api.post(INDICADOR_CENTRAL_ENDPOINTS.WORKBOOK_DOWNLOAD, payload, {
    responseType: "blob",
    ...axiosConfig,
  });
}

export async function getEmpresas() {
  const response = await api.get(INDICADOR_CENTRAL_ENDPOINTS.GET_EMPRESAS);
  return response.data;
}

export async function getObras() {
  const response = await api.get(INDICADOR_CENTRAL_ENDPOINTS.GET_OBRAS);
  return response.data;
}

export async function getTrabajadores(params = {}) {
  const response = await api.get(INDICADOR_CENTRAL_ENDPOINTS.LISTAR_TRABAJADORES, {
    params,
  });
  return response.data;
}

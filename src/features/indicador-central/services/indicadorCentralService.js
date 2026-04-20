import api from "../../../utils/api";

export const INDICADOR_CENTRAL_ENDPOINTS = Object.freeze({
  CONFIGURACION: "/administrador/indicador_central/configuracion",
  WORKBOOK_DOWNLOAD: "/administrador/registros_diarios/descargar",
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

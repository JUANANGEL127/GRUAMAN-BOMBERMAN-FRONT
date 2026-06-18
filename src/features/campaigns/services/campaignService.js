import api from "../../../utils/api";
import {
  normalizeActiveCampaignResponse,
  normalizeCampaignCollection,
  normalizeCampaignResponse,
  toCampaignPayload,
} from "../adapters/campaignAdapter";

export const CAMPAIGN_ENDPOINTS = Object.freeze({
  ACTIVE: "/campaigns/active",
  ADMIN_LIST: "/administrador/campaigns",
  ADMIN_CREATE: "/administrador/campaigns",
  ADMIN_UPDATE: (campaignId) => `/administrador/campaigns/${campaignId}`,
});

function isFormDataPayload(payload) {
  return typeof FormData !== "undefined" && payload instanceof FormData;
}

function prepareCampaignRequestBody(payload) {
  if (isFormDataPayload(payload)) {
    return payload;
  }

  return toCampaignPayload(payload);
}

export async function getActiveCampaign() {
  const response = await api.get(CAMPAIGN_ENDPOINTS.ACTIVE);
  return normalizeActiveCampaignResponse(response.data);
}

export async function getCampaigns(params = {}) {
  const response = await api.get(CAMPAIGN_ENDPOINTS.ADMIN_LIST, {
    params,
  });

  return normalizeCampaignCollection(response.data);
}

export async function createCampaign(payload) {
  const response = await api.post(
    CAMPAIGN_ENDPOINTS.ADMIN_CREATE,
    prepareCampaignRequestBody(payload)
  );

  return normalizeCampaignResponse(response.data);
}

export async function updateCampaign(campaignId, payload) {
  const response = await api.put(
    CAMPAIGN_ENDPOINTS.ADMIN_UPDATE(campaignId),
    prepareCampaignRequestBody(payload)
  );

  return normalizeCampaignResponse(response.data);
}

export async function saveCampaign(payload, campaignId = null) {
  if (campaignId) {
    return updateCampaign(campaignId, payload);
  }

  return createCampaign(payload);
}

/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { normalizeActiveCampaignResponse } from "../adapters/campaignAdapter";
import { isCampaignActive } from "../campaignContracts";
import { getActiveCampaign } from "../services/campaignService";
import { todayStrBogota } from "../../../utils/dateUtils";
import { useAuth } from "../../auth/hooks/useAuth";
import { clearAllCampaignPromoDisplayState } from "../storage/campaignPromoSessionStorage";

const CampaignContext = createContext(undefined);
const CAMPAIGN_SNAPSHOT_STORAGE_KEY = "campaigns.activeCampaign.snapshot";

function isBrowserEnvironment() {
  return typeof window !== "undefined";
}

function clearStoredActiveCampaign() {
  if (!isBrowserEnvironment()) {
    return;
  }

  try {
    window.localStorage.removeItem(CAMPAIGN_SNAPSHOT_STORAGE_KEY);
  } catch {
    // Ignore storage access issues and fail closed.
  }
}

function canUseCampaignSnapshot(campaign, referenceDate = todayStrBogota()) {
  if (!campaign || !isCampaignActive(campaign)) {
    return false;
  }

  if (campaign.endsAt && referenceDate > campaign.endsAt) {
    return false;
  }

  return true;
}

function readStoredActiveCampaign(referenceDate = todayStrBogota()) {
  if (!isBrowserEnvironment()) {
    return null;
  }

  try {
    const snapshot = window.localStorage.getItem(CAMPAIGN_SNAPSHOT_STORAGE_KEY);

    if (!snapshot) {
      return null;
    }

    const normalizedCampaign = normalizeActiveCampaignResponse(JSON.parse(snapshot), {
      referenceDate,
    });

    if (!canUseCampaignSnapshot(normalizedCampaign, referenceDate)) {
      clearStoredActiveCampaign();
      return null;
    }

    return normalizedCampaign;
  } catch {
    clearStoredActiveCampaign();
    return null;
  }
}

function writeStoredActiveCampaign(campaign) {
  if (!isBrowserEnvironment()) {
    return;
  }

  try {
    if (!campaign) {
      window.localStorage.removeItem(CAMPAIGN_SNAPSHOT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(CAMPAIGN_SNAPSHOT_STORAGE_KEY, JSON.stringify(campaign));
  } catch {
    // Ignore storage access issues and keep runtime state in memory.
  }
}

export function CampaignProvider({ children }) {
  const { isAuthenticated, isReady, session } = useAuth();
  const [activeCampaign, setActiveCampaign] = useState(() => readStoredActiveCampaign());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const applyActiveCampaign = useCallback((campaign) => {
    const referenceDate = todayStrBogota();

    if (canUseCampaignSnapshot(campaign, referenceDate)) {
      setActiveCampaign(campaign);
      writeStoredActiveCampaign(campaign);
      return campaign;
    }

    clearStoredActiveCampaign();
    setActiveCampaign(null);
    return null;
  }, []);

  const refreshCampaign = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const campaign = await getActiveCampaign();
      return applyActiveCampaign(campaign);
    } catch (fetchError) {
      setError(fetchError);

      const fallbackCampaign = readStoredActiveCampaign();

      if (fallbackCampaign) {
        setActiveCampaign(fallbackCampaign);
        return fallbackCampaign;
      }

      setActiveCampaign((currentCampaign) =>
        canUseCampaignSnapshot(currentCampaign) ? currentCampaign : null
      );

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [applyActiveCampaign]);

  useEffect(() => {
    refreshCampaign().catch(() => {
      // The provider already fails closed and preserves the last valid snapshot when possible.
    });
  }, [refreshCampaign]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (isAuthenticated && session?.kind === "worker") {
      return;
    }

    clearAllCampaignPromoDisplayState();
  }, [isAuthenticated, isReady, session?.kind]);

  const value = useMemo(
    () => ({
      activeCampaign,
      hasActiveCampaign: Boolean(activeCampaign),
      isLoading,
      error,
      refreshCampaign,
    }),
    [
      activeCampaign,
      error,
      isLoading,
      refreshCampaign,
    ]
  );

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign() {
  const context = useContext(CampaignContext);

  if (!context) {
    throw new Error("useCampaign must be used within a CampaignProvider.");
  }

  return context;
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCampaign } from "../context/CampaignProvider";
import {
  getCampaignPromoDisplayState,
  isCampaignPromoCarryoverOpen,
  markCampaignPromoDisplayed,
  setCampaignPromoCarryoverOpen,
  setCampaignPromoSuppressNextMapDisplay,
  shouldSuppressNextCampaignPromoMapDisplay,
} from "../storage/campaignPromoSessionStorage";

const ADMIN_ROUTE_PREFIXES = ["/administrador", "/campaigns-admin", "/indicador-central-admin"];
const WORLD_MAP_PATH = "/game/world-map";

function hasPathPrefix(pathname, prefixes) {
  return prefixes.some((prefix) => {
    if (pathname === prefix) {
      return true;
    }

    const nextCharacter = pathname.charAt(prefix.length);
    return pathname.startsWith(prefix) && ["/", "_", "-"].includes(nextCharacter);
  });
}

function CampaignFullscreenOverlay({ campaign, onClose, closeLabel }) {
  const imageUrl = campaign?.imageUrl;
  const title = typeof campaign?.title === "string" ? campaign.title.trim() : "Campaña activa";

  if (!imageUrl) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1880,
        background: "rgba(2, 6, 23, 0.96)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          zIndex: 1,
          border: "none",
          borderRadius: 999,
          width: 44,
          height: 44,
          background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
          color: "#fff",
          fontSize: 24,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          lineHeight: 1,
          boxShadow: "0 12px 28px rgba(185, 28, 28, 0.45)",
        }}
        aria-label={closeLabel}
      >
        ×
      </button>

      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "fit-content",
          maxWidth: "94vw",
          maxHeight: "88vh",
        }}
      >
        <img
          src={imageUrl}
          alt={title}
          style={{
            display: "block",
            width: "auto",
            maxWidth: "94vw",
            maxHeight: "88vh",
            objectFit: "contain",
            boxShadow: "0 32px 90px rgba(0, 0, 0, 0.45)",
          }}
        />
      </div>
    </div>
  );
}

export function CampaignCarryoverHost() {
  const location = useLocation();
  const { isAuthenticated, isReady, session } = useAuth();
  const { activeCampaign, hasActiveCampaign } = useCampaign();
  const [isVisible, setIsVisible] = useState(false);
  const previousPathnameRef = useRef("");

  const pathname = location.pathname || "/";
  const isAdminArea = useMemo(() => hasPathPrefix(pathname, ADMIN_ROUTE_PREFIXES), [pathname]);
  const isWorldMapRoute = pathname === WORLD_MAP_PATH;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const previousPathname = previousPathnameRef.current;
    const enteredWorldMap = isWorldMapRoute && previousPathname !== WORLD_MAP_PATH;
    previousPathnameRef.current = pathname;

    if (
      !isAuthenticated ||
      session?.kind !== "worker" ||
      isAdminArea ||
      !isWorldMapRoute ||
      !hasActiveCampaign ||
      !activeCampaign?.imageUrl
    ) {
      setIsVisible(false);
      return;
    }

    const displayState = getCampaignPromoDisplayState(session);
    const shouldResumeCarryover = isCampaignPromoCarryoverOpen(session);
    const shouldSuppressNextMapDisplay = shouldSuppressNextCampaignPromoMapDisplay(session);

    if (!displayState.canDisplay && !shouldResumeCarryover) {
      setIsVisible(false);
      return;
    }

    if (shouldResumeCarryover) {
      setIsVisible(true);
      return;
    }

    if (!enteredWorldMap) {
      return;
    }

    if (shouldSuppressNextMapDisplay) {
      setCampaignPromoSuppressNextMapDisplay(session, false);
      setIsVisible(false);
      return;
    }

    markCampaignPromoDisplayed(session);
    setIsVisible(true);
  }, [
    activeCampaign?.imageUrl,
    hasActiveCampaign,
    isAdminArea,
    isAuthenticated,
    isReady,
    isWorldMapRoute,
    pathname,
    session,
  ]);

  const handleClose = () => {
    setCampaignPromoCarryoverOpen(session, false);
    setIsVisible(false);
  };

  if (!isVisible || !activeCampaign?.imageUrl) {
    return null;
  }

  return (
    <CampaignFullscreenOverlay
      campaign={activeCampaign}
      onClose={handleClose}
      closeLabel="Cerrar campaña"
    />
  );
}

export default CampaignCarryoverHost;

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import RotateScreen from "./RotateScreen";
import StoryIntro from "./StoryIntro";
import WorldMap from "./WorldMap";
import CircleTransition from "./CircleTransition";
import { getStoryIntroDurationMs } from "./storyIntroTiming";
import { getCharacterName } from "../../config/gameConfig";
import { useCampaign } from "../../features/campaigns";
import { useAuth } from "../../features/auth/hooks/useAuth";
import {
  getCampaignPromoDisplayState,
  markCampaignPromoDisplayed,
} from "../../features/campaigns/storage/campaignPromoSessionStorage";

function CampaignStoryIntroTakeover({ campaign, onClose, closeLabel }) {
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
          background: "rgba(15, 23, 42, 0.62)",
          color: "#fff",
          fontSize: 24,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          lineHeight: 1,
          boxShadow: "0 10px 28px rgba(0, 0, 0, 0.35)",
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

function getGameCampaignDisplayEligibility({ step, session, activeCampaign }) {
  if (step !== "story") {
    return { shouldTakeOverStoryIntro: false, shouldSkipStoryIntro: false };
  }

  if (session?.kind !== "worker" || !activeCampaign?.imageUrl) {
    return { shouldTakeOverStoryIntro: false, shouldSkipStoryIntro: false };
  }

  const displayState = getCampaignPromoDisplayState(session);

  if (displayState.canDisplay) {
    return { shouldTakeOverStoryIntro: true, shouldSkipStoryIntro: false };
  }

  return { shouldTakeOverStoryIntro: false, shouldSkipStoryIntro: true };
}

function GameFlow({ step }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { activeCampaign } = useCampaign();

  const [revealing, setRevealing] = useState(step !== "rotate");
  const [covering, setCovering] = useState(false);
  const [isCampaignTakeoverVisible, setIsCampaignTakeoverVisible] = useState(false);
  const hasRegisteredPromoDisplayRef = useRef(false);
  const autoAdvanceTimerRef = useRef(null);

  const character = localStorage.getItem("selectedCharacter") || "bomberman";
  const obraName =
    localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "la construcción";

  const storyIntroDurationMs = useMemo(
    () => getStoryIntroDurationMs(getCharacterName(character), obraName),
    [character, obraName]
  );

  const { shouldTakeOverStoryIntro, shouldSkipStoryIntro } = useMemo(
    () =>
      getGameCampaignDisplayEligibility({
        step,
        session,
        activeCampaign,
      }),
    [activeCampaign, session, step]
  );

  useEffect(() => {
    if (!shouldTakeOverStoryIntro) {
      setIsCampaignTakeoverVisible(false);
      hasRegisteredPromoDisplayRef.current = false;
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
      return undefined;
    }

    setIsCampaignTakeoverVisible(true);

    if (!hasRegisteredPromoDisplayRef.current) {
      markCampaignPromoDisplayed(session);
      hasRegisteredPromoDisplayRef.current = true;
    }

    autoAdvanceTimerRef.current = window.setTimeout(() => {
      setIsCampaignTakeoverVisible(false);
      setCovering(true);
    }, storyIntroDurationMs);

    return () => {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    };
  }, [activeCampaign?.id, session, shouldTakeOverStoryIntro, storyIntroDurationMs]);

  if (!localStorage.getItem("selectedCharacter") && step !== "rotate") {
    return <Navigate to="/bienvenida" replace />;
  }

  if (step === "story" && shouldSkipStoryIntro) {
    return <Navigate to="/game/world-map" replace />;
  }

  const handleStepComplete = () => setCovering(true);

  const handleCoverDone = () => {
    if (step === "rotate") navigate("/game/story-intro", { replace: true });
    if (step === "story") navigate("/game/world-map", { replace: true });
  };

  const handleCampaignTakeoverClose = () => {
    window.clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = null;
    setIsCampaignTakeoverVisible(false);
    setCovering(true);
  };

  return (
    <>
      {step === "rotate" && <RotateScreen duration={4000} onComplete={handleStepComplete} />}

      {step === "story" && !shouldTakeOverStoryIntro && (
        <StoryIntro character={character} obraName={obraName} onComplete={handleStepComplete} />
      )}

      {step === "map" && <WorldMap />}

      {revealing && <CircleTransition direction="in" onDone={() => setRevealing(false)} />}

      {covering && <CircleTransition direction="out" onDone={handleCoverDone} />}

      {step === "story" && shouldTakeOverStoryIntro && isCampaignTakeoverVisible ? (
        <CampaignStoryIntroTakeover
          campaign={activeCampaign}
          onClose={handleCampaignTakeoverClose}
          closeLabel="Cerrar campaña y continuar al mapa"
        />
      ) : null}
    </>
  );
}

export default GameFlow;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createDefaultCampaign, resolveCampaignStatus } from "../campaignContracts";
import { getCampaigns, saveCampaign } from "../services/campaignService";

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

function sortCampaigns(campaigns = []) {
  const statusPriority = {
    active: 0,
    scheduled: 1,
    inactive: 2,
  };

  return [...campaigns].sort((left, right) => {
    const leftPriority = statusPriority[left?.status] ?? 99;
    const rightPriority = statusPriority[right?.status] ?? 99;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftStart = left?.startsAt || "9999-12-31";
    const rightStart = right?.startsAt || "9999-12-31";

    if (leftStart !== rightStart) {
      return leftStart.localeCompare(rightStart);
    }

    return (left?.title || "").localeCompare(right?.title || "");
  });
}

function createCampaignDraft(campaign = {}) {
  const defaultCampaign = createDefaultCampaign();
  const hasPermanentValue = typeof campaign.permanent === "boolean";
  const hasEnabledValue = typeof campaign.enabled === "boolean";

  return {
    ...defaultCampaign,
    ...campaign,
    title: campaign?.title || "",
    enabled: hasEnabledValue ? campaign.enabled : campaign?.status !== "inactive",
    permanent: hasPermanentValue ? campaign.permanent : campaign?.scheduleType === "permanent",
    imageUrl: campaign?.imageUrl || "",
    imageFile: null,
    imagePreviewUrl: campaign?.imageUrl || "",
    startsAt: campaign?.startsAt || null,
    endsAt: campaign?.endsAt || null,
  };
}

function validateCampaignDraft(campaignDraft, isEditing = false) {
  const errors = {};

  if (!campaignDraft.title.trim()) {
    errors.title = "El nombre de la campaña es obligatorio.";
  }

  const hasImageUrl = Boolean(campaignDraft.imageUrl?.trim());
  const hasImageFile = Boolean(campaignDraft.imageFile);

  if (!hasImageFile && !(isEditing && hasImageUrl)) {
    errors.imageFile = "La imagen principal es obligatoria.";
  }

  if (!campaignDraft.permanent) {
    if (!campaignDraft.startsAt) {
      errors.startsAt = "La fecha de inicio es obligatoria para un rango.";
    }

    if (!campaignDraft.endsAt) {
      errors.endsAt = "La fecha de fin es obligatoria para un rango.";
    }

    if (
      campaignDraft.startsAt &&
      campaignDraft.endsAt &&
      campaignDraft.endsAt < campaignDraft.startsAt
    ) {
      errors.endsAt = "La fecha de fin no puede ser menor que la de inicio.";
    }
  }

  return errors;
}

function buildSubmitPayload(campaignDraft) {
  const basePayload = {
    title: campaignDraft.title.trim(),
    enabled: Boolean(campaignDraft.enabled),
    permanent: Boolean(campaignDraft.permanent),
  };

  if (!campaignDraft.permanent) {
    if (campaignDraft.startsAt) {
      basePayload.startsAt = campaignDraft.startsAt;
    }

    if (campaignDraft.endsAt) {
      basePayload.endsAt = campaignDraft.endsAt;
    }
  }

  if (!campaignDraft.imageFile) {
    return basePayload;
  }

  const formData = new FormData();

  Object.entries(basePayload).forEach(([key, value]) => {
    formData.append(key, typeof value === "boolean" ? String(value) : value);
  });

  formData.append("image", campaignDraft.imageFile);

  return formData;
}

export function useCampaignAdmin() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState("");
  const [campaignDraft, setCampaignDraft] = useState(() => createCampaignDraft());
  const draftImagePreviewUrlRef = useRef("");

  const releaseDraftImagePreviewUrl = useCallback(() => {
    if (
      draftImagePreviewUrlRef.current &&
      draftImagePreviewUrlRef.current.startsWith("blob:")
    ) {
      URL.revokeObjectURL(draftImagePreviewUrlRef.current);
    }

    draftImagePreviewUrlRef.current = "";
  }, []);

  const setCampaignImageFile = useCallback(
    (file) => {
      releaseDraftImagePreviewUrl();

      setCampaignDraft((currentDraft) => {
        const nextPreviewUrl = file ? URL.createObjectURL(file) : currentDraft.imageUrl || "";

        draftImagePreviewUrlRef.current = file ? nextPreviewUrl : "";

        return {
          ...currentDraft,
          imageFile: file || null,
          imagePreviewUrl: nextPreviewUrl,
        };
      });
    },
    [releaseDraftImagePreviewUrl]
  );

  const loadCampaignList = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getCampaigns();
      setCampaigns(sortCampaigns(response));
      return response;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudieron cargar las campañas."));
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaignList().catch(() => {});
  }, [loadCampaignList]);

  useEffect(
    () => () => {
      releaseDraftImagePreviewUrl();
    },
    [releaseDraftImagePreviewUrl]
  );

  const validationErrors = useMemo(
    () => validateCampaignDraft(campaignDraft, Boolean(editingCampaignId)),
    [campaignDraft, editingCampaignId]
  );

  const draftEffectiveStatus = useMemo(
    () =>
      resolveCampaignStatus({
        enabled: campaignDraft.enabled,
        scheduleType: campaignDraft.permanent ? "permanent" : campaignDraft.scheduleType,
        startsAt: campaignDraft.startsAt,
        endsAt: campaignDraft.endsAt,
      }),
    [campaignDraft.enabled, campaignDraft.endsAt, campaignDraft.permanent, campaignDraft.scheduleType, campaignDraft.startsAt]
  );

  const statusSummary = useMemo(
    () =>
      campaigns.reduce(
        (summary, campaign) => {
          const statusKey = campaign?.status;

          if (statusKey && Object.hasOwn(summary, statusKey)) {
            summary[statusKey] += 1;
          }

          return summary;
        },
        { active: 0, scheduled: 0, inactive: 0 }
      ),
    [campaigns]
  );

  const activeCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.status === "active"),
    [campaigns]
  );

  const singleActiveRuleState = useMemo(() => {
    if (activeCampaigns.length > 1) {
      return {
        tone: "danger",
        message: `Hay ${activeCampaigns.length} campañas activas de forma efectiva. La regla visible del producto permite una sola activa a la vez.`,
      };
    }

    if (activeCampaigns.length === 1) {
      return {
        tone: "success",
        message: `Campaña efectiva actual: ${activeCampaigns[0].title || "Sin nombre"}.`,
      };
    }

    return {
      tone: "neutral",
      message: "No hay una campaña activa en este momento. La intro normal seguirá visible.",
    };
  }, [activeCampaigns]);

  const openCreateModal = useCallback(() => {
    setSubmitError(null);
    setSuccessMessage("");
    setEditingCampaignId("");
    releaseDraftImagePreviewUrl();
    setCampaignDraft(createCampaignDraft());
    setIsModalOpen(true);
  }, [releaseDraftImagePreviewUrl]);

  const openEditModal = useCallback(
    (campaign) => {
      setSubmitError(null);
      setSuccessMessage("");
      setEditingCampaignId(campaign?.id || "");
      releaseDraftImagePreviewUrl();
      setCampaignDraft(createCampaignDraft(campaign));
      setIsModalOpen(true);
    },
    [releaseDraftImagePreviewUrl]
  );

  const closeModal = useCallback(() => {
    setSubmitError(null);
    setEditingCampaignId("");
    releaseDraftImagePreviewUrl();
    setCampaignDraft(createCampaignDraft());
    setIsModalOpen(false);
  }, [releaseDraftImagePreviewUrl]);

  const updateDraftField = useCallback((field, value) => {
    setCampaignDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }, []);

  const submitCampaign = useCallback(async () => {
    const currentErrors = validateCampaignDraft(campaignDraft, Boolean(editingCampaignId));

    if (Object.keys(currentErrors).length) {
      setSubmitError("Revisá los campos obligatorios antes de guardar.");
      return { ok: false, validationErrors: currentErrors };
    }

    setSaving(true);
    setSubmitError(null);

    try {
      await saveCampaign(
        buildSubmitPayload(campaignDraft),
        editingCampaignId || null
      );
      await loadCampaignList();
      setSuccessMessage(editingCampaignId ? "Campaña actualizada correctamente." : "Campaña creada correctamente.");
      closeModal();
      return { ok: true };
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "No se pudo guardar la campaña."));
      return { ok: false, requestError };
    } finally {
      setSaving(false);
    }
  }, [campaignDraft, closeModal, editingCampaignId, loadCampaignList]);

  return {
    campaigns,
    loading,
    saving,
    error,
    submitError,
    successMessage,
    isModalOpen,
    editingCampaignId,
    campaignDraft,
    validationErrors,
    draftEffectiveStatus,
    statusSummary,
    singleActiveRuleState,
    hasCampaigns: campaigns.length > 0,
    loadCampaignList,
    openCreateModal,
    openEditModal,
    closeModal,
    updateDraftField,
    setCampaignImageFile,
    submitCampaign,
  };
}

export default useCampaignAdmin;

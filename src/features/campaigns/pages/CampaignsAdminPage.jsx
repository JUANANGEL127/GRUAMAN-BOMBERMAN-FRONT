import { useMemo } from "react";
import {
  getLegacyAdminRole,
  getSessionHomePath,
} from "../../auth/adapters/authSessionAdapter";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCampaignAdmin } from "../hooks/useCampaignAdmin";
import "../../indicador-central/indicador-central.css";

const STATUS_LABELS = {
  active: "Activa",
  inactive: "Inactiva",
  scheduled: "Programada",
};

const PERIOD_LABELS = {
  permanent: "Permanente",
  range: "Rango de fechas",
};

const STATUS_CLASS_NAMES = {
  active: "indicador-central-status indicador-central-status--success",
  inactive: "indicador-central-status indicador-central-status--neutral",
  scheduled: "indicador-central-status indicador-central-status--warning",
  danger: "indicador-central-status indicador-central-status--danger",
  neutral: "indicador-central-status indicador-central-status--neutral",
  success: "indicador-central-status indicador-central-status--success",
};

function formatDateLabel(value) {
  if (!value) return "Sin fecha";

  return new Date(`${value}T00:00:00`).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPeriodLabel(campaign) {
  if (campaign.scheduleType === "permanent") {
    return "Siempre visible mientras siga activa.";
  }

  return `${formatDateLabel(campaign.startsAt)} → ${formatDateLabel(campaign.endsAt)}`;
}

function resolveBackLinkLabel(adminRole) {
  return adminRole === "bomberman" ? "Volver al menú Bomberman" : "Volver al menú Gruaman";
}

function InfoBadge() {
  return (
    <span
      className="indicador-central-status indicador-central-status--info"
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      aria-label="Información"
      title="Información"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 10.2v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="7.4" r="1.2" fill="currentColor" />
      </svg>
      Informativo
    </span>
  );
}

function CampaignsAdminPageShell({ adminRole, backPath }) {
  const {
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
    hasCampaigns,
    openCreateModal,
    openEditModal,
    closeModal,
    updateDraftField,
    setCampaignImageFile,
    submitCampaign,
  } = useCampaignAdmin();

  const currentImagePreviewUrl = campaignDraft.imagePreviewUrl || campaignDraft.imageUrl || "";

  return (
    <section className="indicador-central-page" aria-label="Administración de comunicados del héroe">
      <header className="indicador-central-page__header">
        <div>
          <p className="indicador-central-page__eyebrow">Admin Panel</p>
          <h1 className="indicador-central-page__title">Comunicados del héroe</h1>
          <p className="indicador-central-page__subtitle">
            Administra comunicados compartidos para Gruaman y Bomberman. Aqui centralizas las campañas, su vigencia y su imagen principal sin retrasos ni depender de alguien más.
          </p>
        </div>
        <a
          className="indicador-central-page__back-link hover:[background:linear-gradient(145deg,#0057ff,#1976d2)] hover:[box-shadow:0_6px_15px_rgba(25,118,210,0.28)] hover:border-[#1976d2]"
          style={{ color: "#fff" }}
          href={backPath}
        >
          {resolveBackLinkLabel(adminRole)}
        </a>
      </header>

      <main className="indicador-central-page__content">
        <section className="indicador-central-card">
          <div className="indicador-central-card__header">
            <div>
              <h2>Estado operativo</h2>
              <p className="indicador-central-card__description">
                El frontend sólo muestra una campaña efectiva activa a la vez. Podés mantener varias programadas o inactivas, pero la regla visible del producto sigue siendo singular.
              </p>
            </div>
            <InfoBadge />
          </div>

          <div className="indicador-central-compact-summary">
            <div className="indicador-central-result-item">
              <span className="indicador-central-result-item__label">Activas efectivas</span>
              <strong>{statusSummary.active}</strong>
            </div>
            <div className="indicador-central-result-item">
              <span className="indicador-central-result-item__label">Programadas</span>
              <strong>{statusSummary.scheduled}</strong>
            </div>
            <div className="indicador-central-result-item">
              <span className="indicador-central-result-item__label">Inactivas</span>
              <strong>{statusSummary.inactive}</strong>
            </div>
            <div className="indicador-central-result-item">
              <span className="indicador-central-result-item__label">Regla de campaña activa</span>
              <strong>{singleActiveRuleState.message}</strong>
            </div>
          </div>

          {successMessage ? (
            <p className="indicador-central-inline-alert indicador-central-inline-alert--success">{successMessage}</p>
          ) : null}
          {error ? <p className="indicador-central-inline-alert indicador-central-inline-alert--error">{error}</p> : null}

          <div className="indicador-central-actions indicador-central-actions--single">
            <button type="button" className="indicador-central-button" onClick={openCreateModal}>
              Crear comunicado
            </button>
          </div>
        </section>

        <section className="indicador-central-card">
          <div className="indicador-central-card__header">
            <div>
              <h2>Listado administrable</h2>
              <p className="indicador-central-card__description">
                Cada registro usa el contrato ya normalizado del feature. Editá nombre, imagen principal, periodo y estado dentro del alcance que hoy soporta el frontend.
              </p>
            </div>
            <span className="indicador-central-status indicador-central-status--info">
              {loading ? "Sincronizando" : `${campaigns.length} campañas`}
            </span>
          </div>

          {!loading && !hasCampaigns ? (
            <p className="indicador-central-empty-state">
              Todavía no hay campañas cargadas. Creá la primera para empezar a controlar la intro promocional.
            </p>
          ) : null}

          <div className="indicador-central-section-stack">
            {campaigns.map((campaign) => (
              <article key={campaign.id || `${campaign.title}-${campaign.startsAt || "no-start"}`} className="indicador-central-nested-card">
                <div className="indicador-central-card__header">
                  <div>
                    <h3>{campaign.title || "Campaña sin nombre"}</h3>
                    <p className="indicador-central-card__description">
                      {formatPeriodLabel(campaign)}
                    </p>
                  </div>
                  <span className={STATUS_CLASS_NAMES[campaign.status] || STATUS_CLASS_NAMES.inactive}>
                    {STATUS_LABELS[campaign.status] || campaign.status}
                  </span>
                </div>

                <div className="indicador-central-form-grid">
                  <div className="indicador-central-result-item">
                    <span className="indicador-central-result-item__label">Periodo</span>
                    <strong>{PERIOD_LABELS[campaign.scheduleType] || campaign.scheduleType}</strong>
                  </div>
                  <div className="indicador-central-result-item">
                    <span className="indicador-central-result-item__label">Imagen principal</span>
                    <strong>{campaign.imageUrl || "Sin imagen"}</strong>
                  </div>
                  <div className="indicador-central-result-item">
                    <span className="indicador-central-result-item__label">Regla efectiva</span>
                    <strong>
                      {campaign.status === "active"
                        ? "Hoy tapa la intro y muestra promo."
                        : campaign.status === "scheduled"
                          ? "Queda lista para activarse por fecha."
                          : "No interviene en la experiencia pública."}
                    </strong>
                  </div>
                </div>

                {campaign.imageUrl ? (
                  <div className="indicador-central-result-item">
                    <span className="indicador-central-result-item__label">Vista rápida</span>
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.title || "Vista previa de campaña"}
                      style={{
                        width: "100%",
                        maxHeight: 220,
                        objectFit: "contain",
                        borderRadius: 12,
                        background: "rgba(248,250,252,0.95)",
                      }}
                    />
                  </div>
                ) : null}

                <div className="indicador-central-actions indicador-central-actions--single">
                  <button
                    type="button"
                    className="indicador-central-button indicador-central-button--secondary"
                    onClick={() => openEditModal(campaign)}
                  >
                    Editar comunicado
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {isModalOpen ? (
        <div
          aria-modal="true"
          role="dialog"
          aria-label={editingCampaignId ? "Editar comunicado" : "Crear comunicado"}
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(15, 23, 42, 0.48)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            className="indicador-central-card"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(760px, 100%)",
              maxHeight: "calc(100vh - 32px)",
              overflowY: "auto",
            }}
          >
            <div className="indicador-central-card__header">
              <div>
                <h2>{editingCampaignId ? "Editar comunicado" : "Nuevo comunicado"}</h2>
                <p className="indicador-central-card__description">
                  Nombre obligatorio, imagen principal por archivo y periodo permanente o por rango. La carga ahora usa archivo directo para simplificar el flujo.
                </p>
              </div>
              <span className={STATUS_CLASS_NAMES[draftEffectiveStatus] || STATUS_CLASS_NAMES.neutral}>
                Efectiva: {STATUS_LABELS[draftEffectiveStatus] || draftEffectiveStatus}
              </span>
            </div>

            <div className="indicador-central-form-grid">
              <div className="indicador-central-field-group indicador-central-field-group--full">
                <label className="indicador-central-label" htmlFor="campaign-title">
                  Nombre
                </label>
                <input
                  id="campaign-title"
                  className="indicador-central-input"
                  type="text"
                  value={campaignDraft.title}
                  placeholder="Promo Gruaman / Bomberman"
                  onChange={(event) => updateDraftField("title", event.target.value)}
                />
                {validationErrors.title ? (
                  <p className="indicador-central-inline-alert indicador-central-inline-alert--error">{validationErrors.title}</p>
                ) : null}
              </div>

              <div className="indicador-central-field-group">
                <label className="indicador-central-label" htmlFor="campaign-enabled">
                  Habilitada
                </label>
                <label
                  className="indicador-central-card__description"
                  style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                  htmlFor="campaign-enabled"
                >
                  <input
                    id="campaign-enabled"
                    type="checkbox"
                    checked={campaignDraft.enabled}
                    onChange={(event) => updateDraftField("enabled", event.target.checked)}
                  />
                  La campaña quedará disponible para activarse según su periodo.
                </label>
              </div>

              <div className="indicador-central-field-group">
                <label className="indicador-central-label" htmlFor="campaign-period-type">
                  Tipo de periodo
                </label>
                <select
                  id="campaign-period-type"
                  className="indicador-central-input"
                  value={campaignDraft.scheduleType}
                  onChange={(event) => updateDraftField("scheduleType", event.target.value)}
                >
                  <option value="permanent">Permanente</option>
                  <option value="range">Rango de fechas</option>
                </select>
              </div>

              <div className="indicador-central-field-group indicador-central-field-group--full">
                <label className="indicador-central-label" htmlFor="campaign-image-file">
                  Imagen principal
                </label>
                <input
                  id="campaign-image-file"
                  className="indicador-central-input"
                  type="file"
                  accept="image/*"
                  placeholder="Selecciona un archivo"
                  onChange={(event) => setCampaignImageFile(event.target.files?.[0] || null)}
                />
                <p className="indicador-central-card__description">
                  Sube un archivo JPG, PNG o WebP. Ese archivo es el que el backend debe recibir para enviarlo al storage definido.
                </p>
                {validationErrors.imageFile ? (
                  <p className="indicador-central-inline-alert indicador-central-inline-alert--error">{validationErrors.imageFile}</p>
                ) : null}
                {currentImagePreviewUrl ? (
                  <div className="indicador-central-result-item" style={{ marginTop: 12 }}>
                    <span className="indicador-central-result-item__label">
                    {campaignDraft.imageFile ? "Archivo seleccionado" : "Imagen actual"}
                    </span>
                    <img
                      src={currentImagePreviewUrl}
                      alt={campaignDraft.title || "Vista previa de campaña"}
                      style={{
                        width: "100%",
                        maxHeight: 240,
                        objectFit: "contain",
                        borderRadius: 12,
                        background: "rgba(248,250,252,0.95)",
                      }}
                    />
                    {campaignDraft.imageFile ? (
                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className="indicador-central-button indicador-central-button--secondary"
                          onClick={() => setCampaignImageFile(null)}
                        >
                          Quitar archivo
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {campaignDraft.scheduleType === "range" ? (
                <>
                  <div className="indicador-central-field-group">
                    <label className="indicador-central-label" htmlFor="campaign-starts-at">
                      Fecha de inicio
                    </label>
                    <input
                      id="campaign-starts-at"
                      className="indicador-central-input"
                      type="date"
                      value={campaignDraft.startsAt || ""}
                      onChange={(event) => updateDraftField("startsAt", event.target.value || null)}
                    />
                    {validationErrors.startsAt ? (
                      <p className="indicador-central-inline-alert indicador-central-inline-alert--error">{validationErrors.startsAt}</p>
                    ) : null}
                  </div>

                  <div className="indicador-central-field-group">
                    <label className="indicador-central-label" htmlFor="campaign-ends-at">
                      Fecha de fin
                    </label>
                    <input
                      id="campaign-ends-at"
                      className="indicador-central-input"
                      type="date"
                      value={campaignDraft.endsAt || ""}
                      onChange={(event) => updateDraftField("endsAt", event.target.value || null)}
                    />
                    {validationErrors.endsAt ? (
                      <p className="indicador-central-inline-alert indicador-central-inline-alert--error">{validationErrors.endsAt}</p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>

            <div className="indicador-central-compact-summary" style={{ marginTop: 20 }}>
              <div className="indicador-central-result-item">
                <span className="indicador-central-result-item__label">Estado efectivo</span>
                <strong>{STATUS_LABELS[draftEffectiveStatus] || draftEffectiveStatus}</strong>
              </div>
              <div className="indicador-central-result-item">
                <span className="indicador-central-result-item__label">Regla visible</span>
                <strong>
                  {draftEffectiveStatus === "active"
                    ? "Si otra campaña también queda activa, el panel mostrará conflicto."
                    : draftEffectiveStatus === "scheduled"
                      ? "Queda esperando su ventana para reemplazar la intro."
                      : "No impacta la pantalla pública hasta volver a activarse."}
                </strong>
              </div>
            </div>

            {submitError ? (
              <p className="indicador-central-inline-alert indicador-central-inline-alert--error" style={{ marginTop: 20 }}>
                {submitError}
              </p>
            ) : null}

            <div className="indicador-central-actions" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="indicador-central-button indicador-central-button--secondary"
                onClick={closeModal}
                disabled={saving}
              >
                Cancelar
              </button>
              <button type="button" className="indicador-central-button" onClick={submitCampaign} disabled={saving}>
                {saving ? "Guardando..." : editingCampaignId ? "Guardar cambios" : "Crear comunicado"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function CampaignsAdminPage() {
  const { isHydrating, isReady, session } = useAuth();
  const adminRole = useMemo(() => getLegacyAdminRole(session), [session]);
  const backPath = useMemo(() => getSessionHomePath(session), [session]);

  if (!isReady || isHydrating || !adminRole) {
    return (
      <section className="indicador-central-page indicador-central-page--loading" aria-label="Loading campaigns admin access">
        <div className="indicador-central-card">
          <p className="indicador-central-card__description">Validando acceso administrativo a comunicados...</p>
        </div>
      </section>
    );
  }

  return <CampaignsAdminPageShell adminRole={adminRole} backPath={backPath} />;
}

export default CampaignsAdminPage;


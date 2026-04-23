import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfigSection } from "../components/ConfigSection";
import { ExecutionSection } from "../components/ExecutionSection";
import { IndicadorCentralTabs } from "../components/IndicadorCentralTabs";
import { useIndicadorCentralCompanies } from "../hooks/useIndicadorCentralCompanies";
import { useIndicadorCentralConfig } from "../hooks/useIndicadorCentralConfig";
import { useIndicadorCentralDownload } from "../hooks/useIndicadorCentralDownload";
import { useIndicadorCentralExecution } from "../hooks/useIndicadorCentralExecution";
import "../indicador-central.css";

const INDICADOR_CENTRAL_ADMIN_ROLES = new Set(["gruaman", "bomberman"]);
const INDICADOR_TABS = [
  { id: "configuracion", label: "Configuración" },
  { id: "ejecucion", label: "Descarga" },
];

function resolveAdminHome(adminRole) {
  if (adminRole === "bomberman") return "/administrador_bomberman";
  return "/administrador";
}

function resolveUpdatedBy(adminRole) {
  return adminRole ? `panel.${adminRole}` : "panel.indicador_central";
}

function IndicadorCentralAdminShell({ adminRole }) {
  const [activeTab, setActiveTab] = useState("configuracion");
  const {
    config,
    setConfig,
    loading,
    saving,
    error: configError,
    supportedCutTypes: configCutTypes,
    hasUnsavedChanges,
    lastSavedAt,
    saveConfig,
    resetConfig,
  } = useIndicadorCentralConfig({ updatedBy: resolveUpdatedBy(adminRole) });
  const {
    companies,
    loading: companiesLoading,
    error: companiesError,
  } = useIndicadorCentralCompanies();
  const {
    execution,
    setExecutionField,
    downloading,
    error: executionError,
    canExecute,
    supportedCutTypes,
    lastExecutedAt,
    lastFileName,
    runExecution,
    syncSupportedCutTypes,
  } = useIndicadorCentralExecution();
  const { downloadWorkbook } = useIndicadorCentralDownload();

  useEffect(() => {
    if (!configCutTypes.length) return;
    syncSupportedCutTypes({ tipos_corte_disponibles: configCutTypes });
  }, [configCutTypes, syncSupportedCutTypes]);

  const backPath = useMemo(() => resolveAdminHome(adminRole), [adminRole]);

  function updateConfig(updater) {
    setConfig((currentConfig) => (typeof updater === "function" ? updater(currentConfig) : updater));
  }

  async function handleSaveConfig() {
    try {
      await saveConfig();
    } catch {
      // The hook already exposes the human-readable error state.
    }
  }

  async function handleRunExecution() {
    try {
      await runExecution(downloadWorkbook);
    } catch {
      // The hook already exposes the human-readable error state.
    }
  }

  return (
    <section className="indicador-central-page" aria-label="Indicador Central admin">
      <header className="indicador-central-page__header">
        <div>
          <p className="indicador-central-page__eyebrow">Admin panel</p>
          <h1 className="indicador-central-page__title">Indicador Central</h1>
          <p className="indicador-central-page__subtitle">
            Configura la generación automatica del informe y descarga en Excel directo desde el formulario, sin pasos intermedios.
          </p>
        </div>
        <a className="indicador-central-page__back-link" href={backPath}>
          Volver al menú admin
        </a>
      </header>

      <IndicadorCentralTabs activeTab={activeTab} onChange={setActiveTab} tabs={INDICADOR_TABS} />

      <main className="indicador-central-page__content">
        {activeTab === "configuracion" ? (
          <section
            className="indicador-central-page__panel"
            id="indicador-central-panel-configuracion"
            role="tabpanel"
            aria-labelledby="indicador-central-tab-configuracion"
          >
            <ConfigSection
              config={config}
              companyOptions={companies}
              companiesLoading={companiesLoading}
              companiesError={companiesError}
              loading={loading}
              saving={saving}
              error={configError}
              hasUnsavedChanges={hasUnsavedChanges}
              lastSavedAt={lastSavedAt}
              onChange={updateConfig}
              onSave={handleSaveConfig}
              onReset={resetConfig}
            />
          </section>
        ) : (
          <section
            className="indicador-central-page__panel"
            id="indicador-central-panel-ejecucion"
            role="tabpanel"
            aria-labelledby="indicador-central-tab-ejecucion"
          >
            <ExecutionSection
              execution={execution}
              supportedCutTypes={supportedCutTypes}
              submitting={downloading}
              canExecute={canExecute}
              error={executionError}
              lastExecutedAt={lastExecutedAt}
              lastFileName={lastFileName}
              onFieldChange={setExecutionField}
              onExecute={handleRunExecution}
            />
          </section>
        )}
      </main>
    </section>
  );
}

export function IndicadorCentralAdminPage() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState({ ready: false, adminRole: null });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const adminRole = window.localStorage.getItem("admin_rol");
    if (!INDICADOR_CENTRAL_ADMIN_ROLES.has(adminRole)) {
      navigate("/cedula", { replace: true });
      return;
    }

    setAuthState({ ready: true, adminRole });
  }, [navigate]);

  if (!authState.ready) {
    return (
      <section className="indicador-central-page indicador-central-page--loading" aria-label="Loading admin access">
        <div className="indicador-central-card">
          <p className="indicador-central-card__description">Validando acceso administrativo...</p>
        </div>
      </section>
    );
  }

  return <IndicadorCentralAdminShell adminRole={authState.adminRole} />;
}

export default IndicadorCentralAdminPage;

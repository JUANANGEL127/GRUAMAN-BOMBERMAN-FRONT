import { useMemo } from "react";
import { IndicadorCentralListEditor } from "./IndicadorCentralListEditor";
import { IndicadorCentralInfoTip } from "./IndicadorCentralInfoTip";
import { IndicadorCentralWorkerSearchEditor } from "./IndicadorCentralWorkerSearchEditor";

function formatCompanyLabel(companyKey, companyOptions = []) {
  const matchedCompany = companyOptions.find((company) => company.value === String(companyKey));
  return matchedCompany?.label || `Empresa ${companyKey}`;
}

function formatWorksiteOptionLabel(worksite, companyOptions = []) {
  if (!worksite) return "Sin obra definida";

  const labelParts = [worksite.name || worksite.label || `Obra ${worksite.value}`];

  if (worksite.companyValue) {
    labelParts.push(formatCompanyLabel(worksite.companyValue, companyOptions));
  }

  if (worksite.label && worksite.label !== worksite.name) {
    const extraSegments = worksite.label
      .split(" · ")
      .slice(1)
      .filter((segment) => segment !== "Inactiva");

    labelParts.push(...extraSegments);
  }

  if (worksite.active === false) {
    labelParts.push("Inactiva");
  }

  return [...new Set(labelParts.filter(Boolean))].join(" · ");
}

function formatWorksiteLabel(scope, worksiteOptions = [], companyOptions = []) {
  const matchedWorksite = worksiteOptions.find((worksite) => worksite.value === String(scope.obraId));
  if (matchedWorksite) return formatWorksiteOptionLabel(matchedWorksite, companyOptions);
  if (scope.obraNombre && scope.obraId) return `${scope.obraNombre} · ${scope.obraId}`;
  if (scope.obraNombre) return scope.obraNombre;
  if (scope.obraId) return `Obra ${scope.obraId}`;
  return "Sin obra definida";
}

function buildScopeSummary(scope, companyOptions = [], worksiteOptions = []) {
  const companiesLabel = scope.empresaIds.length
    ? scope.empresaIds.map((companyId) => formatCompanyLabel(String(companyId), companyOptions)).join(", ")
    : "sin empresas definidas";
  const worksiteLabel = scope.segmentarPorObra ? formatWorksiteLabel(scope, worksiteOptions, companyOptions) : "Desactivada";
  const namesLabel = scope.nombres.length ? `${scope.nombres.length} nombres específicos` : "Sin nombres adicionales";

  return [
    { label: "Empresas activas", value: companiesLabel },
    { label: "Filtro por obra", value: worksiteLabel },
    { label: "Segmentación nominal", value: namesLabel },
  ];
}

export function ConfigSection({
  config,
  companyOptions = [],
  companiesLoading = false,
  companiesError = null,
  worksiteOptions = [],
  worksitesLoading = false,
  worksitesError = null,
  loading,
  saving,
  error,
  hasUnsavedChanges,
  lastSavedAt,
  onChange,
  onSave,
  onReset,
}) {
  const companyKeys = Object.keys(config.formatosPorEmpresa || {}).sort((left, right) => Number(left) - Number(right));
  const filteredWorksiteOptions = useMemo(() => {
    const selectedCompanyIds = new Set(config.scope.empresaIds.map(String));
    const selectedWorksiteId = config.scope.obraId === null ? null : String(config.scope.obraId);

    return worksiteOptions.filter((worksite) => {
      if (selectedWorksiteId && worksite.value === selectedWorksiteId) return true;
      if (!selectedCompanyIds.size) return true;
      return !worksite.companyValue || selectedCompanyIds.has(worksite.companyValue);
    });
  }, [config.scope.empresaIds, config.scope.obraId, worksiteOptions]);
  const decoratedWorksiteOptions = useMemo(
    () =>
      filteredWorksiteOptions.map((worksite) => ({
        ...worksite,
        displayLabel: formatWorksiteOptionLabel(worksite, companyOptions),
      })),
    [filteredWorksiteOptions, companyOptions]
  );
  const scopeSummary = buildScopeSummary(config.scope, companyOptions, decoratedWorksiteOptions);

  function updateThreshold(field, value) {
    onChange((currentConfig) => ({
      ...currentConfig,
      umbrales: {
        ...currentConfig.umbrales,
        [field]: value === "" ? "" : Number(value),
      },
    }));
  }

  function updateScopeField(field, value) {
    onChange((currentConfig) => ({
      ...currentConfig,
      scope: {
        ...currentConfig.scope,
        [field]: value,
      },
    }));
  }

  function toggleSegmentarPorObra(nextValue) {
    onChange((currentConfig) => ({
      ...currentConfig,
      scope: {
        ...currentConfig.scope,
        segmentarPorObra: nextValue,
        obraId: nextValue ? currentConfig.scope.obraId : null,
        obraNombre: nextValue ? currentConfig.scope.obraNombre : null,
      },
    }));
  }

  function updateCompanyFormats(companyKey, nextFormats) {
    onChange((currentConfig) => ({
      ...currentConfig,
      formatosPorEmpresa: {
        ...currentConfig.formatosPorEmpresa,
        [companyKey]: nextFormats,
      },
    }));
  }

  function updateSelectedWorksite(worksiteId) {
    const selectedWorksite = decoratedWorksiteOptions.find((worksite) => worksite.value === worksiteId) || null;

    onChange((currentConfig) => ({
      ...currentConfig,
      scope: {
        ...currentConfig.scope,
        obraId: selectedWorksite ? Number(selectedWorksite.value) : null,
        obraNombre: selectedWorksite?.name || null,
      },
    }));
  }

  return (
    <section className="indicador-central-card">
      <div className="indicador-central-card__header">
        <div>
          <h2>Configuración del indicador</h2>
          <p className="indicador-central-card__description">
            Edita sólo la configuración necesaria para la generación del reporte: destinatarios, umbrales, cargos a tener en cuenta (Gruaman / Bomberman), exclusiones,
            envío del informe automaticamente (distribución) y formatos por empresa.
          </p>
        </div>
        <span className="indicador-central-status indicador-central-status--info">
          {loading ? "Cargando" : saving ? "Guardando" : hasUnsavedChanges ? "Pendiente" : "Sin cambios"}
        </span>
      </div>

      <div className="indicador-central-section-stack">
        <section className="indicador-central-nested-card">
          <div className="indicador-central-card__header">
            <div>
              <h3>Destinatarios</h3>
              <p className="indicador-central-card__description">
                Esta lista se usa para el envío automático cuando la distribución está habilitada.
              </p>
            </div>
          </div>

          <IndicadorCentralListEditor
            label="Correos destinatarios"
            items={config.destinatarios}
            inputType="email"
            placeholder="correo@dominio.com"
            emptyLabel="Todavía no hay correos configurados."
            onChange={(nextItems) => onChange((currentConfig) => ({ ...currentConfig, destinatarios: nextItems }))}
          />
        </section>

        <section className="indicador-central-nested-card">
          <div className="indicador-central-card__header">
            <div>
              <h3>Umbrales y distribución</h3>
              <p className="indicador-central-card__description">
                Valores de referencia para la interpretación del indicador, la distribución habilita el envío automático a la lista de correos previa.
              </p>
            </div>
          </div>

          <div className="indicador-central-form-grid">
            <div className="indicador-central-field-group">
              <label className="indicador-central-label" htmlFor="indicador-alerta-pct">
                Umbral de alerta (%)
              </label>
              <input
                id="indicador-alerta-pct"
                className="indicador-central-input"
                type="number"
                min="0"
                max="100"
                value={config.umbrales.alertaPct}
                onChange={(event) => updateThreshold("alertaPct", event.target.value)}
              />
            </div>

            <div className="indicador-central-field-group">
              <label className="indicador-central-label" htmlFor="indicador-objetivo-pct">
                Umbral objetivo (%)
              </label>
              <input
                id="indicador-objetivo-pct"
                className="indicador-central-input"
                type="number"
                min="0"
                max="100"
                value={config.umbrales.objetivoPct}
                onChange={(event) => updateThreshold("objetivoPct", event.target.value)}
              />
            </div>

            <div className="indicador-central-field-group indicador-central-field-group--toggle">
              <div>
                <label className="indicador-central-label" htmlFor="indicador-distribucion-habilitada">
                  Distribución habilitada
                  <IndicadorCentralInfoTip label="Cómo funciona la distribución">
                    Activar esto sólo habilita el envío automático. No cambia la descarga manual del Excel.
                  </IndicadorCentralInfoTip>
                </label>
                <p className="indicador-central-helper">
                  Enciende o apaga el envío automático sin tocar la lógica del cron.
                </p>
              </div>
              <input
                id="indicador-distribucion-habilitada"
                className="indicador-central-checkbox"
                type="checkbox"
                checked={config.distribucionHabilitada}
                onChange={(event) =>
                  onChange((currentConfig) => ({
                    ...currentConfig,
                    distribucionHabilitada: event.target.checked,
                  }))
                }
              />
            </div>
          </div>
        </section>

        <section className="indicador-central-nested-card">
          <div className="indicador-central-card__header">
            <div>
              <h3>Scope activo</h3>
              <p className="indicador-central-card__description">
                Acá se definen los filtros que segmentan la data para la generación del informe.
              </p>
            </div>
          </div>

          <div className="indicador-central-scope-layout">
            <article className="indicador-central-scope-panel">
              <div className="indicador-central-scope-panel__header">
                <div>
                  <h4>Cargos incluidos</h4>
                  <p className="indicador-central-helper">
                    Define qué Cargos quedan incluidoss dentro del alcance del informe.
                  </p>
                </div>
              </div>

              <IndicadorCentralListEditor
                label="Cargos"
                items={config.scope.empresaIds.map(String)}
                placeholder={companiesLoading ? "Cargando..." : "Seleccioná un Cargo"}
                emptyLabel="No hay empresas configuradas."
                addLabel="Agregar cargo"
                editorHint="Tocá un chip para editarlo"
                options={companyOptions}
                disabled={companiesLoading || !companyOptions.length}
                getItemLabel={(companyId) => formatCompanyLabel(companyId, companyOptions)}
                normalizeItem={(value) => value.trim()}
                onChange={(nextItems) => updateScopeField("empresaIds", nextItems.map(Number))}
              />
              {companiesError ? (
                <p className="indicador-central-inline-alert indicador-central-inline-alert--error">{companiesError}</p>
              ) : null}
            </article>

            <article className="indicador-central-scope-panel">
              <div className="indicador-central-scope-panel__header">
                <div>
                  <h4>Filtro por obra</h4>
                  <p className="indicador-central-helper">
                    Activá esta segmentación sólo cuando necesités filtrar una obra puntual.
                  </p>
                </div>
                <span
                  className={`indicador-central-status ${
                    config.scope.segmentarPorObra ? "indicador-central-status--warning" : "indicador-central-status--neutral"
                  }`}
                >
                  {config.scope.segmentarPorObra ? "Activo" : "Apagado"}
                </span>
              </div>

              <div className="indicador-central-field-group indicador-central-field-group--toggle indicador-central-scope-toggle">
                <div>
                  <label className="indicador-central-label" htmlFor="indicador-segmentar-obra">
                    Segmentar por obra
                    <IndicadorCentralInfoTip label="Qué pasa al segmentar por obra">
                      Cuando está activo, la obra pasa a ser un filtro estricto. Si lo apagás, se limpian obra ID y nombre para volver al modo cargo-first.
                    </IndicadorCentralInfoTip>
                  </label>
                  <p className="indicador-central-helper">
                    Se muestran todas las obras disponibles y las inactivas quedan marcadas para no perder contexto histórico.
                  </p>
                </div>
                <input
                  id="indicador-segmentar-obra"
                  className="indicador-central-checkbox"
                  type="checkbox"
                  checked={config.scope.segmentarPorObra}
                  onChange={(event) => toggleSegmentarPorObra(event.target.checked)}
                />
              </div>

              <div className="indicador-central-field-group">
                <label className="indicador-central-label" htmlFor="indicador-obra-select">
                  Obra
                </label>
                <select
                  id="indicador-obra-select"
                  className="indicador-central-input"
                  value={config.scope.obraId ?? ""}
                  disabled={!config.scope.segmentarPorObra || worksitesLoading || !decoratedWorksiteOptions.length}
                  onChange={(event) => updateSelectedWorksite(event.target.value)}
                >
                  <option value="">
                    {worksitesLoading ? "Cargando obras..." : decoratedWorksiteOptions.length ? "Seleccioná una obra" : "No hay obras disponibles"}
                  </option>
                  {decoratedWorksiteOptions.map((worksite) => (
                    <option key={worksite.value} value={worksite.value}>
                      {worksite.displayLabel}
                    </option>
                  ))}
                </select>
              </div>
              {worksitesError ? (
                <p className="indicador-central-inline-alert indicador-central-inline-alert--error">{worksitesError}</p>
              ) : null}
            </article>

            <article className="indicador-central-scope-panel indicador-central-scope-panel--wide">
              <div className="indicador-central-scope-panel__header">
                <div>
                  <h4>Nombres persistentes</h4>
                  <p className="indicador-central-helper">
                    Usá esta lista sólo para el alcance estable del indicador, no para una descarga puntual.
                  </p>
                </div>
              </div>

              <IndicadorCentralWorkerSearchEditor
                label={
                  <>
                    scope.nombres
                    <IndicadorCentralInfoTip label="Qué significa scope.nombres">
                      Se guarda dentro del scope del módulo. No sirve para una descarga puntual: para eso usá el campo nombre del panel de resultado.
                    </IndicadorCentralInfoTip>
                  </>
                }
                items={config.scope.nombres}
                emptyLabel="No hay nombres específicos cargados."
                editorHint="Buscá trabajadores dentro de las empresas seleccionadas y tocá un resultado para agregarlo"
                companyIds={config.scope.empresaIds}
                getCompanyLabel={(companyId) => formatCompanyLabel(companyId, companyOptions)}
                onChange={(nextItems) => updateScopeField("nombres", nextItems)}
              />
            </article>

            <article className="indicador-central-scope-summary">
              <div className="indicador-central-scope-panel__header">
                <div>
                  <h4>Resumen del alcance</h4>
                  <p className="indicador-central-helper">
                    Así es como hoy queda guardado el scope persistente del indicador.
                  </p>
                </div>
              </div>

              <div className="indicador-central-scope-summary__grid">
                {scopeSummary.map((item) => (
                  <div key={item.label} className="indicador-central-result-item">
                    <span className="indicador-central-result-item__label">{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="indicador-central-nested-card">
          <div className="indicador-central-card__header">
            <div>
              <h3>Formatos por empresa</h3>
              <p className="indicador-central-card__description">
                Definí qué formatos operativos cuentan para cada empresa dentro del contrato actual.
              </p>
            </div>
          </div>

          <div className="indicador-central-company-grid">
            {companyKeys.map((companyKey) => (
              <article key={companyKey} className="indicador-central-company-card">
                <h4>{formatCompanyLabel(companyKey, companyOptions)}</h4>
                <p className="indicador-central-helper">
                  Cargá los identificadores de formatos esperados para esta empresa.
                </p>
                <IndicadorCentralListEditor
                  label={`Formatos empresa ${companyKey}`}
                  items={config.formatosPorEmpresa[companyKey] || []}
                  placeholder="permiso_trabajo"
                  emptyLabel="Todavía no hay formatos definidos."
                  addLabel="Agregar formato"
                  onChange={(nextItems) => updateCompanyFormats(companyKey, nextItems)}
                />
              </article>
            ))}
          </div>
        </section>

        <section className="indicador-central-nested-card">
          <div className="indicador-central-card__header">
            <div>
              <h3>Exclusiones</h3>
              <p className="indicador-central-card__description">
                Excluí nombres puntuales sin alterar la fuente de datos.
              </p>
            </div>
          </div>

          <IndicadorCentralListEditor
            label="Nombres excluidos"
            items={config.exclusiones}
            placeholder="Nombre a excluir"
            emptyLabel="No hay exclusiones configuradas."
            onChange={(nextItems) => onChange((currentConfig) => ({ ...currentConfig, exclusiones: nextItems }))}
          />
        </section>
      </div>

      {error ? <p className="indicador-central-inline-alert indicador-central-inline-alert--error">{error}</p> : null}
      {lastSavedAt ? (
        <p className="indicador-central-inline-alert indicador-central-inline-alert--success">
          Último guardado: {new Date(lastSavedAt).toLocaleString()}
        </p>
      ) : null}

      <div className="indicador-central-actions">
        <button type="button" className="indicador-central-button indicador-central-button--secondary" onClick={onReset} disabled={saving || loading}>
          Restaurar cambios
        </button>
        <button type="button" className="indicador-central-button" onClick={onSave} disabled={saving || loading || !hasUnsavedChanges}>
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </section>
  );
}

export default ConfigSection;



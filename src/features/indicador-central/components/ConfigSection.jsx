import { IndicadorCentralListEditor } from "./IndicadorCentralListEditor";
import { IndicadorCentralInfoTip } from "./IndicadorCentralInfoTip";

const COMPANY_LABELS = {
  "1": "Grúa Man",
  "2": "Bomberman",
};

function normalizeNumericItem(value) {
  const normalizedValue = value.trim();
  if (!normalizedValue) return "";
  const numericValue = Number(normalizedValue);
  return Number.isFinite(numericValue) ? String(numericValue) : "";
}

function formatCompanyLabel(companyKey) {
  return COMPANY_LABELS[companyKey] || `Empresa ${companyKey}`;
}

function buildScopeSummary(scope) {
  const companiesLabel = scope.empresaIds.length
    ? scope.empresaIds.map((companyId) => formatCompanyLabel(String(companyId))).join(", ")
    : "sin empresas definidas";
  const worksiteLabel = scope.segmentarPorObra
    ? `${scope.obraNombre || "Sin nombre"} · ${scope.obraId || "sin código"}`
    : "Desactivada";
  const namesLabel = scope.nombres.length ? `${scope.nombres.length} nombres específicos` : "Sin nombres adicionales";

  return [
    { label: "Empresas activas", value: companiesLabel },
    { label: "Filtro por obra", value: worksiteLabel },
    { label: "Segmentación nominal", value: namesLabel },
  ];
}

export function ConfigSection({
  config,
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
  const scopeSummary = buildScopeSummary(config.scope);

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

  return (
    <section className="indicador-central-card">
      <div className="indicador-central-card__header">
        <div>
          <h2>Configuración del módulo</h2>
          <p className="indicador-central-card__description">
            Editá sólo la configuración que hoy guarda backend: destinatarios, umbrales, scope, exclusiones,
            distribución y formatos por empresa.
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
                Frontend sólo edita estos valores; la interpretación y la ejecución siguen siendo responsabilidad del backend.
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
                    Activar esto sólo habilita el envío automático del backend. No cambia la descarga manual del workbook.
                  </IndicadorCentralInfoTip>
                </label>
                <p className="indicador-central-helper">
                  Encendé o apagá el envío automático sin tocar la lógica del cron.
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
                La base es empresa-first. Acá definís el scope persistente que backend guarda para el módulo.
              </p>
            </div>
          </div>

          <div className="indicador-central-scope-layout">
            <article className="indicador-central-scope-panel">
              <div className="indicador-central-scope-panel__header">
                <div>
                  <h4>Empresas incluidas</h4>
                  <p className="indicador-central-helper">
                    Definí qué empresas quedan incluidas dentro del alcance persistente del módulo.
                  </p>
                </div>
              </div>

              <IndicadorCentralListEditor
                label="IDs de empresa"
                items={config.scope.empresaIds.map(String)}
                placeholder="1"
                emptyLabel="No hay empresas configuradas."
                addLabel="Sumar empresa"
                editorHint="Tocá un chip para editarlo"
                normalizeItem={normalizeNumericItem}
                onChange={(nextItems) => updateScopeField("empresaIds", nextItems.map(Number))}
              />
            </article>

            <article className="indicador-central-scope-panel">
              <div className="indicador-central-scope-panel__header">
                <div>
                  <h4>Filtro por obra</h4>
                  <p className="indicador-central-helper">
                    Activá esta segmentación sólo cuando necesités forzar una obra puntual.
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
                      Cuando está activo, la obra pasa a ser un filtro estricto. Si lo apagás, se limpian obra ID y nombre para volver al modo empresa-first.
                    </IndicadorCentralInfoTip>
                  </label>
                  <p className="indicador-central-helper">
                    Backend guarda este flag como parte del scope persistente.
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

              <div className="indicador-central-form-grid indicador-central-form-grid--compact">
                <div className="indicador-central-field-group">
                  <label className="indicador-central-label" htmlFor="indicador-obra-id">
                    Código de obra
                  </label>
                  <input
                    id="indicador-obra-id"
                    className="indicador-central-input"
                    type="number"
                    value={config.scope.obraId ?? ""}
                    disabled={!config.scope.segmentarPorObra}
                    onChange={(event) => updateScopeField("obraId", event.target.value ? Number(event.target.value) : null)}
                  />
                </div>

                <div className="indicador-central-field-group">
                  <label className="indicador-central-label" htmlFor="indicador-obra-nombre">
                    Nombre de obra
                  </label>
                  <input
                    id="indicador-obra-nombre"
                    className="indicador-central-input"
                    type="text"
                    value={config.scope.obraNombre ?? ""}
                    disabled={!config.scope.segmentarPorObra}
                    onChange={(event) => updateScopeField("obraNombre", event.target.value || null)}
                  />
                </div>
              </div>
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

              <IndicadorCentralListEditor
                label={
                  <>
                    scope.nombres
                    <IndicadorCentralInfoTip label="Qué significa scope.nombres">
                      Se guarda dentro del scope del módulo. No sirve para una descarga puntual: para eso usá el campo nombre del panel de resultado.
                    </IndicadorCentralInfoTip>
                  </>
                }
                items={config.scope.nombres}
                placeholder="Nombre a incluir"
                emptyLabel="No hay nombres específicos cargados."
                addLabel="Agregar nombre"
                editorHint="Tocá un chip para corregirlo o quitarlo"
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
                <h4>{formatCompanyLabel(companyKey)}</h4>
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

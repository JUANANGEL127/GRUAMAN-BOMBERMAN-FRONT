import { buildIndicadorCentralWorkbookFallbackRequest } from "../adapters/indicadorCentralAdapter";
import { IndicadorCentralInfoTip } from "./IndicadorCentralInfoTip";

function formatCutTypeLabel(cutType) {
  return cutType
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getCutTypeHelper(cutType) {
  if (cutType === "mensual") {
    return "Mensual: arma una ventana desde el día 1 hasta la fecha de corte que elegiste.";
  }

  if (cutType === "mensual_acumulado") {
    return "Mensual acumulado: usa el día 1 del mes hasta la fecha elegida. Hoy queda con la misma ventana y sólo debería existir si backend realmente lo diferencia.";
  }

  return "Diario: descarga un único día de corte, ideal para validar una fecha puntual.";
}

function formatRequestWindow(execution) {
  const request = buildIndicadorCentralWorkbookFallbackRequest(execution);

  if (!request.fechaInicio || !request.fechaFin) {
    return "Completá fecha y tipo de corte para resolver la ventana.";
  }

  if (request.fechaInicio === request.fechaFin) {
    return `${request.fechaInicio} · ${request.corteTipo}`;
  }

  return `${request.fechaInicio} → ${request.fechaFin} · ${request.corteTipo}`;
}

export function ExecutionSection({
  execution,
  supportedCutTypes,
  submitting,
  canExecute,
  error,
  lastExecutedAt,
  lastFileName,
  onFieldChange,
  onExecute,
}) {
  const availableCutTypes = supportedCutTypes.length ? supportedCutTypes : ["diario", "mensual"];
  const cutTypeHelper = getCutTypeHelper(execution.corteTipo);
  const requestWindow = formatRequestWindow(execution);

  return (
    <section className="indicador-central-card">
      <div className="indicador-central-card__header">
        <div>
          <h2 className="indicador-central-title-with-tip">
            Descarga manual
            <IndicadorCentralInfoTip label="Qué hace esta sección" align="start">
              Ajusta los campos del  formulario segun requieras filtrar el indicador.
            </IndicadorCentralInfoTip>
          </h2>
          <p className="indicador-central-card__description">
            Elige el corte, opcionalmente filtra por el nombre del trabajador y descarga el Excel
          </p>
        </div>
        <span className="indicador-central-status indicador-central-status--warning">
          {submitting ? "Descargando" : canExecute ? "Listo para descargar" : "Completa los campos"}
        </span>
      </div>

      <div className="indicador-central-form-grid indicador-central-form-grid--compact">
        <div className="indicador-central-field-group">
          <label className="indicador-central-label" htmlFor="indicador-fecha-corte">
            Fecha de corte
            <IndicadorCentralInfoTip label="Qué fecha se envía" align="start">
              Aquí se indica el periodo de tiempo para la descarga.
            </IndicadorCentralInfoTip>
          </label>
          <input
            id="indicador-fecha-corte"
            className="indicador-central-input"
            type="date"
            value={execution.fechaCorte}
            onChange={(event) => onFieldChange("fechaCorte", event.target.value)}
          />
        </div>

        <div className="indicador-central-field-group">
          <label className="indicador-central-label" htmlFor="indicador-corte-tipo">
            Tipo de corte
            <IndicadorCentralInfoTip label="Cómo leer los tipos de corte">{cutTypeHelper}</IndicadorCentralInfoTip>
          </label>
          <select
            id="indicador-corte-tipo"
            className="indicador-central-input"
            value={execution.corteTipo}
            onChange={(event) => onFieldChange("corteTipo", event.target.value)}
          >
            {availableCutTypes.map((cutType) => (
              <option key={cutType} value={cutType}>
                {formatCutTypeLabel(cutType)}
              </option>
            ))}
          </select>
        </div>

        <div className="indicador-central-field-group indicador-central-field-group--full">
          <label className="indicador-central-label" htmlFor="indicador-download-nombre">
            Nombre
            <IndicadorCentralInfoTip label="Qué hace este filtro" align="start">
              Es opcional. Se manda como nombre al backend para descargar un informe puntual; no cambia el nombre del archivo.
            </IndicadorCentralInfoTip>
          </label>
          <input
            id="indicador-download-nombre"
            className="indicador-central-input"
            type="text"
            value={execution.nombre}
            placeholder="Nombre exacto o parcial"
            onChange={(event) => onFieldChange("nombre", event.target.value)}
          />
        </div>
      </div>

      <div className="indicador-central-compact-summary">
        <div className="indicador-central-result-item">
          <span className="indicador-central-result-item__label">
            Ventana resuelta
            <IndicadorCentralInfoTip label="Cómo se calcula la ventana" align="start">
              Diario usa la misma fecha en inicio y fin. Mensual toma desde el día 1 hasta la fecha de corte.
            </IndicadorCentralInfoTip>
          </span>
          <strong>{requestWindow}</strong>
        </div>
        <div className="indicador-central-result-item">
          <span className="indicador-central-result-item__label">Filtro aplicado</span>
          <strong>{execution.nombre || "Sin filtro puntual"}</strong>
        </div>
      </div>

      {error ? <p className="indicador-central-inline-alert indicador-central-inline-alert--error">{error}</p> : null}
      {lastExecutedAt ? (
        <p className="indicador-central-inline-alert indicador-central-inline-alert--success">
          Última descarga: {new Date(lastExecutedAt).toLocaleString()}
          {lastFileName ? ` · ${lastFileName}` : ""}
        </p>
      ) : null}

      <div className="indicador-central-actions indicador-central-actions--single">
        <button type="button" className="indicador-central-button" onClick={onExecute} disabled={!canExecute || submitting}>
          {submitting ? "Descargando..." : "Descargar"}
        </button>
      </div>
    </section>
  );
}

export default ExecutionSection;


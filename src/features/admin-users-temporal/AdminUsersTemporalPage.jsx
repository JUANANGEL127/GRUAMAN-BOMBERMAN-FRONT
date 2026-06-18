import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  annulWorkerTemporalState,
  closeWorkerTemporalState,
  createWorker,
  createWorkerTemporalState,
  fetchAdminUsersList,
  fetchWorkerTemporalTimeline,
  toggleWorkerActive,
  toggleWorkerPin,
  updateWorkerTemporalState,
} from "./adminUsersTemporalApi";
import { todayStrBogota } from "../../utils/dateUtils";
import "./adminUsersTemporal.css";

const TEMPORAL_TYPE_OPTIONS = [
  { value: "vacaciones", label: "Vacaciones" },
  { value: "permiso", label: "Permiso" },
  { value: "sancion", label: "Sanción" },
  { value: "incapacidad_at", label: "Incapacidad AT" },
  { value: "incapacidad_general", label: "Incapacidad general" },
  { value: "licencia", label: "Licencia" },
];

const ROLES = [
  { id: 1, nombre: "Gruaman" },
  { id: 2, nombre: "Bomberman" },
  { id: 3, nombre: "Técnico" },
  { id: 4, nombre: "SST" },
];

const DEFAULT_TEMPORAL_VALUES = {
  tipo: "vacaciones",
  motivo: "",
  remunerada: false,
  fecha_inicio: todayStrBogota(),
  fecha_fin: todayStrBogota(),
};

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatDisplayDate(value) {
  if (!value) return "—";
  const raw = String(value).slice(0, 10);
  const candidate = new Date(`${raw}T00:00:00-05:00`);
  if (Number.isNaN(candidate.getTime())) return raw;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(candidate);
}

function formatRange(record) {
  if (!record) return "—";
  const inicio = formatDisplayDate(record.fecha_inicio);
  const fin = record.fecha_fin ? formatDisplayDate(record.fecha_fin) : "Abierto";
  return `${inicio} → ${fin}`;
}

function getTemporalTypeLabel(value) {
  switch (String(value ?? "").trim()) {
    case "vacaciones":
      return "Vacaciones";
    case "permiso":
      return "Permiso";
    case "sancion":
      return "Sanción";
    case "incapacidad_at":
      return "Incapacidad AT";
    case "incapacidad_general":
      return "Incapacidad general";
    case "licencia":
      return "Licencia";
    default:
      return "Estado temporal";
  }
}

function getTemporalRecordStatus(record) {
  const normalizedState = String(record?.estado ?? record?.status ?? record?.estado_temporal ?? "").trim().toLowerCase();
  const isAnnulled = Boolean(
    record?.anulado_at != null ||
      normalizedState === "anulado" ||
      record?.anulado ||
      record?.anulada ||
      record?.fecha_anulacion ||
      record?.anulacion_fecha
  );
  const isClosed = Boolean(
    !isAnnulled &&
      (record?.cerrado_at != null ||
        normalizedState === "cerrado" ||
        record?.cerrado ||
        record?.cerrada ||
        record?.fecha_cierre ||
        record?.cierre_fecha)
  );
  const isScheduled = Boolean(record?.programado || record?.vigente_programado);
  const isCurrent = Boolean(record?.vigente_hoy && !isAnnulled && !isClosed);

  return {
    isAnnulled,
    isClosed,
    isScheduled,
    isCurrent,
  };
}

function getRecordStateLabel(record) {
  const { isAnnulled, isClosed, isScheduled, isCurrent } = getTemporalRecordStatus(record);

  if (isAnnulled) return "Anulada";
  if (isClosed) return "Cerrada";
  if (isCurrent) return "Vigente hoy";
  if (isScheduled) return "Programada";
  return "Histórica";
}

function getRemunerationLabel(record) {
  if (record?.remunerada === true) return "Remunerado";
  if (record?.remunerada === false) return "No remunerado";
  return "Sin dato";
}

function getRecordExclusionLabel(record) {
  const { isAnnulled, isClosed, isCurrent } = getTemporalRecordStatus(record);

  if (isAnnulled || isClosed) return "No excluye";
  if (record?.excluye_indicador_central) {
    return isCurrent ? "Excluye hoy del indicador central" : "Excluye por novedad";
  }
  return "No excluye";
}

function getBadgeVariant(value) {
  switch (value) {
    case "success":
      return "admin-users-temporal-badge--success";
    case "danger":
      return "admin-users-temporal-badge--danger";
    case "info":
      return "admin-users-temporal-badge--info";
    case "warning":
      return "admin-users-temporal-badge--warning";
    case "purple":
      return "admin-users-temporal-badge--purple";
    default:
      return "admin-users-temporal-badge--neutral";
  }
}

function TemporalBadge({ variant = "neutral", children }) {
  return <span className={`admin-users-temporal-badge ${getBadgeVariant(variant)}`.trim()}>{children}</span>;
}

function SwitchControl({ checked, labelOn, labelOff, onClick, disabled = false, variant = "success" }) {
  const label = checked ? labelOn : labelOff;
  return (
    <button
      type="button"
      className={`admin-users-temporal-switch admin-users-temporal-switch--${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={checked}
      aria-label={label}
      style={{width: 'fit-content'}}
    >
      <span className={`admin-users-temporal-switch__label ${checked ? "admin-users-temporal-switch__label--active" : ""}`}>{label}</span>
      <span className={`admin-users-temporal-switch__track ${checked ? "admin-users-temporal-switch__track--on" : "admin-users-temporal-switch__track--off"}`}>
        <span className={`admin-users-temporal-switch__thumb ${checked ? "admin-users-temporal-switch__thumb--on" : "admin-users-temporal-switch__thumb--off"}`} />
      </span>
    </button>
  );
}

function pickErrorMessage(error) {
  const status = error?.response?.status;
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    (Array.isArray(error?.response?.data?.errors) ? error.response.data.errors.join(", ") : "");

  if (backendMessage) return backendMessage;

  switch (status) {
    case 400:
      return "La solicitud es inválida o está incompleta.";
    case 404:
      return "No se encontró la persona o el estado temporal.";
    case 409:
      return "El rango temporal entra en conflicto con otro registro o no se puede editar en su estado actual.";
    default:
      return "No fue posible completar esa acción en este momento.";
  }
}

function getWorkerKey(worker) {
  return worker?.id ?? worker?.numero_identificacion ?? worker?.nombre ?? "worker";
}

function buildTemporalPayload(values) {
  const payload = {
    tipo: values.tipo,
    motivo: safeTrim(values.motivo),
    fecha_inicio: values.fecha_inicio,
    fecha_fin: values.fecha_fin,
    remunerada: values.remunerada,
  };

  return payload;
}

function diffTemporalPayload(initialValues, nextValues) {
  const payload = {};

  if (safeTrim(nextValues.tipo) && nextValues.tipo !== initialValues.tipo) {
    payload.tipo = nextValues.tipo;
  }

  const trimmedMotivo = safeTrim(nextValues.motivo);
  if (trimmedMotivo !== safeTrim(initialValues.motivo)) {
    payload.motivo = trimmedMotivo;
  }

  if (typeof nextValues.remunerada === "boolean" && nextValues.remunerada !== initialValues.remunerada) {
    payload.remunerada = nextValues.remunerada;
  }

  if (nextValues.fecha_inicio && nextValues.fecha_inicio !== initialValues.fecha_inicio) {
    payload.fecha_inicio = nextValues.fecha_inicio;
  }

  if (nextValues.fecha_fin && nextValues.fecha_fin !== initialValues.fecha_fin) {
    payload.fecha_fin = nextValues.fecha_fin;
  }

  return payload;
}

function validateTemporalForm(values) {
  const errors = {};

  if (!safeTrim(values.tipo)) errors.tipo = "Seleccioná un tipo de estado temporal.";
  if (!safeTrim(values.motivo)) errors.motivo = "El motivo es obligatorio.";
  if (typeof values.remunerada !== "boolean") errors.remunerada = "Indicá si es remunerado o no remunerado.";
  if (!values.fecha_inicio) errors.fecha_inicio = "La fecha de inicio es obligatoria.";
  if (!values.fecha_fin) errors.fecha_fin = "La fecha de fin es obligatoria.";
  if (values.fecha_inicio && values.fecha_fin && values.fecha_fin < values.fecha_inicio) {
    errors.fecha_fin = "La fecha de fin debe ser igual o posterior a la de inicio.";
  }

  return errors;
}

function TemporalRecordCard({ record, workerId, onEdit, onClose, onAnnul, showActions = false }) {
  if (!record) return null;

  const { isAnnulled, isClosed, isCurrent } = getTemporalRecordStatus(record);
  const exclusionLabel = getRecordExclusionLabel(record);
  const exclusionVariant =
    isAnnulled || isClosed ? "neutral" : record?.excluye_indicador_central ? (isCurrent ? "warning" : "info") : "neutral";
  return (
    <article className="admin-users-temporal-record">
      <div>
        <p className="admin-users-temporal-record__title">
          {getTemporalTypeLabel(record.tipo)} <span className="admin-users-temporal-muted">#{record.id ?? "—"}</span>
        </p>
        <p className="admin-users-temporal-record__line">{safeTrim(record.motivo) || "—"}</p>
      </div>

      <div className="admin-users-temporal-record__badges">
        <TemporalBadge variant="info">{getTemporalTypeLabel(record.tipo)}</TemporalBadge>
        <TemporalBadge variant={record.remunerada === true ? "success" : "warning"}>{getRemunerationLabel(record)}</TemporalBadge>
        <TemporalBadge variant={isAnnulled ? "danger" : isClosed ? "neutral" : isCurrent ? "danger" : "info"}>{getRecordStateLabel(record)}</TemporalBadge>
        <TemporalBadge variant={exclusionVariant}>{exclusionLabel}</TemporalBadge>
      </div>

      <div className="admin-users-temporal-grid">
        <div>
          <p className="admin-users-temporal-record__line"><strong>Inicio:</strong> {formatDisplayDate(record.fecha_inicio)}</p>
          <p className="admin-users-temporal-record__line"><strong>Fin:</strong> {record.fecha_fin ? formatDisplayDate(record.fecha_fin) : "Abierto"}</p>
        </div>
        <div>
          <p className="admin-users-temporal-record__line"><strong>Persona:</strong> {workerId}</p>
          <p className="admin-users-temporal-record__line"><strong>Rango:</strong> {formatRange(record)}</p>
        </div>
      </div>

      {showActions ? (
        <div className="admin-users-temporal-record__actions">
          {onEdit ? (
            <button type="button" className="admin-users-temporal-button admin-users-temporal-button--ghost" onClick={() => onEdit(record)}>
              Editar
            </button>
          ) : null}
          {isCurrent && !isAnnulled && !isClosed && onClose ? (
            <button type="button" className="admin-users-temporal-button admin-users-temporal-button--danger" onClick={() => onClose(record)}>
              Cerrar vigencia
            </button>
          ) : null}
          {!isAnnulled && !isClosed && onAnnul ? (
            <button type="button" className="admin-users-temporal-button admin-users-temporal-button--secondary" onClick={() => onAnnul(record)}>
              Anular
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
function TemporalFormModal({ open, mode, workerName, initialValues, submitting, onCancel, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;
    setValues(initialValues);
    setErrors({});
    setSubmitError("");
  }, [open, initialValues]);

  if (!open) return null;

  const title = mode === "create" ? "Crear estado temporal" : "Editar estado temporal";
  const note =
    mode === "create"
      ? "Este registro es aditivo. No cambia el estado permanente activo/inactivo de la persona."
      : "Esto actualiza solo el registro temporal seleccionado. No toca el estado permanente de la persona.";

  const handleChange = (field, nextValue) => {
    setValues((current) => {
      return { ...current, [field]: nextValue };
    });
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const clientErrors = validateTemporalForm(values);
    setErrors(clientErrors);

    if (Object.keys(clientErrors).length > 0) return;

    const payload = mode === "create" ? buildTemporalPayload(values) : diffTemporalPayload(initialValues, values);

    if (mode === "edit" && Object.keys(payload).length === 0) {
      setSubmitError("Cambiá al menos un campo antes de guardar. El backend rechaza un PATCH vacío.");
      return;
    }

    onSubmit(payload, { setSubmitError, setErrors });
  };

  return (
    <div className="admin-users-temporal-overlay" role="presentation" onClick={submitting ? undefined : onCancel}>
      <div className="admin-users-temporal-modal" role="dialog" aria-modal="true" aria-labelledby="temporal-form-title" onClick={(event) => event.stopPropagation()}>
        <div className="admin-users-temporal-modal__header">
          <div>
            <h3 id="temporal-form-title" className="admin-users-temporal-title" style={{ fontSize: "1.15rem" }}>
              {title}
            </h3>
            <p className="admin-users-temporal-subtitle">
              Persona: <strong>{workerName || "—"}</strong>
            </p>
          </div>
          <div className="admin-users-temporal-actions">
            <button type="button" className="admin-users-temporal-button admin-users-temporal-button--ghost" onClick={onCancel} disabled={submitting}>
              Cancelar
            </button>
          </div>
        </div>

        <div className="admin-users-temporal-modal__body">
          <form className="admin-users-temporal-form" onSubmit={handleSubmit}>
            <p className="admin-users-temporal-modal__section-copy">{note}</p>

            {submitError ? <p className="admin-users-temporal-error">{submitError}</p> : null}

            <div className="admin-users-temporal-form__grid">
              <div className="admin-users-temporal-form__field">
                <label className="admin-users-temporal-label" htmlFor="temporal-type">Tipo</label>
                <select id="temporal-type" className="admin-users-temporal-select" value={values.tipo} onChange={(event) => handleChange("tipo", event.target.value)}>
                  {TEMPORAL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.tipo ? <p className="admin-users-temporal-form__help" style={{ color: "#b91c1c" }}>{errors.tipo}</p> : null}
              </div>

              <div className="admin-users-temporal-form__field">
                <label className="admin-users-temporal-label" htmlFor="temporal-remuneration">Remuneración</label>
                <select id="temporal-remuneration" className="admin-users-temporal-select" value={String(values.remunerada)} onChange={(event) => handleChange("remunerada", event.target.value === "true")}>
                  <option value="true">Remunerado</option>
                  <option value="false">No remunerado</option>
                </select>
                {errors.remunerada ? <p className="admin-users-temporal-form__help" style={{ color: "#b91c1c" }}>{errors.remunerada}</p> : null}
              </div>

              <div className="admin-users-temporal-form__field">
                <label className="admin-users-temporal-label" htmlFor="temporal-start">Fecha de inicio</label>
                <input id="temporal-start" type="date" className="admin-users-temporal-input" value={values.fecha_inicio} onChange={(event) => handleChange("fecha_inicio", event.target.value)} />
                {errors.fecha_inicio ? <p className="admin-users-temporal-form__help" style={{ color: "#b91c1c" }}>{errors.fecha_inicio}</p> : null}
              </div>

              <div className="admin-users-temporal-form__field">
                <label className="admin-users-temporal-label" htmlFor="temporal-end">Fecha de fin</label>
                <input id="temporal-end" type="date" className="admin-users-temporal-input" value={values.fecha_fin} onChange={(event) => handleChange("fecha_fin", event.target.value)} />
                {errors.fecha_fin ? <p className="admin-users-temporal-form__help" style={{ color: "#b91c1c" }}>{errors.fecha_fin}</p> : null}
              </div>
            </div>

            <div className="admin-users-temporal-form__field">
              <label className="admin-users-temporal-label" htmlFor="temporal-reason">Motivo</label>
              <textarea
                id="temporal-reason"
                className="admin-users-temporal-textarea"
                rows={4}
                value={values.motivo}
                onChange={(event) => handleChange("motivo", event.target.value)}
                placeholder="Escribí el motivo de la novedad"
              />
              {errors.motivo ? <p className="admin-users-temporal-form__help" style={{ color: "#b91c1c" }}>{errors.motivo}</p> : null}
              <p className="admin-users-temporal-form__help">
                Este motivo se ve en el detalle y en el historial. La persona sigue activa o inactiva de forma permanente según <code>activo</code>.
              </p>
            </div>

            <div className="admin-users-temporal-actions" style={{ justifyContent: "space-between" }}>
              <p className="admin-users-temporal-form__help" style={{ maxWidth: 520 }}>
                {mode === "create"
                  ? "El backend usa estas fechas para decidir si la persona queda excluida del indicador central hoy."
                  : "El PATCH es parcial. Solo se enviarán los campos que cambiaste."}
              </p>
              <div className="admin-users-temporal-actions">
                <button type="button" className="admin-users-temporal-button admin-users-temporal-button--secondary" onClick={onCancel} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="admin-users-temporal-button" disabled={submitting}>
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function WorkerTemporalDetailModal({ open, worker, timeline, loading, error, onClose, onRefresh, onCreate, onEdit, onCloseRecord, onAnnulRecord }) {
  if (!open) return null;

  const current = getVisibleCurrentTemporalState(timeline?.estado_temporal_actual ?? null);
  const scheduled = getVisibleScheduledTemporalState(timeline?.estado_temporal_programado ?? null);
  const history = mergeTemporalHistory(timeline?.historial_estados_temporales, timeline?.estado_temporal_actual ?? null, timeline?.estado_temporal_programado ?? null);
  const permanentLabel = worker?.activo ? "Activo" : "Inactivo";
  const currentExclusionActive = Boolean(current?.excluye_indicador_central);

  return (
    <div className="admin-users-temporal-overlay" role="presentation" onClick={onClose}>
      <div className="admin-users-temporal-modal" role="dialog" aria-modal="true" aria-labelledby="worker-detail-title" onClick={(event) => event.stopPropagation()}>
        <div className="admin-users-temporal-modal__header">
          <div>
            <h3 id="worker-detail-title" className="admin-users-temporal-title" style={{ fontSize: "1.2rem" }}>
              {worker?.nombre || "Detalle de la persona"}
            </h3>
            <p className="admin-users-temporal-subtitle">
              Identificación: <strong>{worker?.numero_identificacion || "—"}</strong>
              {worker?.empresa_id ? (
                <>
                  {" "}· Empresa: <strong>{worker.empresa_id}</strong>
                </>
              ) : null}
            </p>
          </div>
          <div className="admin-users-temporal-actions">
            <button type="button" className="admin-users-temporal-button admin-users-temporal-button--ghost" onClick={onRefresh}>
              Refrescar
            </button>
            <button type="button" className="admin-users-temporal-button admin-users-temporal-button--ghost" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>

        <div className="admin-users-temporal-modal__body">
          {loading ? <p className="admin-users-temporal-muted">Cargando línea de tiempo...</p> : null}
          {error ? <p className="admin-users-temporal-error">{error}</p> : null}

          {worker ? (
            <>
              <section className="admin-users-temporal-modal__section">
                <h4 className="admin-users-temporal-modal__section-title">Estado permanente</h4>
                <div className="admin-users-temporal-badges">
                  <TemporalBadge variant={worker.activo ? "success" : "danger"}>{permanentLabel}</TemporalBadge>
                  <TemporalBadge variant={currentExclusionActive ? "warning" : "neutral"}>
                    {currentExclusionActive ? "Excluye hoy del indicador central" : "No excluye hoy"}
                  </TemporalBadge>
                </div>
                <p className="admin-users-temporal-modal__section-copy">
                  El estado permanente es independiente de los estados temporales. Esta pantalla no cambia <code>activo</code>.
                </p>
              </section>

              <section className="admin-users-temporal-modal__section">
                <div className="admin-users-temporal-header">
                  <div>
                    <h4 className="admin-users-temporal-modal__section-title">Línea de tiempo temporal</h4>
                    <p className="admin-users-temporal-modal__section-copy">
                      Los registros vigentes, programados e históricos se muestran por separado para no confundirlos con la activación permanente.
                    </p>
                  </div>
                  <div className="admin-users-temporal-actions">
                    <button type="button" className="admin-users-temporal-button" onClick={onCreate}>
                      Agregar estado temporal
                    </button>
                  </div>
                </div>

                <div className="admin-users-temporal-modal__section-grid">
                  <div>
                    <h5 className="admin-users-temporal-modal__section-title" style={{ fontSize: "0.95rem" }}>
                      Estado temporal actual
                    </h5>
                    {current ? (
                      <TemporalRecordCard record={current} workerId={worker.id} showActions onEdit={onEdit} onClose={onCloseRecord} onAnnul={onAnnulRecord} />
                    ) : (
                      <p className="admin-users-temporal-muted">No hay un estado temporal actual.</p>
                    )}
                  </div>

                  <div>
                    <h5 className="admin-users-temporal-modal__section-title" style={{ fontSize: "0.95rem" }}>
                      Estado temporal programado
                    </h5>
                    {scheduled ? (
                      <TemporalRecordCard record={scheduled} workerId={worker.id} showActions onEdit={onEdit} onClose={onCloseRecord} onAnnul={onAnnulRecord} />
                    ) : (
                      <p className="admin-users-temporal-muted">No hay un estado temporal programado.</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="admin-users-temporal-modal__section">
                <h4 className="admin-users-temporal-modal__section-title">Historial temporal completo</h4>
                {history.length > 0 ? (
                  <div className="admin-users-temporal-grid">
                    {history.map((record) => (
                      <TemporalRecordCard key={record.id ?? `${record.tipo}-${record.fecha_inicio}-${record.fecha_fin}`} record={record} workerId={worker.id} showActions onEdit={onEdit} onClose={onCloseRecord} onAnnul={onAnnulRecord} />
                    ))}
                  </div>
                ) : (
                  <p className="admin-users-temporal-muted">Todavía no hay registros temporales históricos.</p>
                )}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function WorkerCreateModal({ open, form, submitting, error, onCancel, onChange, onSubmit }) {
  if (!open) return null;

  return (
    <div className="admin-users-temporal-overlay" role="presentation" onClick={submitting ? undefined : onCancel}>
      <div className="admin-users-temporal-modal" role="dialog" aria-modal="true" aria-labelledby="worker-create-title" onClick={(event) => event.stopPropagation()}>
        <div className="admin-users-temporal-modal__header">
          <div>
            <h3 id="worker-create-title" className="admin-users-temporal-title" style={{ fontSize: "1.15rem" }}>
              Agregar persona
            </h3>
            <p className="admin-users-temporal-subtitle">La persona se crea con estado permanente activo. La novedad se maneja aparte.</p>
          </div>
          <div className="admin-users-temporal-actions">
            <button type="button" className="admin-users-temporal-button admin-users-temporal-button--ghost" onClick={onCancel} disabled={submitting}>
              Cancelar
            </button>
          </div>
        </div>

        <div className="admin-users-temporal-modal__body">
          {error ? <p className="admin-users-temporal-error">{error}</p> : null}
          <form className="admin-users-temporal-form" onSubmit={onSubmit}>
            <div className="admin-users-temporal-form__grid">
              <div className="admin-users-temporal-form__field">
                <label className="admin-users-temporal-label" htmlFor="worker-nombre">Nombre completo</label>
                <input
                  id="worker-nombre"
                  className="admin-users-temporal-input"
                  type="text"
                  value={form.nombre}
                  onChange={(event) => onChange("nombre", event.target.value)}
                  placeholder="Ejemplo: Juan Pérez"
                  required
                />
              </div>

              <div className="admin-users-temporal-form__field">
                <label className="admin-users-temporal-label" htmlFor="worker-rol">Rol</label>
                <select id="worker-rol" className="admin-users-temporal-select" value={form.rol} onChange={(event) => onChange("rol", Number(event.target.value))}>
                  {ROLES.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-users-temporal-form__field">
                <label className="admin-users-temporal-label" htmlFor="worker-documento">Número de identificación</label>
                <input
                  id="worker-documento"
                  className="admin-users-temporal-input"
                  type="text"
                  value={form.numero_identificacion}
                  onChange={(event) => onChange("numero_identificacion", event.target.value.replace(/[.,]/g, ""))}
                  placeholder="Ejemplo: 10203040"
                  required
                />
              </div>
            </div>

            <div className="admin-users-temporal-modal__section">
              <h4 className="admin-users-temporal-modal__section-title">Estado permanente</h4>
              <p className="admin-users-temporal-modal__section-copy">Se crea activa por defecto. Después podés inactivarla desde la lista si hace falta.</p>
              <div className="admin-users-temporal-badges">
                <TemporalBadge variant="success">Activo</TemporalBadge>
              </div>
            </div>

            <div className="admin-users-temporal-actions" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="admin-users-temporal-button admin-users-temporal-button--secondary" onClick={onCancel} disabled={submitting}>
                Cancelar
              </button>
              <button type="submit" className="admin-users-temporal-button" disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
function toggleTargetEmpresaIds(empresaIds, empresaId) {
  if (Array.isArray(empresaIds) && empresaIds.length > 0) {
    return empresaIds;
  }
  return empresaId ? [empresaId] : [];
}

function getRowTemporalSummary(worker) {
  const current = getVisibleCurrentTemporalState(worker?.estado_temporal_actual ?? null);
  const scheduled = getVisibleScheduledTemporalState(worker?.estado_temporal_programado ?? null);

  if (current) {
    return `${getTemporalTypeLabel(current.tipo)} · ${formatRange(current)}`;
  }

  if (scheduled) {
    return `${getTemporalTypeLabel(scheduled.tipo)} · programada · ${formatRange(scheduled)}`;
  }

  if (worker?.historial_estados_temporales?.length) {
    return "Con historial temporal";
  }

  return "Sin estado temporal";
}

function getVisibleCurrentTemporalState(record) {
  if (!record) return null;
  const { isAnnulled, isClosed, isCurrent } = getTemporalRecordStatus(record);
  return isAnnulled || isClosed || !isCurrent ? null : record;
}

function getVisibleScheduledTemporalState(record) {
  if (!record) return null;
  const { isAnnulled, isClosed, isScheduled } = getTemporalRecordStatus(record);
  return isAnnulled || isClosed || !isScheduled ? null : record;
}

function mergeTemporalHistory(history, current, scheduled) {
  const items = Array.isArray(history) ? [...history] : [];
  const byId = new Set(items.map((item) => String(item?.id ?? "")));

  const maybeAppend = (record) => {
    if (!record?.id) return;
    const key = String(record.id);
    if (byId.has(key)) return;
    items.unshift(record);
    byId.add(key);
  };

  const currentVisible = getVisibleCurrentTemporalState(current);
  const scheduledVisible = getVisibleScheduledTemporalState(scheduled);

  if (!currentVisible && current) {
    maybeAppend(current);
  }

  if (!scheduledVisible && scheduled) {
    maybeAppend(scheduled);
  }

  return items;
}

function getListExclusion(worker) {
  const current = getVisibleCurrentTemporalState(worker?.estado_temporal_actual ?? null);
  return Boolean(current?.excluye_indicador_central);
}

function WorkerMobileCard({ worker, mutating, onTogglePin, onToggleActivo, onOpenDetail }) {
  const currentTemporal = getVisibleCurrentTemporalState(worker.estado_temporal_actual ?? null);
  const scheduledTemporal = getVisibleScheduledTemporalState(worker.estado_temporal_programado ?? null);
  const exclusionActive = getListExclusion(worker);

  return (
    <article className="admin-users-temporal-mobile-card">
      <div className="admin-users-temporal-mobile-card__section">
        <p className="admin-users-temporal-mobile-card__label">Persona</p>
        <div className="admin-users-temporal-mobile-card__person">
          <strong>{worker.nombre}</strong>
          <span>{worker.numero_identificacion}</span>
          <span>{getRowTemporalSummary(worker)}</span>
        </div>
      </div>

      <div className="admin-users-temporal-mobile-card__section admin-users-temporal-mobile-card__section--center">
        <p className="admin-users-temporal-mobile-card__label">Estado permanente</p>
        <TemporalBadge variant={worker.activo ? "success" : "danger"}>{worker.activo ? "Activo" : "Inactivo"}</TemporalBadge>
      </div>

      <div className="admin-users-temporal-mobile-card__section admin-users-temporal-mobile-card__section--center">
        <p className="admin-users-temporal-mobile-card__label">PIN</p>
        <SwitchControl
          checked={Boolean(worker.pin_habilitado)}
          labelOn="PIN"
          labelOff="PIN"
          onClick={() => onTogglePin(worker)}
          disabled={mutating}
          variant="pin"
        />
      </div>

      <div className="admin-users-temporal-mobile-card__section admin-users-temporal-mobile-card__section--center">
        <p className="admin-users-temporal-mobile-card__label">Estado temporal</p>
        <TemporalBadge variant={currentTemporal ? "info" : scheduledTemporal ? "warning" : "neutral"}>
          {currentTemporal ? `Vigente · ${getTemporalTypeLabel(currentTemporal.tipo)}` : scheduledTemporal ? `Programada · ${getTemporalTypeLabel(scheduledTemporal.tipo)}` : "Sin estado temporal"}
        </TemporalBadge>
        {currentTemporal ? <span className="admin-users-temporal-muted">{formatRange(currentTemporal)}</span> : null}
        {!currentTemporal && scheduledTemporal ? <span className="admin-users-temporal-muted">{formatRange(scheduledTemporal)}</span> : null}
      </div>

      <div className="admin-users-temporal-mobile-card__section admin-users-temporal-mobile-card__section--center">
        <p className="admin-users-temporal-mobile-card__label">Exclusión</p>
        {exclusionActive ? <TemporalBadge variant="warning">Excluye hoy</TemporalBadge> : <TemporalBadge variant="neutral">No excluye</TemporalBadge>}
      </div>

      <div className="admin-users-temporal-mobile-card__section admin-users-temporal-mobile-card__section--center">
        <p className="admin-users-temporal-mobile-card__label">Acciones</p>
        <div className="admin-users-temporal-mobile-card__actions">
          <SwitchControl
            checked={worker.activo}
            labelOn="Activo"
            labelOff="Inactivo"
            onClick={() => onToggleActivo(worker)}
            disabled={mutating}
            variant="status"
          />
          <button type="button" className="admin-users-temporal-button admin-users-temporal-button--ghost" onClick={() => onOpenDetail(worker.id)}>
            Ver detalle
          </button>
        </div>
      </div>
    </article>
  );
}

export default function AdminUsersTemporalPage({ title, subtitle, empresaId, empresaIds = [], menuRoute = "/administrador" }) {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [mutating, setMutating] = useState(false);
  const [formState, setFormState] = useState(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workerForm, setWorkerForm] = useState({
    nombre: "",
    rol: ROLES[0].id,
    numero_identificacion: "",
    activo: true,
  });
  const [workerSubmitting, setWorkerSubmitting] = useState(false);
  const [workerError, setWorkerError] = useState("");

  const selectedEmpresaIds = useMemo(() => toggleTargetEmpresaIds(empresaIds, empresaId), [empresaIds, empresaId]);

  const listParams = useMemo(
    () => ({
      empresa_id: empresaId,
      ...(selectedEmpresaIds.length ? { empresa_ids: selectedEmpresaIds } : {}),
      offset,
      limit,
      busqueda,
    }),
    [empresaId, selectedEmpresaIds, offset, busqueda]
  );

  const resetWorkerForm = () => {
    setWorkerForm({
      nombre: "",
      rol: ROLES[0].id,
      numero_identificacion: "",
      activo: true,
    });
    setWorkerError("");
  };

  const loadList = async () => {
    setLoading(true);
    setListError("");

    try {
      const response = await fetchAdminUsersList(listParams);
      setWorkers(Array.isArray(response?.trabajadores) ? response.trabajadores : []);
      setTotal(Number(response?.total ?? 0));
    } catch (error) {
      setWorkers([]);
      setTotal(0);
      setListError(pickErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (workerId) => {
    if (!workerId) {
      setSelectedWorker(null);
      setTimeline(null);
      setDetailError("");
      return;
    }

    setDetailLoading(true);
    setDetailError("");

    try {
      const response = await fetchWorkerTemporalTimeline(workerId);
      setSelectedWorker(response?.trabajador ?? workers.find((worker) => String(worker.id) === String(workerId)) ?? null);
      setTimeline(response ?? null);
    } catch (error) {
      setTimeline(null);
      setDetailError(pickErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listParams]);

  useEffect(() => {
    if (!selectedWorkerId) {
      setSelectedWorker(null);
      setTimeline(null);
      setDetailError("");
      return undefined;
    }

    loadDetail(selectedWorkerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkerId]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeout = window.setTimeout(() => setFeedback(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const currentWorker = selectedWorker ?? workers.find((worker) => String(worker.id) === String(selectedWorkerId)) ?? null;

  const refreshAfterMutation = async () => {
    await loadList();
    if (selectedWorkerId) {
      await loadDetail(selectedWorkerId);
    }
  };

  const openWorkerDetail = (workerId) => setSelectedWorkerId(workerId);

  const closeWorkerDetail = () => {
    setSelectedWorkerId(null);
    setSelectedWorker(null);
    setTimeline(null);
    setDetailError("");
    setFormState(null);
  };

  const openCreateTemporalForm = () => {
    if (!selectedWorkerId) return;

    setFormState({
      mode: "create",
      workerId: selectedWorkerId,
      workerName: currentWorker?.nombre ?? "",
      temporalStateId: null,
      initialValues: { ...DEFAULT_TEMPORAL_VALUES },
    });
  };

  const openEditTemporalForm = (record) => {
    if (!selectedWorkerId || !record) return;

    setFormState({
      mode: "edit",
      workerId: selectedWorkerId,
      workerName: currentWorker?.nombre ?? "",
      temporalStateId: record.id,
      initialValues: {
        tipo: record.tipo ?? DEFAULT_TEMPORAL_VALUES.tipo,
        motivo: record.motivo ?? "",
        remunerada: Boolean(record.remunerada),
        fecha_inicio: String(record.fecha_inicio ?? "").slice(0, 10),
        fecha_fin: String(record.fecha_fin ?? "").slice(0, 10),
      },
    });
  };

  const handleCreateWorker = async (event) => {
    event.preventDefault();
    setWorkerError("");

    const nombre = safeTrim(workerForm.nombre);
    const numero_identificacion = safeTrim(workerForm.numero_identificacion).replace(/[.,]/g, "");

    if (!nombre) {
      setWorkerError("El nombre es obligatorio.");
      return;
    }

    if (!numero_identificacion) {
      setWorkerError("La identificación es obligatoria.");
      return;
    }

    setWorkerSubmitting(true);

    try {
      await createWorker({
        nombre,
        empresa_id: empresaId,
        numero_identificacion,
        activo: true,
        rol: workerForm.rol,
      });

      setShowWorkerModal(false);
      resetWorkerForm();
      setFeedback("Persona agregada correctamente.");
      await loadList();
    } catch (error) {
      setWorkerError(pickErrorMessage(error));
    } finally {
      setWorkerSubmitting(false);
    }
  };

  const handleToggleActivo = async (worker) => {
    if (!worker?.id) return;

    const confirmMessage = `¿Querés ${worker.activo ? "inactivar" : "activar"} a ${worker.nombre}? Esto cambia el estado permanente, no el temporal.`;
    if (!window.confirm(confirmMessage)) return;

    setMutating(true);

    try {
      await toggleWorkerActive(worker.id, !worker.activo);
      setFeedback(worker.activo ? "Persona inactivada correctamente." : "Persona activada correctamente.");
      await refreshAfterMutation();
    } catch (error) {
      setDetailError(pickErrorMessage(error));
    } finally {
      setMutating(false);
    }
  };

  const handleTogglePin = async (worker) => {
    if (!worker?.id) return;

    const nextPin = !worker.pin_habilitado;
    setMutating(true);

    try {
      await toggleWorkerPin(worker.id, nextPin);
      setFeedback(nextPin ? "PIN habilitado correctamente." : "PIN deshabilitado correctamente.");
      await refreshAfterMutation();
    } catch (error) {
      setDetailError(pickErrorMessage(error));
    } finally {
      setMutating(false);
    }
  };

  const submitTemporalForm = async (payload, { setSubmitError }) => {
    if (!formState) return;

    setMutating(true);

    try {
      if (formState.mode === "create") {
        await createWorkerTemporalState(formState.workerId, payload);
        setFeedback("Estado temporal creado correctamente.");
      } else {
        await updateWorkerTemporalState(formState.workerId, formState.temporalStateId, payload);
        setFeedback("Estado temporal actualizado correctamente.");
      }

      setFormState(null);
      await refreshAfterMutation();
    } catch (error) {
      setSubmitError(pickErrorMessage(error));
    } finally {
      setMutating(false);
    }
  };

  const handleCloseRecord = async (record) => {
    if (!selectedWorkerId || !record?.id) return;

    if (!window.confirm("¿Querés cerrar la vigencia de este estado temporal hoy? Esto finaliza el período sin borrar el registro histórico.")) {
      return;
    }

    setMutating(true);

    try {
      await closeWorkerTemporalState(selectedWorkerId, record.id, {});
      setFeedback("Estado temporal cerrado correctamente.");
      await refreshAfterMutation();
    } catch (error) {
      setDetailError(pickErrorMessage(error));
    } finally {
      setMutating(false);
    }
  };

  const handleAnnulRecord = async (record) => {
    if (!selectedWorkerId || !record?.id) return;

    if (!window.confirm("¿Querés anular este estado temporal? El registro no se elimina y conservará su trazabilidad.")) {
      return;
    }

    setMutating(true);

    try {
      await annulWorkerTemporalState(selectedWorkerId, record.id, {});
      setFeedback("Estado temporal anulado correctamente.");
      await refreshAfterMutation();
    } catch (error) {
      setDetailError(pickErrorMessage(error));
    } finally {
      setMutating(false);
    }
  };

  const effectiveSelectedWorker = currentWorker ?? workers.find((worker) => String(worker.id) === String(selectedWorkerId)) ?? null;

  return (
    <div className="admin-users-temporal-page">
      <header className="admin-users-temporal-hero">
        <div className="admin-users-temporal-hero__left">
          <p className="admin-users-temporal-eyebrow">Panel admin</p>
          <h1 className="admin-users-temporal-hero__title">{title}</h1>
          <p className="admin-users-temporal-hero__subtitle">{subtitle}</p>
        </div>
        <button type="button" className="admin-users-temporal-back-button" onClick={() => navigate(menuRoute)}>
          Volver al menú admin
        </button>
      </header>

      <section className="admin-users-temporal-card">
        <div className="admin-users-temporal-header">
          <div>
            <h1 className="admin-users-temporal-title">{title}</h1>
            <p className="admin-users-temporal-subtitle">{subtitle}</p>
          </div>

          <div className="admin-users-temporal-toolbar">
            <div style={{ minWidth: 260 }}>
              <label className="admin-users-temporal-label" htmlFor="admin-users-search">Buscar persona</label>
              <input
                id="admin-users-search"
                className="admin-users-temporal-input"
                type="search"
                value={busqueda}
                onChange={(event) => {
                  setBusqueda(event.target.value);
                  setOffset(0);
                }}
                placeholder="Buscá por nombre"
              />
            </div>

            <button type="button" className="admin-users-temporal-button" onClick={() => setShowWorkerModal(true)} disabled={loading}>
              Agregar persona
            </button>

            <button type="button" className="admin-users-temporal-button admin-users-temporal-button--secondary" onClick={loadList} disabled={loading}>
              Refrescar lista
            </button>
          </div>
        </div>

        {feedback ? <p className="admin-users-temporal-success">{feedback}</p> : null}
        {listError ? <p className="admin-users-temporal-error">{listError}</p> : null}
        {loading ? <p className="admin-users-temporal-muted">Cargando personas...</p> : null}

        {!loading ? (
          workers.length > 0 ? (
            <>
              <div className="admin-users-temporal-table-wrap admin-users-temporal-desktop-table">
                <table className="admin-users-temporal-table">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Estado permanente</th>
                    <th>PIN</th>
                    <th>Estado temporal</th>
                    <th>Exclusión</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => {
                    const currentTemporal = getVisibleCurrentTemporalState(worker.estado_temporal_actual ?? null);
                    const scheduledTemporal = getVisibleScheduledTemporalState(worker.estado_temporal_programado ?? null);
                    const exclusionActive = getListExclusion(worker);

                    return (
                      <tr key={getWorkerKey(worker)}>
                        <td data-label="Persona">
                          <div className="admin-users-temporal-cell-stack">
                            <strong>{worker.nombre}</strong>
                            <span className="admin-users-temporal-muted">{worker.numero_identificacion}</span>
                            <span className="admin-users-temporal-muted">{getRowTemporalSummary(worker)}</span>
                          </div>
                        </td>
                        <td data-label="Estado permanente">
                          <TemporalBadge variant={worker.activo ? "success" : "danger"}>{worker.activo ? "Activo" : "Inactivo"}</TemporalBadge>
                        </td>
                        <td data-label="PIN">
                          <SwitchControl
                            checked={Boolean(worker.pin_habilitado)}
                            labelOn="PIN"
                            labelOff="PIN"
                            onClick={() => handleTogglePin(worker)}
                            disabled={mutating}
                            variant="pin"
                          />
                        </td>
                        <td data-label="Estado temporal">
                          <div className="admin-users-temporal-cell-stack">
                            <TemporalBadge variant={currentTemporal ? "info" : scheduledTemporal ? "warning" : "neutral"}>
                              {currentTemporal ? `Vigente · ${getTemporalTypeLabel(currentTemporal.tipo)}` : scheduledTemporal ? `Programada · ${getTemporalTypeLabel(scheduledTemporal.tipo)}` : "Sin estado temporal"}
                            </TemporalBadge>
                            {currentTemporal ? <span className="admin-users-temporal-muted">{formatRange(currentTemporal)}</span> : null}
                            {!currentTemporal && scheduledTemporal ? <span className="admin-users-temporal-muted">{formatRange(scheduledTemporal)}</span> : null}
                          </div>
                        </td>
                        <td data-label="Exclusión">
                          {exclusionActive ? <TemporalBadge variant="warning">Excluye hoy</TemporalBadge> : <TemporalBadge variant="neutral">No excluye</TemporalBadge>}
                        </td>
                        <td data-label="Acciones">
                          <div className="admin-users-temporal-actions admin-users-temporal-actions--table">
                            <SwitchControl
                              checked={worker.activo}
                              labelOn="Activo"
                              labelOff="Inactivo"
                              onClick={() => handleToggleActivo(worker)}
                              disabled={mutating}
                              variant="status"
                            />
                            <button type="button" className="admin-users-temporal-button admin-users-temporal-button--ghost" onClick={() => openWorkerDetail(worker.id)}>
                              Ver detalle
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>

              <div className="admin-users-temporal-mobile-list">
                {workers.map((worker) => (
                  <WorkerMobileCard
                    key={`${getWorkerKey(worker)}-mobile`}
                    worker={worker}
                    mutating={mutating}
                    onTogglePin={handleTogglePin}
                    onToggleActivo={handleToggleActivo}
                    onOpenDetail={openWorkerDetail}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="admin-users-temporal-empty">No hay personas disponibles.</p>
          )
        ) : null}

        <div className="admin-users-temporal-pagination" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="admin-users-temporal-button admin-users-temporal-button--secondary"
            disabled={loading || offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Anterior
          </button>
          <span className="admin-users-temporal-muted">
            Mostrando {total === 0 ? 0 : offset + 1} - {Math.min(offset + limit, total)} de {total}
          </span>
          <button
            type="button"
            className="admin-users-temporal-button admin-users-temporal-button--secondary"
            disabled={loading || offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Siguiente
          </button>
        </div>
      </section>

      <WorkerTemporalDetailModal
        open={Boolean(selectedWorkerId)}
        worker={effectiveSelectedWorker}
        timeline={timeline}
        loading={detailLoading}
        error={detailError}
        onClose={closeWorkerDetail}
        onRefresh={() => loadDetail(selectedWorkerId)}
        onCreate={openCreateTemporalForm}
        onEdit={openEditTemporalForm}
        onCloseRecord={handleCloseRecord}
        onAnnulRecord={handleAnnulRecord}
      />

      <TemporalFormModal
        open={Boolean(formState)}
        mode={formState?.mode ?? "create"}
        workerName={formState?.workerName ?? ""}
        initialValues={formState?.initialValues ?? { ...DEFAULT_TEMPORAL_VALUES }}
        submitting={mutating}
        onCancel={() => {
          if (!mutating) {
            setFormState(null);
          }
        }}
        onSubmit={submitTemporalForm}
      />

      <WorkerCreateModal
        open={showWorkerModal}
        form={workerForm}
        submitting={workerSubmitting}
        error={workerError}
        onCancel={() => {
          if (!workerSubmitting) {
            setShowWorkerModal(false);
            resetWorkerForm();
          }
        }}
        onChange={(field, value) => setWorkerForm((current) => ({ ...current, [field]: value }))}
        onSubmit={handleCreateWorker}
      />
    </div>
  );
}



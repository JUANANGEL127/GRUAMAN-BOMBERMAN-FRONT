import { useMemo, useState } from "react";
import { useIndicadorCentralWorkerSearch } from "../hooks/useIndicadorCentralWorkerSearch";

function buildWorkerOptionLabel(worker, getCompanyLabel) {
  const parts = [worker.name || worker.label];

  if (worker.companyValue) {
    parts.push(getCompanyLabel(worker.companyValue));
  }

  if (worker.document) {
    parts.push(worker.document);
  }

  return parts.filter(Boolean).join(" · ");
}

export function IndicadorCentralWorkerSearchEditor({
  label,
  items,
  companyIds,
  placeholder = "Buscá un trabajador por nombre",
  emptyLabel,
  editorHint = "Escribí al menos 2 letras para buscar y agregar",
  getCompanyLabel,
  onChange,
}) {
  const [query, setQuery] = useState("");
  const { workers, loading, error } = useIndicadorCentralWorkerSearch({
    companyIds,
    query,
  });

  const filteredWorkers = useMemo(
    () => workers.filter((worker) => !items.includes(worker.value)),
    [items, workers]
  );

  function addWorker(workerName) {
    if (!workerName || items.includes(workerName)) return;
    onChange([...items, workerName]);
    setQuery("");
  }

  function removeWorker(workerName) {
    onChange(items.filter((item) => item !== workerName));
  }

  const hasCompanyScope = companyIds.length > 0;
  const hasQuery = query.trim().length >= 2;

  return (
    <div className="indicador-central-field-group indicador-central-list-editor">
      <div className="indicador-central-field-group__header">
        <label className="indicador-central-label">{label}</label>
        <span className="indicador-central-helper">{editorHint}</span>
      </div>

      <div className="indicador-central-field-group">
        <input
          className="indicador-central-input"
          type="text"
          value={query}
          placeholder={hasCompanyScope ? placeholder : "Primero seleccioná al menos una empresa"}
          disabled={!hasCompanyScope}
          onChange={(event) => setQuery(event.target.value)}
        />

        {!hasCompanyScope ? (
          <p className="indicador-central-helper">
            La búsqueda se habilita cuando el scope tiene al menos una empresa seleccionada.
          </p>
        ) : null}

        {error ? <p className="indicador-central-inline-alert indicador-central-inline-alert--error">{error}</p> : null}

        {hasCompanyScope && hasQuery ? (
          <div className="indicador-central-search-results" role="listbox" aria-label="Resultados de trabajadores">
            {loading ? (
              <p className="indicador-central-helper">Buscando trabajadores...</p>
            ) : filteredWorkers.length ? (
              filteredWorkers.map((worker) => (
                <button
                  key={`${worker.value}-${worker.id || worker.document || worker.companyValue || "worker"}`}
                  type="button"
                  className="indicador-central-search-result"
                  onClick={() => addWorker(worker.value)}
                >
                  <strong>{worker.name}</strong>
                  <span>{buildWorkerOptionLabel(worker, getCompanyLabel)}</span>
                </button>
              ))
            ) : (
              <p className="indicador-central-helper">No encontramos trabajadores con esa búsqueda en las empresas seleccionadas.</p>
            )}
          </div>
        ) : null}
      </div>

      {items.length ? (
        <div className="indicador-central-chip-list">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              className="indicador-central-chip"
              onClick={() => removeWorker(item)}
            >
              <span>{item}</span>
              <span aria-hidden="true">x</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="indicador-central-empty-state">{emptyLabel}</p>
      )}
    </div>
  );
}

export default IndicadorCentralWorkerSearchEditor;

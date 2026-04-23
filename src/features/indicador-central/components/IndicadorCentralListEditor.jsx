import { useState } from "react";

/**
 * Generic inline list editor used for chips-like collections.
 * Clicking an existing chip loads it back into the input for editing.
 */
export function IndicadorCentralListEditor({
  label,
  items,
  inputType = "text",
  placeholder,
  emptyLabel,
  addLabel = "Agregar",
  className = "",
  editorHint = "Tocá un chip para editarlo",
  onChange,
  normalizeItem = (value) => value.trim(),
  options = [],
  getItemLabel = (value) => value,
  disabled = false,
}) {
  const [draftValue, setDraftValue] = useState("");
  const hasOptions = options.length > 0;

  function commitItem() {
    const normalizedValue = normalizeItem(draftValue);
    if (!normalizedValue) return;
    if (items.includes(normalizedValue)) {
      setDraftValue("");
      return;
    }

    onChange([...items, normalizedValue]);
    setDraftValue("");
  }

  function removeItem(itemToRemove) {
    onChange(items.filter((item) => item !== itemToRemove));
  }

  function startEditing(itemToEdit) {
    setDraftValue(itemToEdit);
    removeItem(itemToEdit);
  }

  return (
    <div className={`indicador-central-field-group indicador-central-list-editor ${className}`.trim()}>
      <div className="indicador-central-field-group__header">
        <label className="indicador-central-label">{label}</label>
        <span className="indicador-central-helper">{editorHint}</span>
      </div>

      <div className="indicador-central-inline-form">
        {hasOptions ? (
          <select
            className="indicador-central-input"
            value={draftValue}
            disabled={disabled}
            onChange={(event) => setDraftValue(event.target.value)}
          >
            <option value="">{placeholder || "Seleccioná una opción"}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="indicador-central-input"
            type={inputType}
            value={draftValue}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitItem();
              }
            }}
          />
        )}
        <button type="button" className="indicador-central-button" onClick={commitItem}>
          {addLabel}
        </button>
      </div>

      {items.length ? (
        <div className="indicador-central-chip-list">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              className="indicador-central-chip"
              onClick={() => startEditing(item)}
            >
              <span>{getItemLabel(item)}</span>
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

export default IndicadorCentralListEditor;

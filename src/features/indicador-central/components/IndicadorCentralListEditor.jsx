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
}) {
  const [draftValue, setDraftValue] = useState("");

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
        <input
          className="indicador-central-input"
          type={inputType}
          value={draftValue}
          placeholder={placeholder}
          onChange={(event) => setDraftValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitItem();
            }
          }}
        />
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

export default IndicadorCentralListEditor;

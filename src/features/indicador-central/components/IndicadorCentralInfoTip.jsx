import { useId, useState } from "react";

/**
 * Small accessible info popover that works with hover, focus and tap.
 */
const INFO_TIP_TRIGGER_STYLE = {
  appearance: "none",
  WebkitAppearance: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "22px",
  minWidth: "22px",
  maxWidth: "22px",
  height: "22px",
  minHeight: "22px",
  maxHeight: "22px",
  padding: 0,
  margin: 0,
  border: 0,
  borderRadius: "999px",
  background: "rgba(30, 41, 59, 0.12)",
  color: "#0f172a",
  fontSize: "0.75rem",
  fontWeight: 800,
  lineHeight: 1,
  boxShadow: "none",
  transform: "none",
  flex: "0 0 22px",
  cursor: "pointer",
};

const INFO_TIP_WRAPPER_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  flex: "0 0 auto",
  width: "fit-content",
  maxWidth: "fit-content",
};

export function IndicadorCentralInfoTip({
  label = "Más información",
  children,
  align = "end",
}) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  function closeIfFocusLeaves(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setOpen(false);
  }

  return (
    <span
      className={`indicador-central-info-tip indicador-central-info-tip--${align}`}
      style={INFO_TIP_WRAPPER_STYLE}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={closeIfFocusLeaves}
    >
      <button
        type="button"
        className="indicador-central-info-tip__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={tooltipId}
        style={INFO_TIP_TRIGGER_STYLE}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
      >
        i
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={`indicador-central-info-tip__content${
          open ? " indicador-central-info-tip__content--open" : ""
        }`}
      >
        {children}
      </span>
    </span>
  );
}

export default IndicadorCentralInfoTip;

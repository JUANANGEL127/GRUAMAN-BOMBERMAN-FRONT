const DEFAULT_TABS = [
  { id: "configuracion", label: "Configuración" },
  { id: "ejecucion", label: "Ejecución" },
];

/**
 * Minimal tab navigation for the feature.
 */
export function IndicadorCentralTabs({ activeTab, onChange, tabs = DEFAULT_TABS }) {
  return (
    <nav className="indicador-central-tabs" aria-label="Indicador Central sections" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            id={`indicador-central-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`indicador-central-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            className={`indicador-central-tabs__button${
              isActive ? " indicador-central-tabs__button--active" : ""
            }`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export default IndicadorCentralTabs;

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  extractIndicadorCentralCutTypes,
  normalizeIndicadorCentralConfig,
  toIndicadorCentralConfigPayload,
} from "../adapters/indicadorCentralAdapter";
import { createDefaultIndicadorCentralConfig } from "../indicadorCentralContracts";
import {
  getIndicadorCentralConfig,
  updateIndicadorCentralConfig,
} from "../services/indicadorCentralService";

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

export function useIndicadorCentralConfig(options = {}) {
  const [config, setConfig] = useState(() => createDefaultIndicadorCentralConfig());
  const [initialConfig, setInitialConfig] = useState(() => createDefaultIndicadorCentralConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [supportedCutTypes, setSupportedCutTypes] = useState([]);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const syncSupportedCutTypes = useCallback((payload) => {
    const extractedCutTypes = extractIndicadorCentralCutTypes(payload);
    if (!extractedCutTypes.length) return;
    setSupportedCutTypes(extractedCutTypes);
  }, []);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getIndicadorCentralConfig();
      const normalizedConfig = normalizeIndicadorCentralConfig(response);
      syncSupportedCutTypes(response);
      setConfig(normalizedConfig);
      setInitialConfig(normalizedConfig);
      setLastLoadedAt(new Date().toISOString());
      return normalizedConfig;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo cargar la configuración."));
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [syncSupportedCutTypes]);

  useEffect(() => {
    loadConfig().catch(() => {});
  }, [loadConfig]);

  const saveConfig = useCallback(
    async (nextConfig = config) => {
      setSaving(true);
      setError(null);

      try {
        const payload = toIndicadorCentralConfigPayload(nextConfig, {
          updatedBy: options.updatedBy,
        });
        const response = await updateIndicadorCentralConfig(payload);
        syncSupportedCutTypes(response);
        const normalizedConfig = normalizeIndicadorCentralConfig(response || payload);
        setConfig(normalizedConfig);
        setInitialConfig(normalizedConfig);
        setLastSavedAt(new Date().toISOString());
        return normalizedConfig;
      } catch (requestError) {
        setError(getErrorMessage(requestError, "No se pudo guardar la configuración."));
        throw requestError;
      } finally {
        setSaving(false);
      }
    },
    [config, options.updatedBy, syncSupportedCutTypes]
  );

  const resetConfig = useCallback(() => {
    setConfig(initialConfig);
    setError(null);
  }, [initialConfig]);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(initialConfig),
    [config, initialConfig]
  );

  return {
    config,
    setConfig,
    loading,
    saving,
    error,
    supportedCutTypes,
    hasLoaded: Boolean(lastLoadedAt),
    hasUnsavedChanges,
    lastLoadedAt,
    lastSavedAt,
    loadConfig,
    reloadConfig: loadConfig,
    resetConfig,
    saveConfig,
    clearError: () => setError(null),
  };
}

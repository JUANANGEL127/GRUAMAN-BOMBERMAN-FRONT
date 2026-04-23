import { useCallback, useEffect, useState } from "react";
import { normalizeIndicadorCentralWorksites } from "../adapters/indicadorCentralAdapter";
import { getObras } from "../services/indicadorCentralService";

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

/**
 * Loads worksite options for the Indicador Central scope selector.
 */
export function useIndicadorCentralWorksites() {
  const [worksites, setWorksites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWorksites = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getObras();
      const normalizedWorksites = normalizeIndicadorCentralWorksites(response);
      setWorksites(normalizedWorksites);
      return normalizedWorksites;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudieron cargar las obras."));
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorksites().catch(() => {});
  }, [loadWorksites]);

  return {
    worksites,
    loading,
    error,
    reloadWorksites: loadWorksites,
  };
}

export default useIndicadorCentralWorksites;

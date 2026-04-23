import { useCallback, useEffect, useState } from "react";
import { normalizeIndicadorCentralCompanies } from "../adapters/indicadorCentralAdapter";
import { getEmpresas } from "../services/indicadorCentralService";

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

/**
 * Loads company options for the Indicador Central scope selector.
 */
export function useIndicadorCentralCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getEmpresas();
      const normalizedCompanies = normalizeIndicadorCentralCompanies(response);
      setCompanies(normalizedCompanies);
      return normalizedCompanies;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudieron cargar los cargos."));
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies().catch(() => {});
  }, [loadCompanies]);

  return {
    companies,
    loading,
    error,
    reloadCompanies: loadCompanies,
  };
}

export default useIndicadorCentralCompanies;

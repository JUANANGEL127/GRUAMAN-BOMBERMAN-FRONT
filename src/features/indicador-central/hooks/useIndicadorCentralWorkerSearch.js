import { useEffect, useState } from "react";
import { normalizeIndicadorCentralWorkers } from "../adapters/indicadorCentralAdapter";
import { getTrabajadores } from "../services/indicadorCentralService";

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

/**
 * Searches workers constrained by the selected company scope.
 */
export function useIndicadorCentralWorkerSearch({ companyIds = [], query = "", limit = 10 }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const normalizedCompanyIds = companyIds.map(Number).filter(Number.isFinite);

    if (!trimmedQuery || trimmedQuery.length < 2 || !normalizedCompanyIds.length) {
      setWorkers([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const responses = await Promise.all(
          normalizedCompanyIds.map((companyId) =>
            getTrabajadores({
              empresa_id: companyId,
              offset: 0,
              limit,
              busqueda: trimmedQuery,
            })
          )
        );

        if (cancelled) return;

        const mergedWorkers = responses.flatMap((response) => normalizeIndicadorCentralWorkers(response));
        const uniqueWorkers = new Map();

        mergedWorkers.forEach((worker) => {
          if (!uniqueWorkers.has(worker.value)) {
            uniqueWorkers.set(worker.value, worker);
          }
        });

        setWorkers([...uniqueWorkers.values()]);
      } catch (requestError) {
        if (cancelled) return;
        setWorkers([]);
        setError(getErrorMessage(requestError, "No se pudo buscar trabajadores."));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [companyIds, limit, query]);

  return {
    workers,
    loading,
    error,
  };
}

export default useIndicadorCentralWorkerSearch;

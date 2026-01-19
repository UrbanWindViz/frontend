import { useState, useEffect } from "react";
import { fetchWindFieldHttp } from "../api/wind";
import type { WindQuery, WindFieldGrid } from "../api/contract";

type UseWindFieldReturn = {
  windField: WindFieldGrid | null;
  loading: boolean;
  queryInProgress: boolean;
};

export function useWindField(query: WindQuery | null): UseWindFieldReturn {
  const [windField, setWindField] = useState<WindFieldGrid | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryInProgress, setQueryInProgress] = useState(false);

  useEffect(() => {
    if (!query) return;

    const ac = new AbortController();
    setLoading(true);
    setQueryInProgress(true);

    fetchWindFieldHttp(query, ac.signal)
      .then(setWindField)
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Failed to fetch wind field:", err);
        }
      })
      .finally(() => {
        setLoading(false);
        setQueryInProgress(false);
      });

    return () => ac.abort();
  }, [query]);

  return {
    windField,
    loading,
    queryInProgress,
  };
}

import { useState, useEffect, useRef, useCallback } from "react";
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

  const pendingRef = useRef(false);
  const queuedQueryRef = useRef<WindQuery | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeQuery = useCallback((q: WindQuery) => {
    if (pendingRef.current) {
      queuedQueryRef.current = q;
      return;
    }

    pendingRef.current = true;
    setLoading(true);
    setQueryInProgress(true);

    const ac = new AbortController();
    abortControllerRef.current = ac;

    fetchWindFieldHttp(q, ac.signal)
      .then(setWindField)
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Failed to fetch wind field:", err);
        }
      })
      .finally(() => {
        pendingRef.current = false;
        abortControllerRef.current = null;
        setLoading(false);
        setQueryInProgress(false);

        const queued = queuedQueryRef.current;
        if (queued) {
          queuedQueryRef.current = null;
          executeQuery(queued);
        }
      });
  }, []);

  useEffect(() => {
    if (!query) return;
    executeQuery(query);

    return () => {
      queuedQueryRef.current = null;
      abortControllerRef.current?.abort();
    };
  }, [query, executeQuery]);

  return {
    windField,
    loading,
    queryInProgress,
  };
}

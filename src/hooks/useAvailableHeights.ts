import { useState, useEffect } from "react";
import { fetchDatasets } from "../api/datasets";

type UseAvailableHeightsReturn = {
  heights: number[];
  loading: boolean;
  error: Error | null;
};

export function useAvailableHeights(): UseAvailableHeightsReturn {
  const [heights, setHeights] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    fetchDatasets(ac.signal)
      .then((datasets) => {
        const allHeights = datasets
          .map((dataset) => dataset.availableHeightsMeters)
          .flat();
        setHeights(allHeights);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Failed to fetch datasets:", err);
          setError(err);
          setLoading(false);
        }
      });

    return () => ac.abort();
  }, []);

  return {
    heights,
    loading,
    error,
  };
}

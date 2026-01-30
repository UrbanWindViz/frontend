import { useState, useEffect } from "react";
import { fetchDatasets } from "../api/datasets";
import type { DatasetInfo } from "../api/contract";

type UseAvailableHeightsReturn = {
  heights: number[];
  datasets: DatasetInfo[];
  loading: boolean;
  error: Error | null;
};

export function useAvailableHeights(): UseAvailableHeightsReturn {
  const [heights, setHeights] = useState<number[]>([]);
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    fetchDatasets(ac.signal)
      .then((fetchedDatasets) => {
        setDatasets(fetchedDatasets);
        const allHeights = [
          ...new Set(
            fetchedDatasets
              .map((dataset) => dataset.availableHeightsMeters)
              .flat(),
          ),
        ].sort((a, b) => a - b);
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
    datasets,
    loading,
    error,
  };
}

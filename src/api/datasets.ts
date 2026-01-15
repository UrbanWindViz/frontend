import { API_BASE } from "./config";
import type { DatasetInfo } from "./contract";

export async function fetchDatasets(
  signal?: AbortSignal
): Promise<DatasetInfo[]> {
  const res = await fetch(`${API_BASE}/api/datasets`, { signal });

  if (!res.ok) throw new Error(`datasets error ${res.status}`);
  return (await res.json()) as DatasetInfo[];
}

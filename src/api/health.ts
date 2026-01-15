import { API_BASE } from "./config";

export type HealthResponse = {
  status: string;
};

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/health`, { signal });
  if (!res.ok) return false;

  const data = (await res.json()) as HealthResponse;
  return data.status === "ok";
}

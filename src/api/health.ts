export type HealthResponse = {
  status: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE) {
  throw new Error(
    [
      "Missing environment variable: VITE_API_BASE_URL",
      "",
      "Create a .env file with:",
      "VITE_API_BASE_URL=http://localhost:8000",
    ].join("\n")
  );
}

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/health`, { signal });
  if (!res.ok) return false;

  const data = (await res.json()) as HealthResponse;
  return data.status === "ok";
}

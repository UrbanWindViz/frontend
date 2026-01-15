function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const API_BASE = requireEnv("VITE_API_BASE_URL").replace(/\/+$/, "");

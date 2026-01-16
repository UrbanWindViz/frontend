import { API_BASE } from "./config";
import type { WindQuery, BackendWindResponse, WindFieldGrid } from "./contract";

function b64ToFloat32(b64: string): Float32Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

export async function fetchWindFieldHttp(
  q: WindQuery,
  signal?: AbortSignal
): Promise<WindFieldGrid> {
  const url = new URL(`${API_BASE}/api/wind`);
  url.searchParams.set("datasetId", q.datasetId);
  url.searchParams.set("heightMeters", String(q.heightMeters));
  url.searchParams.set("minLon", String(q.bbox.minLon));
  url.searchParams.set("minLat", String(q.bbox.minLat));
  url.searchParams.set("maxLon", String(q.bbox.maxLon));
  url.searchParams.set("maxLat", String(q.bbox.maxLat));
  url.searchParams.set("nx", String(q.resolution.nx));
  url.searchParams.set("ny", String(q.resolution.ny));

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend error ${res.status}: ${text || res.statusText}`);
  }

  const data = (await res.json()) as BackendWindResponse;

  const u = b64ToFloat32(data.u_b64);
  const v = b64ToFloat32(data.v_b64);

  // sanity check
  const expected = data.nx * data.ny;
  if (u.length !== expected || v.length !== expected) {
    throw new Error(
      `Invalid array length (expected ${expected}, got u=${u.length}, v=${v.length})`
    );
  }

  return {
    datasetId: data.datasetId,
    heightMeters: data.heightMeters,
    bbox: data.bbox,
    nx: data.nx,
    ny: data.ny,
    u: b64ToFloat32(data.u_b64),
    v: b64ToFloat32(data.v_b64),
    speedMin: data.speedMin,
    speedMax: data.speedMax,
    lon: data.lon_b64 ? b64ToFloat32(data.lon_b64) : undefined,
    lat: data.lat_b64 ? b64ToFloat32(data.lat_b64) : undefined,
  };
}

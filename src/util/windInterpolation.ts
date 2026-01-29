import type { WindFieldGrid } from "../api/contract";

export type InterpolatedWind = {
  u: number;
  v: number;
  speed: number;
};

export function bilinearInterpolate(
  field: WindFieldGrid,
  lon: number,
  lat: number,
): InterpolatedWind {
  const { bbox, nx, ny, u, v } = field;
  const { minLon, maxLon, minLat, maxLat } = bbox;

  // normalise to grid (0, nx-1) bzw. (0, ny-1)
  const gx = ((lon - minLon) / (maxLon - minLon)) * (nx - 1);
  const gy = ((lat - minLat) / (maxLat - minLat)) * (ny - 1);

  const gxClamped = Math.max(0, Math.min(nx - 1, gx));
  const gyClamped = Math.max(0, Math.min(ny - 1, gy));

  const x0 = Math.floor(gxClamped);
  const y0 = Math.floor(gyClamped);
  const x1 = Math.min(x0 + 1, nx - 1);
  const y1 = Math.min(y0 + 1, ny - 1);

  // weights
  const wx = gxClamped - x0;
  const wy = gyClamped - y0;

  // corners
  const idx00 = y0 * nx + x0;
  const idx10 = y0 * nx + x1;
  const idx01 = y1 * nx + x0;
  const idx11 = y1 * nx + x1;

  // lon
  const u00 = u[idx00] ?? 0;
  const u10 = u[idx10] ?? 0;
  const u01 = u[idx01] ?? 0;
  const u11 = u[idx11] ?? 0;

  const uInterp =
    u00 * (1 - wx) * (1 - wy) +
    u10 * wx * (1 - wy) +
    u01 * (1 - wx) * wy +
    u11 * wx * wy;

  // lat
  const v00 = v[idx00] ?? 0;
  const v10 = v[idx10] ?? 0;
  const v01 = v[idx01] ?? 0;
  const v11 = v[idx11] ?? 0;

  const vInterp =
    v00 * (1 - wx) * (1 - wy) +
    v10 * wx * (1 - wy) +
    v01 * (1 - wx) * wy +
    v11 * wx * wy;

  return {
    u: uInterp,
    v: vInterp,
    speed: Math.hypot(uInterp, vInterp),
  };
}

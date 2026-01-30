import { BitmapLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";
import type { WindFieldGrid } from "../api/contract";

// Blue (low) -> Cyan -> Green -> Yellow -> Red (high)
function speedToColor(t: number): [number, number, number, number] {
  const x = Math.max(0, Math.min(1, t));

  let r: number, g: number, b: number;

  if (x < 0.25) {
    // Blue to Cyan
    const localT = x / 0.25;
    r = 0;
    g = Math.round(180 * localT);
    b = Math.round(180 + (255 - 180) * (1 - localT));
  } else if (x < 0.5) {
    // Cyan to Green
    const localT = (x - 0.25) / 0.25;
    r = 0;
    g = Math.round(180 + (220 - 180) * localT);
    b = Math.round(180 * (1 - localT));
  } else if (x < 0.75) {
    // Green to Yellow
    const localT = (x - 0.5) / 0.25;
    r = Math.round(255 * localT);
    g = 220;
    b = 0;
  } else {
    // Yellow to Red
    const localT = (x - 0.75) / 0.25;
    r = 255;
    g = Math.round(220 * (1 - localT));
    b = 0;
  }

  return [r, g, b, 200];
}

function generateSmoothIntensityBitmap(
  field: WindFieldGrid,
  supersample: number = 4,
): HTMLCanvasElement {
  const { nx, ny } = field;

  const width = nx * supersample;
  const height = ny * supersample;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context");
  }

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  const getSpeed = (i: number, j: number): number | null => {
    if (i < 0 || i >= nx || j < 0 || j >= ny) return null;
    const idx = j * nx + i;
    const u = field.u[idx];
    const v = field.v[idx];
    if (!isFinite(u) || !isFinite(v)) return null;
    return Math.hypot(u, v);
  };

  const interpolateSpeed = (x: number, y: number): number | null => {
    const i0 = Math.floor(x);
    const j0 = Math.floor(y);
    const i1 = i0 + 1;
    const j1 = j0 + 1;

    const fx = x - i0;
    const fy = y - j0;

    const s00 = getSpeed(i0, j0);
    const s10 = getSpeed(i1, j0);
    const s01 = getSpeed(i0, j1);
    const s11 = getSpeed(i1, j1);

    const validSpeeds = [s00, s10, s01, s11].filter(
      (s) => s !== null,
    ) as number[];
    if (validSpeeds.length === 0) return null;

    if (validSpeeds.length < 4) {
      return validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length;
    }

    const s0 = s00! * (1 - fx) + s10! * fx;
    const s1 = s01! * (1 - fx) + s11! * fx;
    return s0 * (1 - fy) + s1 * fy;
  };

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const gridX = (px + 0.5) / supersample - 0.5;
      const gridY = (height - 1 - py + 0.5) / supersample - 0.5;

      const speed = interpolateSpeed(gridX, gridY);
      const pixelIdx = (py * width + px) * 4;

      if (speed === null) {
        data[pixelIdx] = 0;
        data[pixelIdx + 1] = 0;
        data[pixelIdx + 2] = 0;
        data[pixelIdx + 3] = 0;
      } else {
        const t =
          field.speedMax <= field.speedMin
            ? 0.5
            : (speed - field.speedMin) / (field.speedMax - field.speedMin);

        const color = speedToColor(t);
        data[pixelIdx] = color[0];
        data[pixelIdx + 1] = color[1];
        data[pixelIdx + 2] = color[2];
        data[pixelIdx + 3] = color[3];
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

/**
 * Builds a smooth intensity map layer that shows wind speed as a continuous
 * color gradient covering the entire bbox.
 *
 * Areas outside the bbox will show the map background (no gray overlay).
 * NaN values within the data are made transparent.
 */
export function buildIntensityMapLayer(field: WindFieldGrid): Layer[] {
  const { minLon, minLat, maxLon, maxLat } = field.bbox;

  // Generate smooth bitmap with bilinear interpolation
  const bitmap = generateSmoothIntensityBitmap(field, 4);

  return [
    new BitmapLayer({
      id: `intensity-map-${field.heightMeters}`,
      bounds: [minLon, minLat, maxLon, maxLat],
      image: bitmap,
      pickable: false,

      // Use linear filtering for smooth scaling
      textureParameters: {
        minFilter: "linear",
        magFilter: "linear",
      },

      updateTriggers: {
        image: [
          field.nx,
          field.ny,
          field.speedMin,
          field.speedMax,
          field.u,
          field.v,
        ],
        bounds: [field.bbox],
      },
    }),
  ];
}

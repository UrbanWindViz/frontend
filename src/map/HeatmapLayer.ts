import { ScatterplotLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";
import type { WindFieldGrid } from "../api/contract";
import { speedToRgba } from "../util/color";

type HeatmapDatum = {
  position: [number, number];
  speed: number;
};

export function buildWindHeatmapLayer(field: WindFieldGrid): Layer {
  const { nx, ny } = field;
  const { minLon, minLat, maxLon, maxLat } = field.bbox;

  const data: HeatmapDatum[] = [];

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = j * nx + i;

      const u = field.u[idx];
      const v = field.v[idx];

      if (!isFinite(u) || !isFinite(v)) continue;

      const lon = minLon + ((i + 0.5) / nx) * (maxLon - minLon);
      const lat = minLat + ((j + 0.5) / ny) * (maxLat - minLat);
      const speed = Math.hypot(u, v);

      data.push({ position: [lon, lat], speed });
    }
  }

  return new ScatterplotLayer<HeatmapDatum>({
    id: "wind-heatmap",
    data,
    pickable: true,

    getPosition: (d) => d.position,
    getFillColor: (d) => {
      const rgba = speedToRgba(d.speed, field.speedMin, field.speedMax);
      return [rgba[0], rgba[1], rgba[2], 10];
    },

    radiusMinPixels: 12,
    radiusMaxPixels: 80,
    getRadius: (d) => {
      const lonSpan = maxLon - minLon;
      const latSpan = maxLat - minLat;
      const avgSpan = (lonSpan + latSpan) / 2;
      const cellSize = avgSpan / Math.sqrt(nx * ny);
      return cellSize * 150000;
    },
    radiusUnits: "meters",

    opacity: 1,
    stroked: false,
    filled: true,
  });
}

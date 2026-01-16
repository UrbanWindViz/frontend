import { IconLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";
import type { WindFieldGrid } from "../api/contract";
import { ARROW_SVG_DATA_URL } from "./windGlyph";
import { headingDegFromUV } from "../util/math";
import { speedToRgba } from "../util/color";

type ArrowDatum = {
  position: [number, number];
  speed: number;
  headingDeg: number;
};

export function buildWindArrowLayer(field: WindFieldGrid): Layer {
  const { nx, ny } = field;
  const { minLon, minLat, maxLon, maxLat } = field.bbox;

  const data: ArrowDatum[] = [];

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = j * nx + i;

      const lon = field.lon
        ? field.lon[idx]
        : minLon + ((i + 0.5) / nx) * (maxLon - minLon);
      const lat = field.lat
        ? field.lat[idx]
        : minLat + ((j + 0.5) / ny) * (maxLat - minLat);

      const u = field.u[idx];
      const v = field.v[idx];
      const speed = Math.hypot(u, v);
      const headingDeg = headingDegFromUV(u, v);

      data.push({ position: [lon, lat], speed, headingDeg });
    }
  }

  return new IconLayer<ArrowDatum>({
    id: `wind-arrows-${field.datasetId}-${field.heightMeters}`,
    data,
    pickable: true,

    updateTriggers: {
      getPosition: [field.nx, field.ny],
      getColor: [field.speedMin, field.speedMax],
    },

    iconAtlas: ARROW_SVG_DATA_URL,
    iconMapping: {
      arrow: {
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        mask: true,
        anchorY: 32,
        anchorX: 32,
      },
    },
    getIcon: () => "arrow",

    getSize: (d) => 18 + d.speed * 2.5,
    sizeUnits: "pixels",
    sizeMinPixels: 8,
    sizeMaxPixels: 60,

    getAngle: (d) => d.headingDeg,

    getPosition: (d) => d.position,
    getColor: (d) => speedToRgba(d.speed, field.speedMin, field.speedMax),

    parameters: {},
  });
}

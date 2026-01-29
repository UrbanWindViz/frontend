import { ScatterplotLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";
import type { WindFieldGrid } from "../api/contract";
import type { Particle } from "./ParticleManager";
import { speedToRgba } from "../util/color";

export function buildWindParticleLayer(
  particles: Particle[],
  field: WindFieldGrid,
): Layer {
  return new ScatterplotLayer<Particle>({
    id: `wind-particles-${field.heightMeters}`,
    data: particles,
    pickable: false, // performance

    getPosition: (d) => [d.lon, d.lat],

    getFillColor: (d) => {
      const baseColor = speedToRgba(d.speed, field.speedMin, field.speedMax);
      // fade out
      const ageFactor = 1 - d.age / d.maxAge;
      const alpha = Math.floor(baseColor[3] * ageFactor * 0.8);
      return [baseColor[0], baseColor[1], baseColor[2], alpha];
    },

    getRadius: 2,
    radiusUnits: "pixels",
    radiusMinPixels: 1,
    radiusMaxPixels: 4,

    updateTriggers: {
      // update per frame
      getPosition: [particles],
      getFillColor: [particles, field.speedMin, field.speedMax],
    },

    stroked: false, // performance
    filled: true, // performance
    billboard: false, // performance
    antialiasing: false, // performance
  });
}

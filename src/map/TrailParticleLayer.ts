import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";
import type { WindFieldGrid } from "../api/contract";
import type { TrailParticle } from "./TrailParticleManager";

type TrailSegment = {
  particleId: number;
  path: [number, number][];
  colors: [number, number, number, number][];
};

type ParticleHead = {
  position: [number, number];
  particleId: number;
};

export function buildTrailParticleLayer(
  particles: TrailParticle[],
  field: WindFieldGrid,
  trailDuration: number,
): Layer[] {
  const layers: Layer[] = [];

  const trailSegments: TrailSegment[] = [];
  const particleHeads: ParticleHead[] = [];

  for (const particle of particles) {
    if (particle.trail.length < 2) {
      // path requires multiple points
      particleHeads.push({
        position: [particle.lon, particle.lat],
        particleId: particle.id,
      });
      continue;
    }

    const path: [number, number][] = [];
    const colors: [number, number, number, number][] = [];

    // old -> new
    for (const point of particle.trail) {
      path.push([point.lon, point.lat]);
      // transparent increses with age
      const ageFactor = 1 - point.age / trailDuration;
      const alpha = Math.floor(200 * Math.max(0, ageFactor));
      colors.push([255, 255, 255, alpha]);
    }

    // current = newest
    path.push([particle.lon, particle.lat]);
    colors.push([255, 255, 255, 255]);

    trailSegments.push({
      particleId: particle.id,
      path,
      colors,
    });

    particleHeads.push({
      position: [particle.lon, particle.lat],
      particleId: particle.id,
    });
  }

  if (trailSegments.length > 0) {
    layers.push(
      new PathLayer<TrailSegment>({
        id: `trail-paths-${field.heightMeters}`,
        data: trailSegments,
        pickable: false,

        getPath: (d) => d.path,
        getColor: () => [255, 255, 255, 180],
        getWidth: 2,
        widthUnits: "pixels",
        widthMinPixels: 1,
        widthMaxPixels: 3,

        // fading
        capRounded: true,
        jointRounded: true,

        updateTriggers: {
          getPath: [particles],
          getColor: [particles],
        },
      }),
    );
  }

  if (particleHeads.length > 0) {
    layers.push(
      new ScatterplotLayer<ParticleHead>({
        id: `trail-heads-${field.heightMeters}`,
        data: particleHeads,
        pickable: false,

        getPosition: (d) => d.position,
        getFillColor: [255, 255, 255, 255],

        getRadius: 3,
        radiusUnits: "pixels",
        radiusMinPixels: 2,
        radiusMaxPixels: 5,

        stroked: false,
        filled: true,
        antialiasing: true, // smooth

        updateTriggers: {
          getPosition: [particles],
        },
      }),
    );
  }

  return layers;
}

type FadingSegment = {
  start: [number, number];
  end: [number, number];
  alpha: number;
  widthFactor: number;
};

export function buildTrailParticleLayerSmooth(
  particles: TrailParticle[],
  field: WindFieldGrid,
  trailDuration: number,
): Layer[] {
  const layers: Layer[] = [];
  const segments: FadingSegment[] = [];

  const BASE_WIDTH = 2; // head size
  const MIN_WIDTH_FACTOR = 0.3; // tail size (relative)

  for (const particle of particles) {
    const allPoints: { lon: number; lat: number; age: number }[] = [
      ...particle.trail,
      { lon: particle.lon, lat: particle.lat, age: 0 },
    ];

    for (let i = 0; i < allPoints.length - 1; i++) {
      const p1 = allPoints[i];
      const p2 = allPoints[i + 1];

      // age avg. for segment
      const avgAge = (p1.age + p2.age) / 2;
      const ageFactor = 1 - avgAge / trailDuration;
      const alpha = Math.max(0, Math.min(1, ageFactor));

      const widthFactor = MIN_WIDTH_FACTOR + (1 - MIN_WIDTH_FACTOR) * ageFactor;

      segments.push({
        start: [p1.lon, p1.lat],
        end: [p2.lon, p2.lat],
        alpha,
        widthFactor,
      });
    }
  }

  // segments as path
  if (segments.length > 0) {
    layers.push(
      new PathLayer<FadingSegment>({
        id: `trail-segments-${field.heightMeters}`,
        data: segments,
        pickable: false,

        getPath: (d) => [d.start, d.end],
        getColor: (d) => [255, 255, 255, Math.floor(220 * d.alpha)],
        getWidth: (d) => BASE_WIDTH * d.widthFactor,
        widthUnits: "pixels",
        widthMinPixels: 0.5,
        widthMaxPixels: 4,

        capRounded: true,

        updateTriggers: {
          getPath: [particles],
          getColor: [particles],
          getWidth: [particles],
        },
      }),
    );
  }

  return layers;
}

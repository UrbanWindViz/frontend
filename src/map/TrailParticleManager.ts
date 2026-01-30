import type { WindFieldGrid } from "../api/contract";
import { bilinearInterpolate } from "../util/windInterpolation";

export type TrailPoint = {
  lon: number;
  lat: number;
  age: number; // s
};

export type TrailParticle = {
  id: number;
  lon: number;
  lat: number;
  age: number;
  maxAge: number;
  speed: number;
  trail: TrailPoint[]; //  = history
};

export type TrailParticleConfig = {
  particleCount: number;
  lifetimeRange: [number, number]; // lifetime in s
  trailDuration: number; // trail in s
  trailSampleInterval: number; // trail sample in s
  speedMultiplier: number;
};

const DEFAULT_CONFIG: TrailParticleConfig = {
  particleCount: 400,
  lifetimeRange: [20, 40],
  trailDuration: 4,
  trailSampleInterval: 0.05,
  speedMultiplier: 0.00002,
};

export class TrailParticleManager {
  private particles: TrailParticle[] = [];
  private field: WindFieldGrid | null = null;
  private config: TrailParticleConfig;
  private nextId = 0;
  private timeSinceLastSample = 0;

  constructor(config: Partial<TrailParticleConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setField(field: WindFieldGrid): void {
    this.field = field;

    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(this.spawnParticle());
    }
  }

  tick(deltaTime: number): TrailParticle[] {
    if (!this.field) return [];

    this.timeSinceLastSample += deltaTime;
    const shouldSample =
      this.timeSinceLastSample >= this.config.trailSampleInterval;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.age += deltaTime;

      // age on trail
      for (let t = 0; t < p.trail.length; t++) {
        p.trail[t].age += deltaTime;
      }

      // remove old
      p.trail = p.trail.filter((t) => t.age < this.config.trailDuration);

      // respawn on old or oob
      if (p.age >= p.maxAge || !this.isInBounds(p.lon, p.lat)) {
        this.resetParticle(p);
        continue;
      }

      if (shouldSample) {
        p.trail.push({
          lon: p.lon,
          lat: p.lat,
          age: 0,
        });
      }

      // move
      const wind = bilinearInterpolate(this.field, p.lon, p.lat);

      p.lon += wind.u * this.config.speedMultiplier * deltaTime;
      p.lat += wind.v * this.config.speedMultiplier * deltaTime;
      p.speed = wind.speed;
    }

    if (shouldSample) {
      this.timeSinceLastSample = 0;
    }

    return this.particles;
  }

  private spawnParticle(): TrailParticle {
    if (!this.field) {
      return {
        id: this.nextId++,
        lon: 0,
        lat: 0,
        age: 0,
        maxAge: 1,
        speed: 0,
        trail: [],
      };
    }

    const { minLon, maxLon, minLat, maxLat } = this.field.bbox;
    const [minLife, maxLife] = this.config.lifetimeRange;

    const lon = minLon + Math.random() * (maxLon - minLon);
    const lat = minLat + Math.random() * (maxLat - minLat);
    const maxAge = minLife + Math.random() * (maxLife - minLife);

    const wind = bilinearInterpolate(this.field, lon, lat);

    return {
      id: this.nextId++,
      lon,
      lat,
      age: Math.random() * maxAge, // init age
      maxAge,
      speed: wind.speed,
      trail: [],
    };
  }

  private resetParticle(p: TrailParticle): void {
    if (!this.field) return;

    const { minLon, maxLon, minLat, maxLat } = this.field.bbox;
    const [minLife, maxLife] = this.config.lifetimeRange;

    p.lon = minLon + Math.random() * (maxLon - minLon);
    p.lat = minLat + Math.random() * (maxLat - minLat);
    p.maxAge = minLife + Math.random() * (maxLife - minLife);
    p.age = 0;
    p.trail = []; // clear on respawn

    const wind = bilinearInterpolate(this.field, p.lon, p.lat);
    p.speed = wind.speed;
  }

  private isInBounds(lon: number, lat: number): boolean {
    if (!this.field) return false;
    const { minLon, maxLon, minLat, maxLat } = this.field.bbox;
    return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
  }

  getTrailDuration(): number {
    return this.config.trailDuration;
  }
}

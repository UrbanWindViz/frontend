import type { WindFieldGrid } from "../api/contract";
import { bilinearInterpolate } from "../util/windInterpolation";

export type Particle = {
  lon: number;
  lat: number;
  age: number;
  maxAge: number;
  speed: number;
};

export type ParticleConfig = {
  particleCount: number;
  lifetimeRange: [number, number];
  speedMultiplier: number;
};

const DEFAULT_CONFIG: ParticleConfig = {
  particleCount: 5000,
  lifetimeRange: [2, 6],
  speedMultiplier: 0.00002,
};

export class ParticleManager {
  private particles: Particle[] = [];
  private field: WindFieldGrid | null = null;
  private config: ParticleConfig;

  constructor(config: Partial<ParticleConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setField(field: WindFieldGrid): void {
    this.field = field;

    this.particles = []; // on data update
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(this.spawnParticle());
    }
  }

  tick(deltaTime: number): Particle[] {
    if (!this.field) return [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.age += deltaTime;

      // respawn?
      if (p.age >= p.maxAge || !this.isInBounds(p.lon, p.lat)) {
        this.resetParticle(p);
        continue;
      }

      const wind = bilinearInterpolate(this.field, p.lon, p.lat);

      // u = lon, v = lat
      // m/s to degs per sec (approx)
      p.lon += wind.u * this.config.speedMultiplier * deltaTime;
      p.lat += wind.v * this.config.speedMultiplier * deltaTime;
      p.speed = wind.speed;
    }

    return this.particles;
  }

  private spawnParticle(): Particle {
    if (!this.field) {
      return { lon: 0, lat: 0, age: 0, maxAge: 1, speed: 0 }; // placeholder
    }

    const { minLon, maxLon, minLat, maxLat } = this.field.bbox;
    const [minLife, maxLife] = this.config.lifetimeRange;

    const lon = minLon + Math.random() * (maxLon - minLon);
    const lat = minLat + Math.random() * (maxLat - minLat);
    const maxAge = minLife + Math.random() * (maxLife - minLife);

    const wind = bilinearInterpolate(this.field, lon, lat); // Init

    return {
      lon,
      lat,
      age: Math.random() * maxAge,
      maxAge,
      speed: wind.speed,
    };
  }

  private resetParticle(p: Particle): void {
    if (!this.field) return;

    const { minLon, maxLon, minLat, maxLat } = this.field.bbox;
    const [minLife, maxLife] = this.config.lifetimeRange;

    p.lon = minLon + Math.random() * (maxLon - minLon);
    p.lat = minLat + Math.random() * (maxLat - minLat);
    p.maxAge = minLife + Math.random() * (maxLife - minLife);
    p.age = 0;

    const wind = bilinearInterpolate(this.field, p.lon, p.lat); // init
    p.speed = wind.speed;
  }

  private isInBounds(lon: number, lat: number): boolean {
    if (!this.field) return false;
    const { minLon, maxLon, minLat, maxLat } = this.field.bbox;
    return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
  }
}

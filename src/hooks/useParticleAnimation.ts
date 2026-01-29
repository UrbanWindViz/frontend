import { useRef, useEffect, useState, useMemo } from "react";
import { ParticleManager, type Particle } from "../map/ParticleManager";
import type { WindFieldGrid } from "../api/contract";

const THROTTLE_MS = 33; // fps

const BASE_PARTICLE_COUNT = 15000;
const BASE_RESOLUTION = 100 * 100;

function calculateParticleCount(nx: number, ny: number): number {
  const gridSize = nx * ny;
  const scaleFactor = Math.sqrt(gridSize / BASE_RESOLUTION);
  const count = Math.round(BASE_PARTICLE_COUNT * scaleFactor);
  return Math.max(8000, Math.min(80000, count)); // Clamp
}

export function useParticleAnimation(
  field: WindFieldGrid | null,
  enabled: boolean,
  resolution: { nx: number; ny: number } = { nx: 100, ny: 100 },
): Particle[] {
  const managerRef = useRef<ParticleManager | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  const particleCount = useMemo(
    () => calculateParticleCount(resolution.nx, resolution.ny),
    [resolution.nx, resolution.ny],
  );

  useEffect(() => {
    managerRef.current = new ParticleManager({
      particleCount,
    });
    return () => {
      managerRef.current = null;
    };
  }, [particleCount]);

  useEffect(() => {
    if (field && managerRef.current) {
      managerRef.current.setField(field);
    }
  }, [field]);

  useEffect(() => {
    if (!enabled || !field) {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = 0;
      }
      lastTimeRef.current = 0;
      return;
    }

    const animate = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
        lastUpdateRef.current = time;
      }

      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      if (managerRef.current) {
        const newParticles = managerRef.current.tick(deltaTime);

        // Throttle React state updates to ~30fps
        if (time - lastUpdateRef.current > THROTTLE_MS) {
          setParticles([...newParticles]);
          lastUpdateRef.current = time;
        }
      }

      frameIdRef.current = requestAnimationFrame(animate);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = 0;
      }
    };
  }, [enabled, field]);

  return particles;
}

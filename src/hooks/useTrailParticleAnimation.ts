import { useRef, useEffect, useState } from "react";
import {
  TrailParticleManager,
  type TrailParticle,
} from "../map/TrailParticleManager";
import type { WindFieldGrid } from "../api/contract";

const THROTTLE_MS = 33; // fps

export function useTrailParticleAnimation(
  field: WindFieldGrid | null,
  enabled: boolean,
): { particles: TrailParticle[]; trailDuration: number } {
  const managerRef = useRef<TrailParticleManager | null>(null);
  const [particles, setParticles] = useState<TrailParticle[]>([]);
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    managerRef.current = new TrailParticleManager();
    return () => {
      managerRef.current = null;
    };
  }, []);

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

        if (time - lastUpdateRef.current > THROTTLE_MS) {
          setParticles(
            newParticles.map((p) => ({
              ...p,
              trail: [...p.trail],
            })),
          );
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

  const trailDuration = managerRef.current?.getTrailDuration() ?? 4;

  return { particles, trailDuration };
}

import { useEffect, useRef, useState } from "react";

export function useAnimation(
  timestepCount: number,
  playbackSpeed: number,
  enabled: boolean
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const frameRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled || timestepCount === 0) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      return;
    }

    const intervalMs = 1000 / playbackSpeed;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;

      if (elapsed >= intervalMs) {
        setCurrentIndex((prev) => (prev + 1) % timestepCount);
        lastUpdateRef.current = now;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [enabled, playbackSpeed, timestepCount]);

  return {
    currentIndex,
    setCurrentIndex,
  };
}

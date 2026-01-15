export function speedToRgba(
  speed: number,
  min: number,
  max: number
): [number, number, number, number] {
  const t = max <= min ? 0.5 : (speed - min) / (max - min);
  const x = Math.max(0, Math.min(1, t));
  const r = Math.round(255 * Math.max(0, (x - 0.5) * 2));
  const g = Math.round(255 * (x < 0.5 ? x * 2 : 1 - (x - 0.5) * 2));
  const b = Math.round(255 * Math.max(0, (0.5 - x) * 2));
  return [r, g, b, 200];
}

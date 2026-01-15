export function headingDegFromUV(u: number, v: number): number {
  const deg = (Math.atan2(u, v) * 180) / Math.PI;
  return (deg + 360) % 360;
}

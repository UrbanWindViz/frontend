function envNumber(name: string, fallback: number): number {
  const v = import.meta.env[name];
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const MAP_FIT_PADDING = {
  top: envNumber("VITE_MAP_FIT_PAD_TOP", 20),
  right: envNumber("VITE_MAP_FIT_PAD_RIGHT", 20),
  bottom: envNumber("VITE_MAP_FIT_PAD_BOTTOM", 20),
  left: envNumber("VITE_MAP_FIT_PAD_LEFT", 420),
};

import { useEffect, useState } from "react";
import type { VisualizationType } from "../map/config";

export type UrlState = {
  datasetId?: string;
  heightMeters?: number;
  nx?: number;
  ny?: number;
  visualizationType?: VisualizationType;
  lon?: number;
  lat?: number;
  zoom?: number;
};

export function parseUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);

  const state: UrlState = {};

  const datasetId = params.get("dataset");
  if (datasetId) state.datasetId = datasetId;

  const height = params.get("height");
  if (height) state.heightMeters = Number(height);

  const nx = params.get("nx");
  if (nx) state.nx = Number(nx);

  const ny = params.get("ny");
  if (ny) state.ny = Number(ny);

  const viz = params.get("viz");
  if (viz === "arrows" || viz === "heatmap") {
    state.visualizationType = viz;
  }

  const lon = params.get("lon");
  if (lon) state.lon = Number(lon);

  const lat = params.get("lat");
  if (lat) state.lat = Number(lat);

  const zoom = params.get("zoom");
  if (zoom) state.zoom = Number(zoom);

  return state;
}

export function buildPermalink(state: {
  datasetId: string | null;
  heightMeters: number | null;
  resolution: { nx: number; ny: number };
  visualizationType: VisualizationType;
  mapCenter?: { lon: number; lat: number };
  mapZoom?: number;
}): string {
  const params = new URLSearchParams();

  if (state.datasetId) params.set("dataset", state.datasetId);
  if (state.heightMeters !== null)
    params.set("height", String(state.heightMeters));
  params.set("nx", String(state.resolution.nx));
  params.set("ny", String(state.resolution.ny));
  params.set("viz", state.visualizationType);

  if (state.mapCenter) {
    params.set("lon", state.mapCenter.lon.toFixed(6));
    params.set("lat", state.mapCenter.lat.toFixed(6));
  }

  if (state.mapZoom !== undefined) {
    params.set("zoom", state.mapZoom.toFixed(2));
  }

  const base = window.location.origin + window.location.pathname;
  return `${base}?${params.toString()}`;
}

export function useUrlState() {
  const [urlState, setUrlState] = useState<UrlState>(() => parseUrlState());

  useEffect(() => {
    const handlePopState = () => {
      setUrlState(parseUrlState());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return urlState;
}

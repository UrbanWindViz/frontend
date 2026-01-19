export type HealthResponse = {
  status: string;
  source: string;
  dataDir: string;
};

export type BBox = {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
};

export type DatasetInfo = {
  id: string;
  name: string;
  datasetExtent: BBox;
  availableHeightsMeters: number[];
};

export type BackendWindResponse = {
  datasetId: string;
  heightMeters: number;

  bbox: BBox;
  nx: number;
  ny: number;

  u_b64: string;
  v_b64: string;

  speedMin: number;
  speedMax: number;

  lon_b64?: string;
  lat_b64?: string;
};

export type WindQuery_Controls = {
  heightMeters: number;
  wsRef?: number;
  wdRef?: number;
};

export type WindQuery_Map = {
  bbox: BBox;
  resolution: { nx: number; ny: number };
};

export type WindQuery = WindQuery_Controls & WindQuery_Map;

export type WindFieldGrid = {
  heightMeters: number;

  bbox: BBox;
  nx: number;
  ny: number;

  u: Float32Array;
  v: Float32Array;

  speedMin: number;
  speedMax: number;

  lon?: Float32Array;
  lat?: Float32Array;
};

export type WeatherTimestep = {
  timestep: number;
  datetime: string;
  label: string;
  wsRef: number;
  wdRef: number;
};

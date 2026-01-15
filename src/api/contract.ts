export type HealthResponse = {
  status: string;
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
};

export type WindQuery = {
  datasetId: string;
  heightMeters: number;
  bbox: BBox;
  resolution: { nx: number; ny: number };
};

export type WindFieldGrid = {
  datasetId: string;

  heightMeters: number;

  bbox: BBox;

  nx: number;
  ny: number;

  u: Float32Array;
  v: Float32Array;

  speedMin: number;
  speedMax: number;
};

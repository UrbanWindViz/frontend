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

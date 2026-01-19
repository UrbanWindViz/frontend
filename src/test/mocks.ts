import type {
  WindFieldGrid,
  WindQuery,
  WeatherTimestep,
  DatasetInfo,
  BBox,
} from "../api/contract";

export function createMockWindFieldGrid(
  overrides?: Partial<WindFieldGrid>,
): WindFieldGrid {
  const nx = overrides?.nx ?? 10;
  const ny = overrides?.ny ?? 10;
  const size = nx * ny;

  return {
    heightMeters: 10,
    bbox: {
      minLon: 13.3,
      maxLon: 13.5,
      minLat: 52.4,
      maxLat: 52.6,
    },
    nx,
    ny,
    u: new Float32Array(size).fill(1.5),
    v: new Float32Array(size).fill(2.0),
    speedMin: 0,
    speedMax: 10,
    ...overrides,
  };
}

export function createMockWindQuery(overrides?: Partial<WindQuery>): WindQuery {
  return {
    heightMeters: 10,
    bbox: {
      minLon: 13.3,
      maxLon: 13.5,
      minLat: 52.4,
      maxLat: 52.6,
    },
    resolution: { nx: 100, ny: 100 },
    ...overrides,
  };
}

export function createMockWeatherTimestep(
  overrides?: Partial<WeatherTimestep>,
): WeatherTimestep {
  return {
    datetime: "2025-01-17T12:00:00Z",
    wsRef: 5.5,
    wdRef: 180,
    timestep: 0,
    label: "?",
    ...overrides,
  };
}

export function createMockWeatherTimesteps(count: number): WeatherTimestep[] {
  return Array.from({ length: count }, (_, i) =>
    createMockWeatherTimestep({
      datetime: new Date(Date.now() + i * 3600000).toISOString(),
      wsRef: 3 + Math.random() * 5,
      wdRef: Math.random() * 360,
    }),
  );
}

export function createMockDatasetInfo(
  overrides?: Partial<DatasetInfo>,
): DatasetInfo {
  return {
    id: "test-dataset",
    name: "Test Dataset",
    datasetExtent: {
      minLon: 13.0,
      maxLon: 14.0,
      minLat: 52.0,
      maxLat: 53.0,
    },
    availableHeightsMeters: [10, 50, 100],
    ...overrides,
  };
}

export function createMockBBox(overrides?: Partial<BBox>): BBox {
  return {
    minLon: 13.3,
    maxLon: 13.5,
    minLat: 52.4,
    maxLat: 52.6,
    ...overrides,
  };
}

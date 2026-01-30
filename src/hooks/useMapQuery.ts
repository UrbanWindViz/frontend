import { useEffect, useCallback, useRef } from "react";
import type { Map } from "maplibre-gl";
import type { WindQuery_Map } from "../api/contract";

const DEFAULT_MIN_ZOOM = 13;

type UseMapQueryParams = {
  map: Map | null;
  resolution: { nx: number; ny: number };
  onMapQuery: (query: WindQuery_Map | null) => void;
  onMapMove?: (center: { lon: number; lat: number }, zoom: number) => void;
  minZoom?: number;
};

export function useMapQuery(params: UseMapQueryParams): void {
  const {
    map,
    resolution,
    onMapQuery,
    onMapMove,
    minZoom = DEFAULT_MIN_ZOOM,
  } = params;

  const onMapQueryRef = useRef(onMapQuery);
  const onMapMoveRef = useRef(onMapMove);
  const resolutionRef = useRef(resolution);
  const minZoomRef = useRef(minZoom);

  useEffect(() => {
    onMapQueryRef.current = onMapQuery;
  }, [onMapQuery]);

  useEffect(() => {
    onMapMoveRef.current = onMapMove;
  }, [onMapMove]);

  useEffect(() => {
    resolutionRef.current = resolution;
  }, [resolution]);

  useEffect(() => {
    minZoomRef.current = minZoom;
  }, [minZoom]);

  const emitQuery = useCallback(() => {
    if (!map) return;

    const zoom = map.getZoom();
    const center = map.getCenter();

    if (onMapMoveRef.current) {
      onMapMoveRef.current({ lon: center.lng, lat: center.lat }, zoom);
    }

    if (zoom < minZoomRef.current) {
      onMapQueryRef.current(null);
      return;
    }

    const bounds = map.getBounds();
    onMapQueryRef.current({
      bbox: {
        minLon: bounds.getWest(),
        minLat: bounds.getSouth(),
        maxLon: bounds.getEast(),
        maxLat: bounds.getNorth(),
      },
      resolution: resolutionRef.current,
    });
  }, [map]);

  useEffect(() => {
    if (!map) return;
    emitQuery();
  }, [map, resolution]);

  useEffect(() => {
    if (!map) return;

    map.on("moveend", emitQuery);
    map.on("zoomend", emitQuery);
    map.on("load", emitQuery);

    return () => {
      map.off("moveend", emitQuery);
      map.off("zoomend", emitQuery);
      map.off("load", emitQuery);
    };
  }, [map]);
}

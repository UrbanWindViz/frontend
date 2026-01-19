import { useEffect, useCallback, useRef } from "react";
import type { Map } from "maplibre-gl";
import type { WindQuery_Map } from "../api/contract";

type UseMapQueryParams = {
  map: Map | null;
  resolution: { nx: number; ny: number };
  onMapQuery: (query: WindQuery_Map) => void;
  onMapMove?: (center: { lon: number; lat: number }, zoom: number) => void;
};

export function useMapQuery(params: UseMapQueryParams): void {
  const { map, resolution, onMapQuery, onMapMove } = params;

  const onMapQueryRef = useRef(onMapQuery);
  const onMapMoveRef = useRef(onMapMove);
  const resolutionRef = useRef(resolution);

  useEffect(() => {
    onMapQueryRef.current = onMapQuery;
  }, [onMapQuery]);

  useEffect(() => {
    onMapMoveRef.current = onMapMove;
  }, [onMapMove]);

  useEffect(() => {
    resolutionRef.current = resolution;
  }, [resolution]);

  const emitQuery = useCallback(() => {
    if (!map) return;

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

    if (onMapMoveRef.current) {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onMapMoveRef.current({ lon: center.lng, lat: center.lat }, zoom);
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;
    emitQuery();
  }, [map, resolution, emitQuery]);

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
  }, [map, emitQuery]);
}

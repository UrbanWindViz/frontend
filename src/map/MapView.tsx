import { useEffect, useMemo, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { WindFieldGrid, WindQuery_Map } from "../api/contract";
import { buildWindArrowLayer } from "./WindLayer";
import { buildWindHeatmapLayer } from "./HeatmapLayer";
import type { VisualizationType } from "./config";

type Props = {
  windField: WindFieldGrid | null;
  visualizationType: VisualizationType;
  initialCenter?: { lon: number; lat: number };
  initialZoom?: number;
  onMapQuery: (query: WindQuery_Map) => void;
  onMapMove?: (center: { lon: number; lat: number }, zoom: number) => void;
};

export function MapView({
  windField,
  visualizationType,
  initialCenter,
  initialZoom,
  onMapQuery,
  onMapMove,
}: Props) {
  const mapRef = useRef<Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onMapQueryRef = useRef(onMapQuery);
  const onMapMoveRef = useRef(onMapMove);
  const previousLayersRef = useRef<any[]>([]);

  useEffect(() => {
    onMapQueryRef.current = onMapQuery;
  }, [onMapQuery]);

  useEffect(() => {
    onMapMoveRef.current = onMapMove;
  }, [onMapMove]);

  const layers = useMemo(() => {
    if (!windField) return [];

    switch (visualizationType) {
      case "arrows":
        return [buildWindArrowLayer(windField)];
      case "heatmap":
        return [buildWindHeatmapLayer(windField)];
      default:
        return [];
    }
  }, [windField, visualizationType]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      } as any,
      center: initialCenter
        ? [initialCenter.lon, initialCenter.lat]
        : undefined,
      zoom: initialZoom,
      maxZoom: 19,
    });

    const overlay = new MapboxOverlay({
      layers: [],
      _typedArrayManagerProps: {
        overAlloc: 1,
        poolSize: 0,
      },
    });
    map.addControl(overlay as any);

    mapRef.current = map;
    overlayRef.current = overlay;

    const emitBbox = () => {
      const b = map.getBounds();
      onMapQueryRef.current({
        bbox: {
          minLon: b.getWest(),
          minLat: b.getSouth(),
          maxLon: b.getEast(),
          maxLat: b.getNorth(),
        },
      });

      if (onMapMoveRef.current) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        onMapMoveRef.current({ lon: center.lng, lat: center.lat }, zoom);
      }
    };

    map.on("moveend", emitBbox);
    map.on("zoomend", emitBbox);

    map.on("load", emitBbox);

    return () => {
      if (overlayRef.current) {
        previousLayersRef.current.forEach((layer) => {
          if (layer && typeof layer.finalize === "function") {
            layer.finalize();
          }
        });
        previousLayersRef.current = [];
        overlayRef.current.finalize();
      }
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (overlayRef.current) {
      previousLayersRef.current.forEach((layer) => {
        if (layer && typeof layer.finalize === "function") {
          try {
            layer.finalize();
          } catch (e) {}
        }
      });

      overlayRef.current.setProps({ layers });
      previousLayersRef.current = layers;
    }
  }, [layers]);

  return <div ref={containerRef} className="map-container" />;
}

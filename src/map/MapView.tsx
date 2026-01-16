import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { BBox, WindFieldGrid } from "../api/contract";
import { MAP_FIT_PADDING } from "./config";
import { buildWindArrowLayer } from "./WindLayer";
import { buildWindHeatmapLayer } from "./HeatmapLayer";
import type { VisualizationType } from "./config";

type Props = {
  datasetExtend: BBox | null;
  windField: WindFieldGrid | null;
  visualizationType: VisualizationType;
  initialCenter?: { lon: number; lat: number };
  initialZoom?: number;
  onViewportBbox: (bbox: BBox) => void;
  onMapMove?: (center: { lon: number; lat: number }, zoom: number) => void;
};

export function MapView({
  datasetExtend,
  windField,
  visualizationType,
  initialCenter,
  initialZoom,
  onViewportBbox,
  onMapMove,
}: Props) {
  const mapRef = useRef<Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialCenterRef = useRef(initialCenter);
  const onViewportBboxRef = useRef(onViewportBbox);
  const onMapMoveRef = useRef(onMapMove);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    onViewportBboxRef.current = onViewportBbox;
  }, [onViewportBbox]);

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

    const overlay = new MapboxOverlay({ layers: [] });
    map.addControl(overlay as any);

    mapRef.current = map;
    overlayRef.current = overlay;

    const emitBbox = () => {
      const b = map.getBounds();
      onViewportBboxRef.current({
        minLon: b.getWest(),
        minLat: b.getSouth(),
        maxLon: b.getEast(),
        maxLat: b.getNorth(),
      });

      if (onMapMoveRef.current) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        onMapMoveRef.current({ lon: center.lng, lat: center.lat }, zoom);
      }
    };

    map.on("moveend", emitBbox);
    map.on("zoomend", emitBbox);

    map.on("load", () => {
      setMapInitialized(true);
      emitBbox();
    });

    return () => {
      overlay.finalize();
      map.remove();
      setMapInitialized(false);
    };
  }, []);

  useEffect(() => {
    if (!datasetExtend || !mapRef.current || !mapInitialized) return;
    if (initialCenterRef.current) return;

    mapRef.current.fitBounds(
      [
        [datasetExtend.minLon, datasetExtend.minLat],
        [datasetExtend.maxLon, datasetExtend.maxLat],
      ],
      { padding: MAP_FIT_PADDING, duration: 0 }
    );
  }, [datasetExtend, mapInitialized]);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setProps({ layers });
    }
  }, [layers]);

  return <div ref={containerRef} className="map-container" />;
}

import React, { useEffect, useMemo, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { BBox, WindFieldGrid } from "../api/contract";
import { MAP_FIT_PADDING, type VisualizationType } from "./config";
import { buildWindArrowLayer } from "./WindLayer";
import { buildWindHeatmapLayer } from "./HeatmapLayer";

type Props = {
  datasetExtend: BBox | null;
  windField: WindFieldGrid | null;
  visualizationType: VisualizationType;
  onViewportBbox: (bbox: BBox) => void;
};

export function MapView({
  datasetExtend,
  windField,
  visualizationType,
  onViewportBbox,
}: Props) {
  const mapRef = useRef<Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
    });

    const overlay = new MapboxOverlay({ layers });
    map.addControl(overlay as any);

    mapRef.current = map;
    overlayRef.current = overlay;

    const emitBbox = () => {
      const b = map.getBounds();
      onViewportBbox({
        minLon: b.getWest(),
        minLat: b.getSouth(),
        maxLon: b.getEast(),
        maxLat: b.getNorth(),
      });
    };
    map.on("moveend", emitBbox);
    map.on("zoomend", emitBbox);

    return () => {
      overlay.finalize();
      map.remove();
    };
  }, [onViewportBbox]);

  useEffect(() => {
    if (!datasetExtend || !mapRef.current) return;

    mapRef.current.fitBounds(
      [
        [datasetExtend.minLon, datasetExtend.minLat],
        [datasetExtend.maxLon, datasetExtend.maxLat],
      ],
      { padding: MAP_FIT_PADDING, duration: 0 }
    );
  }, [datasetExtend]);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setProps({ layers });
    }
  }, [layers]);

  return <div ref={containerRef} className="map-container" />;
}

import React, { useEffect, useMemo, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { BBox, WindFieldGrid } from "../api/contract";
import { MAP_FIT_PADDING } from "./config";
import { buildWindArrowLayer } from "./WindLayer";

type Props = {
  datasetExtend: BBox | null;
  windField: WindFieldGrid | null;
  onViewportBbox: (bbox: BBox) => void;
};

export function MapView({ datasetExtend, windField, onViewportBbox }: Props) {
  const mapRef = useRef<Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const layers = useMemo(() => {
    if (windField) {
      console.debug("Rendering new wind field as layer.", windField);
      return [buildWindArrowLayer(windField)];
    } else {
      console.debug("Wind field is empty.");
      return [];
    }
  }, [windField]);

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
            attribution: "&copy; OpenStreetMap contributors",
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

    //
    // Emits changed area on
    // - movement
    // - zoom
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

    //
    // Cleanup
    return () => {
      overlay.finalize();
      map.remove();
    };
  }, [onViewportBbox]);

  //
  // Re-Size displayed map to area of selected dataset
  // should only run once on selection
  useEffect(() => {
    if (!datasetExtend) return;

    console.debug("Re-Sizing map to new dataset-extend.", datasetExtend);
    if (!mapRef.current) return;

    mapRef.current.fitBounds(
      [
        [datasetExtend.minLon, datasetExtend.minLat],
        [datasetExtend.maxLon, datasetExtend.maxLat],
      ],
      { padding: MAP_FIT_PADDING, duration: 0 }
    );
  }, [datasetExtend]);

  //
  // Updates arrow-overly
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setProps({ layers });
    }
  }, [layers]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

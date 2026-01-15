import React, { useEffect, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
import type { BBox } from "../api/contract";
import { MAP_FIT_PADDING } from "./config";

type Props = {
  datasetViewBbox: BBox;
};

export function MapView({ datasetViewBbox }: Props) {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  console.log(datasetViewBbox);

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

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.fitBounds(
      [
        [datasetViewBbox.minLon, datasetViewBbox.minLat],
        [datasetViewBbox.maxLon, datasetViewBbox.maxLat],
      ],
      { padding: MAP_FIT_PADDING, duration: 10 }
    );
  }, [datasetViewBbox]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

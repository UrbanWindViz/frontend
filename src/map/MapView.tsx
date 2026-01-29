import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { WindFieldGrid, WindQuery_Map } from "../api/contract";
import { buildWindArrowLayer } from "./WindLayer";
import { buildWindHeatmapLayer } from "./HeatmapLayer";
import { buildWindParticleLayer } from "./ParticleLayer";
import { VISUALIZATION_OPTIONS, type VisualizationType } from "./config";
import { useUrlState } from "../util/urlStats";
import { useMapQuery } from "../hooks";
import { useParticleAnimation } from "../hooks/useParticleAnimation";

type Props = {
  windField: WindFieldGrid | null;
  onMapQuery: (query: WindQuery_Map) => void;
  onMapMove?: (center: { lon: number; lat: number }, zoom: number) => void;
};

const PRESET_RESOLUTIONS = [
  { label: "Niedrig (50×50)", nx: 50, ny: 50 },
  { label: "Mittel (100×100)", nx: 100, ny: 100 },
  { label: "Hoch (200×200)", nx: 200, ny: 200 },
  { label: "Sehr hoch (400×400)", nx: 400, ny: 400 },
  { label: "Don't use live (800×800)", nx: 800, ny: 800 },
];

export function MapView({ windField, onMapQuery, onMapMove }: Props) {
  const urlState = useUrlState();
  const [visualizationType, setVisualizationType] = useState<VisualizationType>(
    urlState.visualizationType ?? "arrows",
  );
  const [resolution, setResolution] = useState(
    urlState.nx && urlState.ny
      ? { nx: urlState.nx, ny: urlState.ny }
      : { nx: 100, ny: 100 },
  );
  const [showSettings, setShowSettings] = useState(false);

  const mapRef = useRef<Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousLayersRef = useRef<any[]>([]);

  useMapQuery({
    map: mapRef.current,
    resolution,
    onMapQuery,
    onMapMove,
  });

  const particles = useParticleAnimation(
    windField,
    visualizationType === "particles",
    resolution
  );

  const layers = useMemo(() => {
    if (!windField) return [];

    switch (visualizationType) {
      case "arrows":
        return [buildWindArrowLayer(windField)];
      case "heatmap":
        return [buildWindHeatmapLayer(windField)];
      case "particles":
        return [buildWindParticleLayer(particles, windField)];
      default:
        return [];
    }
  }, [windField, visualizationType, particles]);

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
      center:
        urlState.lon && urlState.lat ? [urlState.lon, urlState.lat] : undefined,
      zoom: urlState.zoom,
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

  const currentResKey = `${resolution.nx}×${resolution.ny}`;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} className="map-container" />

      <button
        onClick={() => setShowSettings(!showSettings)}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          width: "40px",
          height: "40px",
          borderRadius: "4px",
          border: "none",
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          zIndex: 1000,
        }}
        title="Darstellungseinstellungen"
      >
        ⚙️
      </button>

      {showSettings && (
        <div
          style={{
            position: "absolute",
            bottom: "70px",
            left: "20px",
            backgroundColor: "white",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            padding: "12px",
            minWidth: "200px",
            zIndex: 1000,
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "4px",
              }}
            >
              Darstellung
            </label>
            <select
              value={visualizationType}
              onChange={(e) =>
                setVisualizationType(e.target.value as VisualizationType)
              }
              style={{
                width: "100%",
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "13px",
              }}
            >
              {VISUALIZATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "4px",
              }}
            >
              Auflösung
            </label>
            <select
              value={currentResKey}
              onChange={(e) => {
                const preset = PRESET_RESOLUTIONS.find(
                  (p) => `${p.nx}×${p.ny}` === e.target.value,
                );
                if (preset) {
                  setResolution({ nx: preset.nx, ny: preset.ny });
                }
              }}
              style={{
                width: "100%",
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "13px",
              }}
            >
              {PRESET_RESOLUTIONS.map((preset) => (
                <option
                  key={`${preset.nx}×${preset.ny}`}
                  value={`${preset.nx}×${preset.ny}`}
                >
                  {preset.label}
                </option>
              ))}
            </select>
            <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
              {resolution.nx}×{resolution.ny} = {resolution.nx * resolution.ny}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

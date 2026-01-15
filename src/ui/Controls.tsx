import React from "react";
import type { DatasetInfo } from "../api/contract";

type Props = {
  loading: boolean;

  datasets: DatasetInfo[];
  datasetId: string | null;
  onDatasetId: (id: string) => void;

  heights: number[];
  heightMeters: number | null;
  onHeightMeters: (height: number) => void;

  resolution: { nx: number; ny: number };
  onResolution: (res: { nx: number; ny: number }) => void;
};

const PRESET_RESOLUTIONS = [
  { label: "Niedrig (50×50)", nx: 50, ny: 50 },
  { label: "Mittel (100×100)", nx: 100, ny: 100 },
  { label: "Hoch (200×200)", nx: 200, ny: 200 },
  { label: "Sehr hoch (400×400)", nx: 400, ny: 400 },
];

export function Controls(props: Props) {
  const currentResKey = `${props.resolution.nx}×${props.resolution.ny}`;
  const hasDataset = props.datasetId !== null;

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        width: 360,
        background: "rgba(255,255,255,0.92)",
        borderRadius: 12,
        padding: 12,
        boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div style={{ fontWeight: 700 }}>UrbanWindViz</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {props.loading ? "Loading…" : "Ready"}
        </div>
      </div>

      {/* Dataset Selection */}
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Dataset</div>
        <select
          value={props.datasetId ?? ""}
          onChange={(e) => props.onDatasetId(e.target.value)}
          style={{ width: "100%", padding: "4px 8px" }}
          disabled={props.datasets.length === 0}
        >
          {props.datasets.length === 0 ? (
            <option value="">(lädt…)</option>
          ) : (
            <>
              <option value="" disabled>
                (bitte auswählen)
              </option>
              {props.datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Height Selection */}
      {hasDataset && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Höhe</div>
          <select
            value={props.heightMeters ?? ""}
            onChange={(e) => props.onHeightMeters(Number(e.target.value))}
            style={{ width: "100%", padding: "4px 8px" }}
            disabled={props.heights.length === 0}
          >
            {props.heights.length === 0 ? (
              <option value="">(keine Höhen verfügbar)</option>
            ) : (
              props.heights.map((h) => (
                <option key={h} value={h}>
                  {h} m
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {/* Resolution Selection */}
      {hasDataset && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Auflösung</div>
          <select
            value={currentResKey}
            onChange={(e) => {
              const preset = PRESET_RESOLUTIONS.find(
                (p) => `${p.nx}×${p.ny}` === e.target.value
              );
              if (preset) {
                props.onResolution({ nx: preset.nx, ny: preset.ny });
              }
            }}
            style={{ width: "100%", padding: "4px 8px" }}
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
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
            {props.resolution.nx}×{props.resolution.ny} ={" "}
            {props.resolution.nx * props.resolution.ny} Pfeile
          </div>
        </div>
      )}
    </div>
  );
}

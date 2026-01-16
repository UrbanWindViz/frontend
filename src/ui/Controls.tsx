import React, { useState } from "react";
import type { DatasetInfo } from "../api/contract";
import { VISUALIZATION_OPTIONS, type VisualizationType } from "../map/config";

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
  visualizationType: VisualizationType;
  onVisualizationType: (type: VisualizationType) => void;
  onGeneratePermalink: () => void;
  permalinkCopied: boolean;
};

const PRESET_RESOLUTIONS = [
  { label: "Niedrig (50×50)", nx: 50, ny: 50 },
  { label: "Mittel (100×100)", nx: 100, ny: 100 },
  { label: "Hoch (200×200)", nx: 200, ny: 200 },
  { label: "Sehr hoch (400×400)", nx: 400, ny: 400 },
  { label: "Don't use live (800×800)", nx: 800, ny: 800 },
];

export function Controls(props: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentResKey = `${props.resolution.nx}×${props.resolution.ny}`;
  const hasDataset = props.datasetId !== null;

  if (isCollapsed) {
    return (
      <button
        className="controls-collapsed"
        onClick={() => setIsCollapsed(false)}
        title="Einstellungen öffnen"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6M1 12h6m6 0h6" />
        </svg>
      </button>
    );
  }

  return (
    <div className="controls-panel">
      <div className="controls-header">
        <div className="controls-title">UrbanWindViz</div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div className="controls-status">
            {props.loading ? "Loading…" : "Ready"}
          </div>
          <button
            className="controls-collapse-btn"
            onClick={() => setIsCollapsed(true)}
            title="Einstellungen minimieren"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="control-group">
        <label className="control-label">Dataset</label>
        <select
          className="control-select"
          value={props.datasetId ?? ""}
          onChange={(e) => props.onDatasetId(e.target.value)}
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

      {hasDataset && (
        <div className="control-group">
          <label className="control-label">Höhe</label>
          <select
            className="control-select"
            value={props.heightMeters ?? ""}
            onChange={(e) => props.onHeightMeters(Number(e.target.value))}
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

      {hasDataset && (
        <div className="control-group">
          <label className="control-label">Visualisierung</label>
          <select
            className="control-select"
            value={props.visualizationType}
            onChange={(e) =>
              props.onVisualizationType(e.target.value as VisualizationType)
            }
          >
            {VISUALIZATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {hasDataset && (
        <div className="control-group">
          <label className="control-label">Auflösung</label>
          <select
            className="control-select"
            value={currentResKey}
            onChange={(e) => {
              const preset = PRESET_RESOLUTIONS.find(
                (p) => `${p.nx}×${p.ny}` === e.target.value
              );
              if (preset) {
                props.onResolution({ nx: preset.nx, ny: preset.ny });
              }
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
          <div className="control-hint">
            {props.resolution.nx}×{props.resolution.ny} ={" "}
            {props.resolution.nx * props.resolution.ny}
          </div>
        </div>
      )}

      {hasDataset && (
        <div className="control-group">
          <label className="control-label">Permalink</label>
          <button
            className="control-button"
            onClick={props.onGeneratePermalink}
            title="Link zur aktuellen Ansicht kopieren"
          >
            📋 Link kopieren
          </button>
          {props.permalinkCopied && (
            <div className="control-hint" style={{ color: "#4caf50" }}>
              ✓ Link kopiert!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React from "react";
import type { DatasetInfo } from "../api/contract";

type Props = {
  loading: boolean;

  datasets: DatasetInfo[];
  datasetId: string | null;
  onDatasetId: (id: string) => void;
};

export function Controls(props: Props) {
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

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Dataset</div>
        <select
          value={props.datasetId ?? ""}
          onChange={(e) => props.onDatasetId(e.target.value)}
          style={{ width: "100%" }}
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
    </div>
  );
}

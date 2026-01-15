import React from "react";

type Props = {
  backendUp: boolean | null;
  lastCheck: Date | null;
};

export function Footer({ backendUp, lastCheck }: Props) {
  const statusClass =
    backendUp === null ? "checking" : backendUp ? "up" : "down";
  const statusText =
    backendUp === null ? "CHECKING…" : backendUp ? "UP" : "DOWN";

  return (
    <footer className="app-footer">
      <div className="footer-attribution">
        <span>
          ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenStreetMap
          </a>{" "}
          contributors
        </span>
        <span>|</span>
        <span>
          Map:{" "}
          <a
            href="https://maplibre.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            MapLibre GL
          </a>
        </span>
      </div>

      <div className={`footer-status ${statusClass}`}>
        <span>Backend: {statusText}</span>
        {lastCheck && (
          <span className="footer-status-time">
            {lastCheck.toLocaleTimeString()}
          </span>
        )}
      </div>
    </footer>
  );
}

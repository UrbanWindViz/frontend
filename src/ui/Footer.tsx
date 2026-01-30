export type DataSourceInfo = {
  datasetNames?: string[];
};

type Props = {
  backendUp: boolean | null;
  lastCheck: Date | null;
  dataSource?: DataSourceInfo;
  meteoError?: Error | null;
};

export function Footer({
  backendUp,
  lastCheck,
  dataSource,
  meteoError,
}: Props) {
  const statusClass =
    backendUp === null ? "checking" : backendUp ? "up" : "down";
  const statusText =
    backendUp === null ? "CHECKING…" : backendUp ? "UP" : "DOWN";

  const dataSourceLabel = () => {
    if (!dataSource) return null;
    else
      return (
        <span className="data-source backend">
          Wind: Backend
          {dataSource.datasetNames && dataSource.datasetNames.length > 0 && (
            <span className="dataset-names">
              {" "}
              ({dataSource.datasetNames.join(", ")})
            </span>
          )}
        </span>
      );
  };

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
        {dataSource && (
          <>
            <span>|</span>
            {dataSourceLabel()}
          </>
        )}
        {meteoError && (
          <>
            <span>|</span>
            <span className="meteo-warning" title={meteoError.message}>
              Meteo: stale data
            </span>
          </>
        )}
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

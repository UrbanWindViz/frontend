import { useCallback, useEffect, useMemo, useState } from "react";
import { Controls } from "./ui/Controls";
import { MapView } from "./map/MapView";
import { Footer, type DataSourceInfo } from "./ui/Footer";
import { checkHealth } from "./api/health";
import type {
  WindQuery_Controls,
  WindQuery_Map,
  WindQuery,
} from "./api/contract";
import { useAvailableHeights, useWindField } from "./hooks";
import "./index.css";
import { buildPermalink } from "./util/urlStats";

const MIN_ZOOM_FOR_BACKEND = 13;

const HEALTH_INTERVAL_MS = 10_000;

export function App() {
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const { heights, datasets } = useAvailableHeights();

  const [mapQuery, setMapQuery] = useState<WindQuery_Map | null>(null);

  const handleMapQuery = useCallback((query: WindQuery_Map | null) => {
    setMapQuery(query);
  }, []);

  const [mapCenter, setMapCenter] = useState<
    { lon: number; lat: number } | undefined
  >();
  const [mapZoom, setMapZoom] = useState<number | undefined>();

  const isZoomedOut = mapZoom !== undefined && mapZoom < MIN_ZOOM_FOR_BACKEND;

  const [permalinkCopied, setPermalinkCopied] = useState(false);

  const [queryControls, setQueryControls] = useState<WindQuery_Controls | null>(
    null,
  );

  const [weatherError, setWeatherError] = useState<Error | null>(null);

  const handleQueryControls = useCallback(
    (controls: WindQuery_Controls | null) => {
      setQueryControls(controls);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    let ac: AbortController | null = null;

    const runCheck = async () => {
      ac?.abort();
      ac = new AbortController();

      try {
        const ok = await checkHealth(ac.signal);
        if (!cancelled) {
          setBackendUp(ok);
          setLastCheck(new Date());
        }
      } catch {
        if (!cancelled) {
          setBackendUp(false);
          setLastCheck(new Date());
        }
      }
    };

    runCheck();
    const id = setInterval(runCheck, HEALTH_INTERVAL_MS);

    return () => {
      cancelled = true;
      ac?.abort();
      clearInterval(id);
    };
  }, []);

  const query = useMemo<WindQuery | null>(() => {
    if (!mapQuery || !queryControls) return null;

    return {
      ...queryControls,
      ...mapQuery,
    };
  }, [mapQuery, queryControls]);

  const {
    windField: backendWindField,
    loading,
    queryInProgress,
  } = useWindField(query);

  const windField = isZoomedOut ? null : backendWindField;
  const isLoading = loading;

  const dataSource = useMemo<DataSourceInfo>(() => {
    return {
      type: "backend",
      datasetNames: datasets.map((d) => d.name),
    };
  }, [datasets]);

  const onMapMove = useCallback(
    (center: { lon: number; lat: number }, zoom: number) => {
      setMapCenter(center);
      setMapZoom(zoom);
    },
    [],
  );

  const handleGeneratePermalink = useCallback(() => {
    const link = buildPermalink({
      heightMeters: queryControls?.heightMeters ?? null,
      resolution: mapQuery?.resolution ?? { nx: 100, ny: 100 },
      visualizationType: "arrows",
      mapCenter,
      mapZoom,
    });

    navigator.clipboard.writeText(link).then(() => {
      setPermalinkCopied(true);
      setTimeout(() => setPermalinkCopied(false), 3000);
    });
  }, [queryControls, mapQuery, mapCenter, mapZoom]);

  return (
    <div className="app-container">
      <div className="app-main">
        <MapView
          windField={windField}
          onMapQuery={handleMapQuery}
          onMapMove={onMapMove}
        />

        <Controls
          loading={isLoading}
          onGeneratePermalink={handleGeneratePermalink}
          permalinkCopied={permalinkCopied}
          mapCenter={mapCenter}
          queryInProgress={queryInProgress}
          onQueryControls={handleQueryControls}
          heights={heights}
          onWeatherError={setWeatherError}
        />
      </div>

      <Footer
        backendUp={backendUp}
        lastCheck={lastCheck}
        dataSource={dataSource}
        meteoError={weatherError}
      />
    </div>
  );
}

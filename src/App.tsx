import { useCallback, useEffect, useMemo, useState } from "react";
import { Controls } from "./ui/Controls";
import { MapView } from "./map/MapView";
import { Footer } from "./ui/Footer";
import { checkHealth } from "./api/health";
import type {
  WindFieldGrid,
  WindQuery_Controls,
  WindQuery_Map,
  WindQuery,
} from "./api/contract";
import { fetchDatasets } from "./api/datasets";
import { fetchWindFieldHttp } from "./api/wind";
import "./index.css";
import { useUrlState, buildPermalink } from "./util/urlStats";

const HEALTH_INTERVAL_MS = 10_000;

export function App() {
  const urlState = useUrlState();

  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const [loading, setLoading] = useState(false);
  const [queryInProgress, setQueryInProgress] = useState(false);

  const [mapQuery, setMapQuery] = useState<WindQuery_Map | null>(null);

  const [heights, setHeights] = useState<number[]>([]);

  const [mapCenter, setMapCenter] = useState<
    { lon: number; lat: number } | undefined
  >();
  const [mapZoom, setMapZoom] = useState<number | undefined>();

  const [permalinkCopied, setPermalinkCopied] = useState(false);

  const [windField, setWindField] = useState<WindFieldGrid | null>(null);

  const [queryControls, setQueryControls] = useState<WindQuery_Controls | null>(
    null,
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

  useEffect(() => {
    const ac = new AbortController();

    fetchDatasets(ac.signal)
      .then((ds) => {
        const allHeights = ds.map((c) => c.availableHeightsMeters).flat();
        setHeights(allHeights);
      })
      .catch((e) => {
        if (e?.name !== "AbortError") console.error(e);
      });

    return () => ac.abort();
  }, []);

  const query = useMemo<WindQuery | null>(() => {
    if (!mapQuery || !queryControls) return null;

    return {
      ...queryControls,
      ...mapQuery,
    };
  }, [mapQuery, queryControls]);

  useEffect(() => {
    if (!query) return;

    const ac = new AbortController();
    setLoading(true);
    setQueryInProgress(true);

    fetchWindFieldHttp(query, ac.signal)
      .then(setWindField)
      .catch((err) => {
        if (err?.name !== "AbortError") console.error(err);
      })
      .finally(() => {
        setLoading(false);
        setQueryInProgress(false);
      });

    return () => ac.abort();
  }, [query]);

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
          onMapQuery={setMapQuery}
          onMapMove={onMapMove}
        />

        <Controls
          loading={loading}
          heights={heights}
          onGeneratePermalink={handleGeneratePermalink}
          permalinkCopied={permalinkCopied}
          mapCenter={mapCenter}
          queryInProgress={queryInProgress}
          onQueryControls={setQueryControls}
        />
      </div>

      <Footer backendUp={backendUp} lastCheck={lastCheck} />
    </div>
  );
}

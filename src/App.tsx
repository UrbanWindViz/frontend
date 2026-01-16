import { useCallback, useEffect, useMemo, useState } from "react";
import { Controls } from "./ui/Controls";
import { MapView } from "./map/MapView";
import { Footer } from "./ui/Footer";
import { checkHealth } from "./api/health";
import type { BBox, DatasetInfo, WindFieldGrid } from "./api/contract";
import { fetchDatasets } from "./api/datasets";
import { fetchWindFieldHttp } from "./api/wind";
import "./index.css";
import type { VisualizationType } from "./map/config";
import { useUrlState, buildPermalink } from "./util/urlStats";

const HEALTH_INTERVAL_MS = 10_000;

export function App() {
  const urlState = useUrlState();

  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const [loading, setLoading] = useState(false);

  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [datasetId, setDatasetId] = useState<string | null>(null);

  const [datasetExtend, setDatasetExtend] = useState<BBox | null>(null);
  const [bbox, setBbox] = useState<BBox | null>(null);

  const [heights, setHeights] = useState<number[]>([]);
  const [heightMeters, setHeightMeters] = useState<number | null>(null);

  const [resolution, setResolution] = useState({ nx: 100, ny: 100 });
  const [visualizationType, setVisualizationType] =
    useState<VisualizationType>("arrows");

  const [mapCenter, setMapCenter] = useState<
    { lon: number; lat: number } | undefined
  >();
  const [mapZoom, setMapZoom] = useState<number | undefined>();

  const [permalinkCopied, setPermalinkCopied] = useState(false);

  const [windField, setWindField] = useState<WindFieldGrid | null>(null);

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
        setDatasets(ds);

        if (urlState.datasetId) {
          const ds_from_url = ds.find((d) => d.id === urlState.datasetId);
          if (ds_from_url) {
            selectDataset(ds_from_url);
          } else if (ds.length === 1) {
            selectDataset(ds[0]);
          }
        } else if (ds.length === 1) {
          selectDataset(ds[0]);
        }
      })
      .catch((e) => {
        if (e?.name !== "AbortError") console.error(e);
      });

    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (urlState.heightMeters !== undefined) {
      setHeightMeters(urlState.heightMeters);
    }
    if (urlState.nx && urlState.ny) {
      setResolution({ nx: urlState.nx, ny: urlState.ny });
    }
    if (urlState.visualizationType) {
      setVisualizationType(urlState.visualizationType);
    }
  }, [urlState]);

  const selectDataset = useCallback(
    (ds: DatasetInfo) => {
      setDatasetId(ds.id);
      setDatasetExtend(ds.datasetExtent);

      setHeights(ds.availableHeightsMeters ?? []);

      const defaultHeight =
        urlState.heightMeters ?? ds.availableHeightsMeters?.[0] ?? null;
      setHeightMeters(defaultHeight);

      setWindField(null);
    },
    [urlState.heightMeters]
  );

  const selectedDataset = useMemo(
    () => (datasetId ? datasets.find((d) => d.id === datasetId) ?? null : null),
    [datasets, datasetId]
  );

  const canQuery = useMemo(() => {
    return (
      !!bbox && !!selectedDataset && heightMeters !== null && heights.length > 0
    );
  }, [bbox, selectedDataset, heightMeters, heights.length]);

  const query = useMemo(() => {
    if (!canQuery) return null;

    return {
      datasetId: selectedDataset!.id,
      heightMeters: heightMeters!,
      bbox: bbox!,
      resolution,
    };
  }, [canQuery, selectedDataset, heightMeters, bbox, resolution]);

  useEffect(() => {
    if (!query) return;

    const ac = new AbortController();
    setLoading(true);

    fetchWindFieldHttp(query, ac.signal)
      .then(setWindField)
      .catch((err) => {
        if (err?.name !== "AbortError") console.error(err);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [query]);

  const onViewportBbox = useCallback(
    (b: BBox) => {
      if (!selectedDataset) return;
      setBbox(b);
    },
    [selectedDataset]
  );

  const onMapMove = useCallback(
    (center: { lon: number; lat: number }, zoom: number) => {
      setMapCenter(center);
      setMapZoom(zoom);
    },
    []
  );

  const handleGeneratePermalink = useCallback(() => {
    const link = buildPermalink({
      datasetId,
      heightMeters,
      resolution,
      visualizationType,
      mapCenter,
      mapZoom,
    });

    navigator.clipboard.writeText(link).then(() => {
      setPermalinkCopied(true);
      setTimeout(() => setPermalinkCopied(false), 3000);
    });
  }, [
    datasetId,
    heightMeters,
    resolution,
    visualizationType,
    mapCenter,
    mapZoom,
  ]);

  return (
    <div className="app-container">
      <div className="app-main">
        <MapView
          datasetExtend={datasetExtend}
          windField={windField}
          visualizationType={visualizationType}
          initialCenter={
            urlState.lon && urlState.lat
              ? { lon: urlState.lon, lat: urlState.lat }
              : undefined
          }
          initialZoom={urlState.zoom}
          onViewportBbox={onViewportBbox}
          onMapMove={onMapMove}
        />

        <Controls
          loading={loading}
          datasets={datasets}
          datasetId={datasetId}
          onDatasetId={(id) => {
            const ds = datasets.find((d) => d.id === id);
            if (ds) selectDataset(ds);
          }}
          heights={heights}
          heightMeters={heightMeters}
          onHeightMeters={setHeightMeters}
          resolution={resolution}
          onResolution={setResolution}
          visualizationType={visualizationType}
          onVisualizationType={setVisualizationType}
          onGeneratePermalink={handleGeneratePermalink}
          permalinkCopied={permalinkCopied}
        />
      </div>

      <Footer backendUp={backendUp} lastCheck={lastCheck} />
    </div>
  );
}

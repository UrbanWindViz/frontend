import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Controls } from "./ui/Controls";
import { MapView } from "./map/MapView";
import { Footer } from "./ui/Footer";
import { TimeControl } from "./ui/Time";
import { checkHealth } from "./api/health";
import type { BBox, DatasetInfo, WindFieldGrid } from "./api/contract";
import { fetchDatasets } from "./api/datasets";
import { fetchWindFieldHttp } from "./api/wind";
import "./index.css";
import type { VisualizationType } from "./map/config";
import { useUrlState, buildPermalink } from "./util/urlStats";
import { useAnimation } from "./util/animation";
import {
  fetchWeatherTimesteps,
  interpolateTimesteps,
  getDefaultDate,
  type WeatherTimestep,
} from "./api/weather";

const HEALTH_INTERVAL_MS = 10_000;

export function App() {
  const urlState = useUrlState();

  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const [loading, setLoading] = useState(false);
  const [queryInProgress, setQueryInProgress] = useState(false);

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

  const [hourlyWeatherData, setHourlyWeatherData] = useState<WeatherTimestep[]>(
    []
  );
  const [timestepInterval, setTimestepInterval] = useState(60);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentDate, setCurrentDate] = useState(getDefaultDate());
  const [timeControlMinimized, setTimeControlMinimized] = useState(false);

  const weatherTimesteps = useMemo(() => {
    return interpolateTimesteps(hourlyWeatherData, timestepInterval);
  }, [hourlyWeatherData, timestepInterval]);

  const { currentIndex, setCurrentIndex } = useAnimation(
    weatherTimesteps.length,
    playbackSpeed,
    playing && !queryInProgress
  );

  useEffect(() => {
    setCurrentIndex(0);
  }, [timestepInterval, setCurrentIndex]);

  const currentWeather = weatherTimesteps[currentIndex];

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

        if (heightMeters === null && allHeights.length > 0) {
          setHeightMeters(allHeights[0]);
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

  useEffect(() => {
    if (!mapCenter) {
      setHourlyWeatherData([]);
      return;
    }

    setWeatherLoading(true);
    setPlaying(false);

    fetchWeatherTimesteps(mapCenter.lat, mapCenter.lon, currentDate)
      .then((timesteps) => {
        setHourlyWeatherData(timesteps);
        setCurrentIndex(0);
      })
      .catch((err) => {
        console.error("Failed to load weather data:", err);
        setHourlyWeatherData([]);
      })
      .finally(() => {
        setWeatherLoading(false);
      });
  }, [mapCenter, currentDate]);

  const selectDataset = useCallback(
    (ds: DatasetInfo) => {
      setHeights(ds.availableHeightsMeters ?? []);

      const defaultHeight =
        urlState.heightMeters ?? ds.availableHeightsMeters?.[0] ?? null;
      setHeightMeters(defaultHeight);

      setWindField(null);
    },
    [urlState.heightMeters]
  );

  const canQuery = useMemo(() => {
    return (
      !!bbox && heightMeters !== null && heights.length > 0 && !!currentWeather
    );
  }, [bbox, heightMeters, heights.length, currentWeather]);

  const query = useMemo(() => {
    if (!canQuery) return null;

    return {
      heightMeters: heightMeters!,
      bbox: bbox!,
      resolution,
      wsRef: currentWeather.wsRef,
      wdRef: currentWeather.wdRef,
    };
  }, [canQuery, heightMeters, bbox, resolution, currentWeather]);

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
    []
  );

  const handleGeneratePermalink = useCallback(() => {
    const link = buildPermalink({
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
  }, [heightMeters, resolution, visualizationType, mapCenter, mapZoom]);

  return (
    <div className="app-container">
      <div className="app-main">
        <MapView
          windField={windField}
          visualizationType={visualizationType}
          initialCenter={
            urlState.lon && urlState.lat
              ? { lon: urlState.lon, lat: urlState.lat }
              : undefined
          }
          initialZoom={urlState.zoom}
          onViewportBbox={setBbox}
          onMapMove={onMapMove}
        />

        <Controls
          loading={loading || weatherLoading}
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

        <TimeControl
          timesteps={weatherTimesteps}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          playing={playing}
          onPlayPause={() => setPlaying(!playing)}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
          loading={weatherLoading}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          isMinimized={timeControlMinimized}
          onToggleMinimize={() =>
            setTimeControlMinimized(!timeControlMinimized)
          }
          timestepInterval={timestepInterval}
          onTimestepIntervalChange={setTimestepInterval}
        />
      </div>

      <Footer backendUp={backendUp} lastCheck={lastCheck} />
    </div>
  );
}

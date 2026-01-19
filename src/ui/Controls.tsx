import { useState, useEffect, useMemo } from "react";
import { VISUALIZATION_OPTIONS, type VisualizationType } from "../map/config";
import { TimeControl } from "./Time";
import {
  fetchWeatherTimesteps,
  interpolateTimesteps,
  getDefaultDate,
  type WeatherTimestep,
} from "../api/weather";
import { useAnimation } from "../util/animation";
import type { WindQuery_Controls } from "../api/contract";

type Props = {
  loading: boolean;
  heights: number[];
  visualizationType: VisualizationType;
  onVisualizationType: (type: VisualizationType) => void;
  onGeneratePermalink: () => void;
  permalinkCopied: boolean;
  mapCenter?: { lon: number; lat: number };
  queryInProgress: boolean;
  onQueryControls: (controls: WindQuery_Controls | null) => void;
  initialHeightMeters?: number;
  initialResolution?: { nx: number; ny: number };
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
  const [timeControlMinimized, setTimeControlMinimized] = useState(false);

  const [heightMeters, setHeightMeters] = useState<number | null>(
    props.initialHeightMeters ?? null,
  );
  const [resolution, setResolution] = useState(
    props.initialResolution ?? { nx: 100, ny: 100 },
  );

  const [hourlyWeatherData, setHourlyWeatherData] = useState<WeatherTimestep[]>(
    [],
  );
  const [timestepInterval, setTimestepInterval] = useState(60);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentDate, setCurrentDate] = useState(getDefaultDate());

  const weatherTimesteps = useMemo(() => {
    return interpolateTimesteps(hourlyWeatherData, timestepInterval);
  }, [hourlyWeatherData, timestepInterval]);

  const { currentIndex, setCurrentIndex } = useAnimation(
    weatherTimesteps.length,
    playbackSpeed,
    playing && !props.queryInProgress,
  );

  useEffect(() => {
    setCurrentIndex(0);
  }, [timestepInterval, setCurrentIndex]);

  const currentWeather = weatherTimesteps[currentIndex];

  useEffect(() => {
    if (heightMeters === null && props.heights.length > 0) {
      setHeightMeters(props.heights[0]);
    }
  }, [props.heights, heightMeters]);

  useEffect(() => {
    if (heightMeters === null || !currentWeather) {
      props.onQueryControls(null);
      return;
    }

    const queryControls: WindQuery_Controls = {
      heightMeters,
      resolution,
      wsRef: currentWeather.wsRef,
      wdRef: currentWeather.wdRef,
    };

    props.onQueryControls(queryControls);
  }, [heightMeters, resolution, currentWeather]);

  useEffect(() => {
    if (!props.mapCenter) {
      setHourlyWeatherData([]);
      return;
    }

    setWeatherLoading(true);
    setPlaying(false);

    fetchWeatherTimesteps(props.mapCenter.lat, props.mapCenter.lon, currentDate)
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
  }, [props.mapCenter, currentDate, setCurrentIndex]);

  const currentResKey = `${resolution.nx}×${resolution.ny}`;

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
    <>
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
          <label className="control-label">Höhe</label>
          <select
            className="control-select"
            value={heightMeters ?? ""}
            onChange={(e) => setHeightMeters(Number(e.target.value))}
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

        <div className="control-group">
          <label className="control-label">Auflösung</label>
          <select
            className="control-select"
            value={currentResKey}
            onChange={(e) => {
              const preset = PRESET_RESOLUTIONS.find(
                (p) => `${p.nx}×${p.ny}` === e.target.value,
              );
              if (preset) {
                setResolution({ nx: preset.nx, ny: preset.ny });
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
            {resolution.nx}×{resolution.ny} = {resolution.nx * resolution.ny}
          </div>
        </div>

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
      </div>

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
        onToggleMinimize={() => setTimeControlMinimized(!timeControlMinimized)}
        timestepInterval={timestepInterval}
        onTimestepIntervalChange={setTimestepInterval}
      />
    </>
  );
}

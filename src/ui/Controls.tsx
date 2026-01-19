import { useState, useEffect, useMemo } from "react";
import { TimeControl } from "./Time";
import {
  fetchWeatherTimesteps,
  interpolateTimesteps,
  getDefaultDate,
  type WeatherTimestep,
} from "../api/weather";
import { useAnimation } from "../util/animation";
import { useUrlState } from "../util/urlStats";
import type { WindQuery_Controls } from "../api/contract";

type Props = {
  loading: boolean;
  heights: number[];
  onGeneratePermalink: () => void;
  permalinkCopied: boolean;
  mapCenter?: { lon: number; lat: number };
  queryInProgress: boolean;
  onQueryControls: (controls: WindQuery_Controls | null) => void;
};

export function Controls(props: Props) {
  const urlState = useUrlState();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [timeControlMinimized, setTimeControlMinimized] = useState(false);

  const [heightMeters, setHeightMeters] = useState<number | null>(
    urlState.heightMeters ?? null,
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
      wsRef: currentWeather.wsRef,
      wdRef: currentWeather.wdRef,
    };

    props.onQueryControls(queryControls);
  }, [heightMeters, currentWeather]);

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

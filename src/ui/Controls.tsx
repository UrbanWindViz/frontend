import { useState, useEffect } from "react";
import { TimeControl } from "./Time";
import { getDefaultDate } from "../api/weather";
import { useAnimation } from "../util/animation";
import { useUrlState } from "../util/urlStats";
import { useWeatherData, useAvailableHeights } from "../hooks";
import type { WindQuery_Controls } from "../api/contract";

type Props = {
  loading: boolean;
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

  const { heights } = useAvailableHeights();

  const [heightMeters, setHeightMeters] = useState<number | null>(
    urlState.heightMeters ?? null,
  );

  const [timestepInterval, setTimestepInterval] = useState(60);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentDate, setCurrentDate] = useState(getDefaultDate());

  const { timesteps: weatherTimesteps, loading: weatherLoading } =
    useWeatherData(
      {
        lat: props.mapCenter?.lat,
        lon: props.mapCenter?.lon,
        date: currentDate,
        timestepInterval,
      },
      0,
    );

  const { currentIndex, setCurrentIndex } = useAnimation(
    weatherTimesteps.length,
    playbackSpeed,
    playing && !props.queryInProgress,
  );

  const currentWeatherAtIndex = weatherTimesteps[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
  }, [timestepInterval, setCurrentIndex]);

  useEffect(() => {
    if (heightMeters === null && heights.length > 0) {
      setHeightMeters(heights[0]);
    }
  }, [heights, heightMeters]);

  useEffect(() => {
    if (heightMeters === null || !currentWeatherAtIndex) {
      props.onQueryControls(null);
      return;
    }

    const queryControls: WindQuery_Controls = {
      heightMeters,
      wsRef: currentWeatherAtIndex.wsRef,
      wdRef: currentWeatherAtIndex.wdRef,
    };

    props.onQueryControls(queryControls);
  }, [heightMeters, currentWeatherAtIndex, props]);

  useEffect(() => {
    if (props.mapCenter) {
      setPlaying(false);
    }
  }, [props.mapCenter]);

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
            disabled={heights.length === 0}
          >
            {heights.length === 0 ? (
              <option value="">(keine Höhen verfügbar)</option>
            ) : (
              heights.map((h) => (
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

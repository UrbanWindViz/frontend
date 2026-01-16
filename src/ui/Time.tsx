import React from "react";
import type { WeatherTimestep } from "../api/weather";

type Props = {
  timesteps: WeatherTimestep[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  playing: boolean;
  onPlayPause: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  loading: boolean;
  currentDate: string;
  onDateChange: (date: string) => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  timestepInterval: number;
  onTimestepIntervalChange: (minutes: number) => void;
};

export function TimeControl(props: Props) {
  const {
    timesteps,
    currentIndex,
    onIndexChange,
    playing,
    onPlayPause,
    playbackSpeed,
    onSpeedChange,
    loading,
    currentDate,
    onDateChange,
    isMinimized,
    onToggleMinimize,
    timestepInterval,
    onTimestepIntervalChange,
  } = props;

  if (timesteps.length === 0) return null;

  const current = timesteps[Math.min(currentIndex, timesteps.length - 1)];

  if (isMinimized) {
    return (
      <div className="time-control-minimized" onClick={onToggleMinimize}>
        <span className="time-control-minimized-label">
          🕐 {current.label} • {current.wsRef.toFixed(1)} m/s @{" "}
          {current.wdRef.toFixed(0)}°
        </span>
        <span className="time-control-minimized-hint">Klicken zum Öffnen</span>
      </div>
    );
  }

  return (
    <div className="time-control">
      <div className="time-control-header">
        <div className="time-info">
          <div className="time-label">{current.label}</div>
          <div className="time-meta">
            {current.wsRef.toFixed(1)} m/s @ {current.wdRef.toFixed(0)}°
          </div>
        </div>
        <div className="time-control-actions">
          <button
            className="play-pause-btn"
            onClick={onPlayPause}
            disabled={loading}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button
            className="minimize-btn"
            onClick={onToggleMinimize}
            title="Minimieren"
          >
            ▼
          </button>
        </div>
      </div>

      <input
        type="range"
        className="time-slider"
        min={0}
        max={timesteps.length - 1}
        value={currentIndex}
        onChange={(e) => onIndexChange(Number(e.target.value))}
        disabled={playing || loading}
      />

      <div className="time-control-footer">
        <div className="time-date-picker">
          <label htmlFor="date-picker" className="date-label">
            Datum:
          </label>
          <input
            type="date"
            id="date-picker"
            className="date-input"
            value={currentDate}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={loading}
            min={getTodayDate()}
            max={getMaxDate()}
          />
        </div>

        <div className="time-interval-picker">
          <label htmlFor="interval-picker" className="interval-label">
            Schritte:
          </label>
          <select
            id="interval-picker"
            className="interval-select"
            value={timestepInterval}
            onChange={(e) => onTimestepIntervalChange(Number(e.target.value))}
            disabled={loading}
          >
            <option value={60}>1h</option>
            <option value={30}>30min</option>
            <option value={15}>15min</option>
          </select>
        </div>

        <div className="time-controls-right">
          <span className="time-range">
            {timesteps[0].label} - {timesteps[timesteps.length - 1].label}
          </span>
          <select
            className="speed-select"
            value={playbackSpeed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            disabled={loading}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function getMaxDate(): string {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  return maxDate.toISOString().split("T")[0];
}

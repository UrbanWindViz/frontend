import { useState, useEffect, useMemo } from "react";
import { fetchWeatherTimesteps, interpolateTimesteps } from "../api/weather";
import type { WeatherTimestep } from "../api/contract";

type UseWeatherDataParams = {
  lat?: number;
  lon?: number;
  date: string;
  timestepInterval: number;
};

type UseWeatherDataReturn = {
  hourlyData: WeatherTimestep[];
  timesteps: WeatherTimestep[];
  loading: boolean;
  error: Error | null;
  currentWeather: WeatherTimestep | undefined;
};

export function useWeatherData(
  params: UseWeatherDataParams,
  currentIndex: number,
): UseWeatherDataReturn {
  const { lat, lon, date, timestepInterval } = params;

  const [hourlyData, setHourlyData] = useState<WeatherTimestep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const timesteps = useMemo(() => {
    return interpolateTimesteps(hourlyData, timestepInterval);
  }, [hourlyData, timestepInterval]);

  useEffect(() => {
    if (lat === undefined || lon === undefined) return;

    setLoading(true);

    fetchWeatherTimesteps(lat, lon, date)
      .then((data) => {
        setHourlyData(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load weather data:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load weather data"),
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lat, lon, date]);

  const currentWeather = timesteps[currentIndex];

  return {
    hourlyData,
    timesteps,
    loading,
    error,
    currentWeather,
  };
}

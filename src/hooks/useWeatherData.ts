import { useState, useEffect, useMemo } from "react";
import {
  fetchWeatherTimesteps,
  interpolateTimesteps,
  type WeatherTimestep,
} from "../api/weather";

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
  currentWeather: WeatherTimestep | undefined;
};

export function useWeatherData(
  params: UseWeatherDataParams,
  currentIndex: number,
): UseWeatherDataReturn {
  const { lat, lon, date, timestepInterval } = params;

  const [hourlyData, setHourlyData] = useState<WeatherTimestep[]>([]);
  const [loading, setLoading] = useState(false);

  const timesteps = useMemo(() => {
    return interpolateTimesteps(hourlyData, timestepInterval);
  }, [hourlyData, timestepInterval]);

  useEffect(() => {
    if (lat === undefined || lon === undefined) {
      setHourlyData([]);
      return;
    }

    setLoading(true);

    fetchWeatherTimesteps(lat, lon, date)
      .then((data) => {
        setHourlyData(data);
      })
      .catch((err) => {
        console.error("Failed to load weather data:", err);
        setHourlyData([]);
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
    currentWeather,
  };
}

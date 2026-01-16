export type WeatherTimestep = {
  timestep: number;
  datetime: string;
  label: string;
  wsRef: number;
  wdRef: number;
};

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  elevation: number;
  hourly: {
    time: string[];
    wind_speed_120m: number[];
    wind_direction_120m: number[];
  };
};

export async function fetchWeatherTimesteps(
  lat: number,
  lon: number,
  startDate: string,
  endDate?: string
): Promise<WeatherTimestep[]> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(6),
    longitude: lon.toFixed(6),
    hourly: "wind_speed_120m,wind_direction_120m",
    models: "best_match",
    timezone: "GMT",
    start_date: startDate,
    end_date: endDate ?? startDate,
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data: OpenMeteoResponse = await response.json();

    if (!data.hourly || !data.hourly.time) {
      throw new Error("Invalid Open-Meteo response");
    }

    const timesteps: WeatherTimestep[] = data.hourly.time.map((timeStr, i) => {
      const datetime = new Date(timeStr);
      const hour = datetime.getUTCHours();
      const wsKmh = data.hourly.wind_speed_120m[i];
      const wdDeg = data.hourly.wind_direction_120m[i];

      return {
        timestep: i,
        datetime: timeStr,
        label: `${hour.toString().padStart(2, "0")}:00`,
        wsRef: wsKmh / 3.6,
        wdRef: wdDeg,
      };
    });

    return timesteps;
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    throw error;
  }
}

export function interpolateTimesteps(
  hourlyData: WeatherTimestep[],
  intervalMinutes: number
): WeatherTimestep[] {
  if (intervalMinutes === 60 || hourlyData.length === 0) {
    return hourlyData;
  }

  const result: WeatherTimestep[] = [];
  const stepsPerHour = 60 / intervalMinutes;

  for (let i = 0; i < hourlyData.length; i++) {
    const current = hourlyData[i];
    const next = hourlyData[i + 1];

    result.push(current);

    if (next) {
      for (let step = 1; step < stepsPerHour; step++) {
        const t = step / stepsPerHour;
        const currentTime = new Date(current.datetime);
        const minutes = step * intervalMinutes;
        currentTime.setUTCMinutes(minutes);

        const wsRef = current.wsRef + (next.wsRef - current.wsRef) * t;

        let wdDiff = next.wdRef - current.wdRef;
        if (wdDiff > 180) wdDiff -= 360;
        if (wdDiff < -180) wdDiff += 360;
        let wdRef = current.wdRef + wdDiff * t;
        if (wdRef < 0) wdRef += 360;
        if (wdRef >= 360) wdRef -= 360;

        const hour = currentTime.getUTCHours();
        const minute = currentTime.getUTCMinutes();

        result.push({
          timestep: result.length,
          datetime: currentTime.toISOString(),
          label: `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`,
          wsRef,
          wdRef,
        });
      }
    }
  }

  return result;
}

export function getDefaultDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

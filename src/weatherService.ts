import type { WeatherAPIResponse, HourlyForecast, DayGroup, DaySummary, WeatherCondition } from "./types";
import { LOCATION, FORECAST_DAYS, RAIN_INTENSITY } from "./constants";

const BASE_URL = "https://api.open-meteo.com/v1/ecmwf";

export async function fetchForecast(): Promise<WeatherAPIResponse> {
  const params = new URLSearchParams({
    latitude: LOCATION.latitude.toString(),
    longitude: LOCATION.longitude.toString(),
    hourly:
      "temperature_2m,precipitation,snowfall,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover",
    forecast_days: FORECAST_DAYS.toString(),
    wind_speed_unit: "kmh",
    timezone: "auto",
  });

  const response = await fetch(`${BASE_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch weather: ${response.statusText}`);
  }

  return response.json();
}

function getCondition(cloudCover: number, precipitation: number): WeatherCondition {
  if (precipitation >= RAIN_INTENSITY.heavy) return "heavyRain";
  if (precipitation >= RAIN_INTENSITY.moderate) return "rain";
  if (precipitation >= RAIN_INTENSITY.light) return "lightRain";
  if (cloudCover < 20) return "clear";
  if (cloudCover < 50) return "partlyCloudy";
  if (cloudCover < 80) return "cloudy";
  return "overcast";
}

function getDominantCondition(hours: HourlyForecast[]): WeatherCondition {
  const conditionCounts = new Map<WeatherCondition, number>();

  for (const hour of hours) {
    const condition = getCondition(hour.cloudCover, hour.precipitation);
    conditionCounts.set(condition, (conditionCounts.get(condition) || 0) + 1);
  }

  let dominant: WeatherCondition = "cloudy";
  let maxCount = 0;

  for (const [condition, count] of conditionCounts) {
    if (count > maxCount) {
      maxCount = count;
      dominant = condition;
    }
  }

  return dominant;
}

function calculateSummary(hours: HourlyForecast[]): DaySummary {
  const temps = hours.map(h => h.temperature);
  const clouds = hours.map(h => h.cloudCover);
  const precip = hours.map(h => h.precipitation);
  const snow = hours.map(h => h.snowfall);

  return {
    maxTemp: Math.max(...temps),
    minTemp: Math.min(...temps),
    avgCloudCover: Math.round(clouds.reduce((a, b) => a + b, 0) / clouds.length),
    totalPrecipitation: precip.reduce((a, b) => a + b, 0),
    totalSnowfall: snow.reduce((a, b) => a + b, 0),
    dominantCondition: getDominantCondition(hours),
  };
}

export function processResponse(response: WeatherAPIResponse): DayGroup[] {
  const forecasts: HourlyForecast[] = [];

  for (let i = 0; i < response.hourly.time.length; i++) {
    const date = new Date(response.hourly.time[i]);
    const hour = date.getHours();

    forecasts.push({
      id: `${response.hourly.time[i]}-${i}`,
      date,
      hour,
      temperature: response.hourly.temperature_2m[i],
      precipitation: response.hourly.precipitation[i],
      snowfall: response.hourly.snowfall[i],
      windSpeed: response.hourly.wind_speed_10m[i],
      windGusts: response.hourly.wind_gusts_10m[i],
      windDirection: response.hourly.wind_direction_10m[i],
      cloudCover: response.hourly.cloud_cover[i],
    });
  }

  // Group by day
  const grouped = new Map<string, HourlyForecast[]>();

  for (const forecast of forecasts) {
    const dayKey = forecast.date.toDateString();
    if (!grouped.has(dayKey)) {
      grouped.set(dayKey, []);
    }
    grouped.get(dayKey)!.push(forecast);
  }

  const dayGroups: DayGroup[] = [];
  const today = new Date();
  const todayStr = today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toDateString();

  for (const [dayKey, hours] of grouped) {
    const isToday = dayKey === todayStr;
    const isTomorrow = dayKey === tomorrowStr;
    const isDetailedView = isToday || isTomorrow;

    if (isDetailedView) {
      // Today: every 3 hours, Tomorrow: every 6 hours
      const filteredHours = hours
        .filter((h) => (isToday ? h.hour % 3 === 0 : h.hour % 6 === 0))
        .sort((a, b) => a.hour - b.hour);

      dayGroups.push({
        id: dayKey,
        date: new Date(dayKey),
        hours: filteredHours.length > 0 ? filteredHours : hours,
        isDetailedView: true,
      });
    } else {
      // Days 3-7: summary only
      dayGroups.push({
        id: dayKey,
        date: new Date(dayKey),
        hours: [], // no hourly data for summary view
        isDetailedView: false,
        summary: calculateSummary(hours),
      });
    }
  }

  return dayGroups.sort((a, b) => a.date.getTime() - b.date.getTime());
}

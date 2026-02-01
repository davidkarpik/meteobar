import type { WeatherAPIResponse, HourlyForecast, DayGroup, DaySummary, WeatherCondition } from "./types";
import { LOCATION, FORECAST_DAYS, RAIN_INTENSITY } from "./constants";

const BASE_URL = "https://api.open-meteo.com/v1/ecmwf";

export async function fetchForecast(): Promise<WeatherAPIResponse> {
  const params = new URLSearchParams({
    latitude: LOCATION.latitude.toString(),
    longitude: LOCATION.longitude.toString(),
    hourly:
      "temperature_2m,precipitation,snowfall,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,sunshine_duration",
    daily: "sunrise,sunset",
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

function calculateSummary(
  hours: HourlyForecast[],
  sunrise: Date,
  sunset: Date
): DaySummary {
  const temps = hours.map(h => h.temperature);
  const precip = hours.map(h => h.precipitation);
  const snow = hours.map(h => h.snowfall);
  const sunshine = hours.map(h => h.sunshineDuration);

  // Filter to daylight hours for cloud cover calculation
  const sunriseHour = sunrise.getHours();
  const sunsetHour = sunset.getHours();
  const daytimeHours = hours.filter(h => {
    const hour = h.date.getHours();
    return hour >= sunriseHour && hour < sunsetHour;
  });

  // Use daytime hours for cloud cover if available, otherwise fall back to all hours
  const cloudsSource = daytimeHours.length > 0 ? daytimeHours : hours;
  const clouds = cloudsSource.map(h => h.cloudCover);

  // Only sum sunshine during daylight hours and apply bias correction (models overestimate by ~20-30%)
  const daytimeSunshine = daytimeHours.map(h => h.sunshineDuration);
  const rawSunshineHours = daytimeSunshine.reduce((a, b) => a + b, 0) / 3600;
  const sunshineHours = rawSunshineHours * 0.75; // Bias correction factor
  const totalPrecipitation = precip.reduce((a, b) => a + b, 0);
  const totalSnowfall = snow.reduce((a, b) => a + b, 0);

  // Get base condition from hourly data
  let dominantCondition = getDominantCondition(hours);

  // Adjust condition based on actual sunshine hours
  // If there's significant sunshine, cap the cloud condition
  const hasPrecipitation = totalPrecipitation > 0.5 || totalSnowfall > 0.5;
  if (!hasPrecipitation) {
    if (sunshineHours >= 5) {
      // More than 5h sunshine = at most partly cloudy
      if (dominantCondition === "overcast" || dominantCondition === "cloudy") {
        dominantCondition = "partlyCloudy";
      }
    } else if (sunshineHours >= 2) {
      // 2-5h sunshine = at most cloudy
      if (dominantCondition === "overcast") {
        dominantCondition = "cloudy";
      }
    }
  }

  // Also adjust avgCloudCover to be more consistent with sunshine
  // Use sunshine percentage to inform cloud cover display
  const daylightHours = sunsetHour - sunriseHour;
  const sunshinePercent = daylightHours > 0 ? (sunshineHours / daylightHours) * 100 : 0;
  // Blend raw cloud average with sunshine-derived estimate
  const rawCloudAvg = clouds.reduce((a, b) => a + b, 0) / clouds.length;
  const sunshineBasedCloud = 100 - sunshinePercent;
  // Weight sunshine more heavily as it's the actual measurement
  const adjustedCloudCover = Math.round((rawCloudAvg * 0.3) + (sunshineBasedCloud * 0.7));

  return {
    maxTemp: Math.max(...temps),
    minTemp: Math.min(...temps),
    avgCloudCover: adjustedCloudCover,
    sunshineHours,
    totalPrecipitation,
    totalSnowfall,
    dominantCondition,
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
      sunshineDuration: response.hourly.sunshine_duration[i],
    });
  }

  // Build sunrise/sunset lookup by date string
  const sunTimes = new Map<string, { sunrise: Date; sunset: Date }>();
  for (let i = 0; i < response.daily.time.length; i++) {
    const dateKey = new Date(response.daily.time[i]).toDateString();
    sunTimes.set(dateKey, {
      sunrise: new Date(response.daily.sunrise[i]),
      sunset: new Date(response.daily.sunset[i]),
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
    // Show all 24 hours
    const filteredHours = hours.sort((a, b) => a.hour - b.hour);

    const times = sunTimes.get(dayKey);
    const sunrise = times?.sunrise ?? new Date(dayKey + " 06:00");
    const sunset = times?.sunset ?? new Date(dayKey + " 18:00");

    dayGroups.push({
      id: dayKey,
      date: new Date(dayKey),
      hours: filteredHours.length > 0 ? filteredHours : hours,
      summary: calculateSummary(hours, sunrise, sunset),
    });
  }

  return dayGroups.sort((a, b) => a.date.getTime() - b.date.getTime());
}

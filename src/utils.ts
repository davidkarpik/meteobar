import type { WeatherCondition, HourlyForecast } from "./types";
import { RAIN_INTENSITY } from "./constants";

export function getWeatherCondition(
  cloudCover: number,
  precipitation: number,
  sunshineDuration?: number
): WeatherCondition {
  if (precipitation >= RAIN_INTENSITY.heavy) return "heavyRain";
  if (precipitation >= RAIN_INTENSITY.moderate) return "rain";
  if (precipitation >= RAIN_INTENSITY.light) return "lightRain";

  // If we have sunshine data, use it to adjust the condition
  // sunshineDuration is in seconds per hour (max 3600)
  if (sunshineDuration !== undefined) {
    const sunshinePercent = (sunshineDuration / 3600) * 100;
    if (sunshinePercent >= 70) return "clear";
    if (sunshinePercent >= 40) return "partlyCloudy";
    if (sunshinePercent >= 15) return "cloudy";
    return "overcast";
  }

  // Fallback to cloud cover only
  if (cloudCover < 20) return "clear";
  if (cloudCover < 50) return "partlyCloudy";
  if (cloudCover < 80) return "cloudy";
  return "overcast";
}

export function getWeatherIcon(condition: WeatherCondition): string {
  const icons: Record<WeatherCondition, string> = {
    clear: "☀️",
    partlyCloudy: "🌤️",
    cloudy: "☁️",
    overcast: "☁️",
    lightRain: "🌦️",
    rain: "🌧️",
    heavyRain: "⛈️",
  };
  return icons[condition];
}

export function getWindDirectionArrow(degrees: number): string {
  const directions = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"];
  const index = Math.floor(((degrees + 22.5) % 360) / 45);
  return directions[index];
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDayName(date: Date): string {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
  });
}

export function getTemperatureColor(temp: number): string {
  if (temp < 0) return "text-cyan-400";
  if (temp < 10) return "text-blue-400";
  if (temp < 20) return "text-green-400";
  if (temp < 30) return "text-orange-400";
  return "text-red-500";
}

export function getWindColor(speed: number): string {
  if (speed < 20) return "text-white/50";
  if (speed < 40) return "text-green-400";
  if (speed < 60) return "text-orange-400";
  return "text-red-500";
}

export function getRainColor(precipitation: number): string {
  if (precipitation < RAIN_INTENSITY.light) return "bg-transparent";
  if (precipitation < RAIN_INTENSITY.moderate) return "bg-cyan-500/40";
  if (precipitation < RAIN_INTENSITY.heavy) return "bg-cyan-500/60";
  return "bg-cyan-500/80";
}

export function getCurrentForecast(
  forecasts: HourlyForecast[]
): HourlyForecast | undefined {
  const now = new Date();
  const currentHour = now.getHours();

  return forecasts.find((f) => {
    const isToday = f.date.toDateString() === now.toDateString();
    return isToday && f.hour >= currentHour;
  });
}

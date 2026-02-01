import type { HourlyForecast } from "../types";
import {
  getWeatherCondition,
  getWeatherIcon,
  getTemperatureColor,
  getWindColor,
  getRainColor,
} from "../utils";

interface NightColumnProps {
  hours: HourlyForecast[];
  label: string;
}

export function NightColumn({ hours, label }: NightColumnProps) {
  if (hours.length === 0) return null;

  // Aggregate data from all hours
  const temps = hours.map((h) => h.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;

  const totalPrecip = hours.reduce((sum, h) => sum + h.precipitation, 0);
  const totalSnow = hours.reduce((sum, h) => sum + h.snowfall, 0);
  const avgCloud = hours.reduce((sum, h) => sum + h.cloudCover, 0) / hours.length;
  const avgSunshine = hours.reduce((sum, h) => sum + h.sunshineDuration, 0) / hours.length;

  const maxWind = Math.max(...hours.map((h) => h.windSpeed));
  const maxGusts = Math.max(...hours.map((h) => h.windGusts));

  const condition = getWeatherCondition(avgCloud, totalPrecip, avgSunshine);
  const icon = getWeatherIcon(condition);
  const tempColor = getTemperatureColor(avgTemp);
  const windColor = getWindColor(maxWind);
  const gustColor = getWindColor(maxGusts);
  const rainBg = getRainColor(totalPrecip);

  // At sub-zero temps, treat all precipitation as snow
  const isFreezing = avgTemp < 1;
  const hasSnow = totalSnow >= 0.1 || (isFreezing && totalPrecip >= 0.1);
  const hasRain = totalPrecip >= 0.1 && !hasSnow;
  const snowAmount = totalSnow >= 0.1 ? totalSnow : totalPrecip;

  return (
    <div className="flex flex-col items-center w-11 min-w-11 text-xs bg-white/5 rounded-lg py-1">
      {/* Label */}
      <div className="h-6 flex items-center text-white/40 font-medium text-[10px]">
        {label}
      </div>

      {/* Weather icon */}
      <div className="h-6 flex items-center text-base">{icon}</div>

      {/* Temperature */}
      <div className={`h-6 flex items-center font-semibold ${tempColor}`}>
        {Math.round(avgTemp)}
      </div>

      {/* Precipitation/Snow */}
      <div
        className={`h-5 flex items-center justify-center w-9 rounded text-white text-[10px] ${hasSnow || hasRain ? rainBg : ""}`}
      >
        {hasSnow ? (
          <span className="flex items-center gap-0.5">
            <span className="text-[8px]">❄</span>
            {snowAmount.toFixed(1)}
          </span>
        ) : hasRain ? (
          <span className="flex items-center gap-0.5">
            <span className="text-[8px]">💧</span>
            {totalPrecip.toFixed(1)}
          </span>
        ) : null}
      </div>

      {/* Wind speed */}
      <div className={`h-6 flex items-center font-medium ${windColor}`}>
        {Math.round(maxWind)}
      </div>

      {/* Wind gusts */}
      <div className={`h-6 flex items-center font-medium ${gustColor}`}>
        {Math.round(maxGusts)}
      </div>
    </div>
  );
}

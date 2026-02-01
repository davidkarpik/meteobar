import type { HourlyForecast } from "../types";
import {
  getWeatherCondition,
  getWeatherIcon,
  getTemperatureColor,
  getWindColor,
  getRainColor,
} from "../utils";

interface HourColumnProps {
  forecast: HourlyForecast;
}

export function HourColumn({ forecast }: HourColumnProps) {
  const condition = getWeatherCondition(
    forecast.cloudCover,
    forecast.precipitation,
    forecast.sunshineDuration
  );
  const icon = getWeatherIcon(condition);
  const tempColor = getTemperatureColor(forecast.temperature);
  const windColor = getWindColor(forecast.windSpeed);
  const gustColor = getWindColor(forecast.windGusts);
  const rainBg = getRainColor(forecast.precipitation);
  // At sub-zero temps, treat all precipitation as snow
  const isFreezing = forecast.temperature < 1;
  const hasSnow = forecast.snowfall >= 0.1 || (isFreezing && forecast.precipitation >= 0.1);
  const hasRain = forecast.precipitation >= 0.1 && !hasSnow;

  return (
    <div className="flex flex-col items-center w-10 min-w-10 text-xs">
      {/* Hour */}
      <div className="h-6 flex items-center text-white/50 font-medium">
        {forecast.hour}
      </div>

      {/* Weather icon */}
      <div className="h-6 flex items-center text-base">{icon}</div>

      {/* Temperature */}
      <div className={`h-6 flex items-center font-semibold ${tempColor}`}>
        {Math.round(forecast.temperature)}
      </div>

      {/* Precipitation/Snow */}
      <div
        className={`h-5 flex items-center justify-center w-10 rounded text-white text-[10px] ${hasSnow || hasRain ? rainBg : ""}`}
      >
        {hasSnow ? (
          <span className="flex items-center gap-0.5">
            <span className="text-[8px]">❄</span>
            {/* Use snowfall if available, otherwise convert precipitation (mm ≈ cm for snow) */}
            {(forecast.snowfall >= 0.1 ? forecast.snowfall : forecast.precipitation).toFixed(1)}
          </span>
        ) : hasRain ? (
          <span className="flex items-center gap-0.5">
            <span className="text-[8px]">💧</span>
            {forecast.precipitation.toFixed(1)}
          </span>
        ) : null}
      </div>

      {/* Wind speed */}
      <div className={`h-6 flex items-center font-medium ${windColor}`}>
        {Math.round(forecast.windSpeed)}
      </div>

      {/* Wind gusts */}
      <div className={`h-6 flex items-center font-medium ${gustColor}`}>
        {Math.round(forecast.windGusts)}
      </div>
    </div>
  );
}

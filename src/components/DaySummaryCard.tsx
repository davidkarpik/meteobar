import type { DayGroup } from "../types";
import { formatDayName, getWeatherIcon, getTemperatureColor } from "../utils";

interface DaySummaryCardProps {
  dayGroup: DayGroup;
  isSelected: boolean;
  onSelect: () => void;
}

export function DaySummaryCard({ dayGroup, isSelected, onSelect }: DaySummaryCardProps) {
  const isToday = dayGroup.date.toDateString() === new Date().toDateString();
  const { maxTemp, minTemp, avgCloudCover, sunshineHours, totalPrecipitation, totalSnowfall, dominantCondition } = dayGroup.summary;
  const icon = getWeatherIcon(dominantCondition);
  const tempColor = getTemperatureColor(maxTemp);
  // At sub-zero temps, treat all precipitation as snow
  const isFreezing = maxTemp < 1;
  const hasSnow = totalSnowfall >= 0.1 || (isFreezing && totalPrecipitation >= 0.1);
  const hasRain = totalPrecipitation >= 0.1 && !hasSnow;
  const snowAmount = totalSnowfall >= 0.1 ? totalSnowfall : totalPrecipitation;

  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-center rounded-xl py-2 px-3 min-w-[80px] transition-all cursor-pointer ${
        isSelected
          ? "bg-white/20 ring-2 ring-white/40"
          : "bg-black/30 hover:bg-black/40"
      }`}
    >
      {/* Day header */}
      <div
        className={`text-xs font-semibold mb-1 ${
          isToday ? "text-cyan-400" : "text-white/70"
        }`}
      >
        {formatDayName(dayGroup.date)}
      </div>

      {/* Weather icon */}
      <span className="text-xl mb-1">{icon}</span>

      {/* Max/Min temp */}
      <div className="flex items-baseline gap-1">
        <span className={`text-sm font-semibold ${tempColor}`}>
          {Math.round(maxTemp)}°
        </span>
        <span className="text-xs text-white/40">
          {Math.round(minTemp)}°
        </span>
      </div>

      {/* Cloud cover */}
      <div className="flex items-center gap-1 mt-1 text-[10px] text-white/50">
        <span>☁️</span>
        <span>{avgCloudCover}%</span>
      </div>

      {/* Sunshine hours */}
      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-amber-400">
        <span>☀️</span>
        <span>{sunshineHours.toFixed(1)}h</span>
      </div>

      {/* Precipitation */}
      <div className="flex items-center gap-0.5 mt-0.5 text-[10px] text-cyan-400">
        {hasSnow ? (
          <>
            <span className="text-[8px]">❄</span>
            <span>{snowAmount.toFixed(1)}cm</span>
          </>
        ) : hasRain ? (
          <>
            <span className="text-[8px]">💧</span>
            <span>{totalPrecipitation.toFixed(1)}mm</span>
          </>
        ) : (
          <span className="text-white/30">0.0mm</span>
        )}
      </div>
    </button>
  );
}

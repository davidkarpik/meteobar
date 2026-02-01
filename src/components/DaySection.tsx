import type { DayGroup } from "../types";
import { HourColumn } from "./HourColumn";
import { formatDayName, getWeatherIcon, getTemperatureColor } from "../utils";

interface DaySectionProps {
  dayGroup: DayGroup;
}

export function DaySection({ dayGroup }: DaySectionProps) {
  const isToday = dayGroup.date.toDateString() === new Date().toDateString();

  // Summary view for days 3+
  if (!dayGroup.isDetailedView && dayGroup.summary) {
    const { maxTemp, minTemp, avgCloudCover, sunshineHours, totalPrecipitation, totalSnowfall, dominantCondition } = dayGroup.summary;
    const icon = getWeatherIcon(dominantCondition);
    const tempColor = getTemperatureColor(maxTemp);
    const hasSnow = totalSnowfall >= 0.1;
    const hasRain = totalPrecipitation >= 0.1 && !hasSnow;

    return (
      <div className="flex flex-col items-center">
        {/* Day header */}
        <div className="h-5 flex items-center justify-center font-semibold text-xs mb-1 text-white/70">
          {formatDayName(dayGroup.date)}
        </div>

        {/* Summary card */}
        <div className="flex flex-col items-center rounded-xl py-3 px-4 bg-black/30 min-w-16">
          <span className="text-2xl mb-1">{icon}</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-sm font-semibold ${tempColor}`}>
              {Math.round(maxTemp)}°
            </span>
            <span className="text-xs text-white/40">
              {Math.round(minTemp)}°
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-white/50">
            <span>☁️</span>
            <span>{avgCloudCover}%</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-400">
            <span>☀️</span>
            <span>{sunshineHours.toFixed(1)}h</span>
          </div>
          <div className="flex items-center gap-0.5 mt-0.5 text-xs text-cyan-400">
            {hasSnow ? (
              <>
                <span className="text-[10px]">❄</span>
                <span>{totalSnowfall.toFixed(1)}cm</span>
              </>
            ) : hasRain ? (
              <>
                <span className="text-[10px]">💧</span>
                <span>{totalPrecipitation.toFixed(1)}mm</span>
              </>
            ) : (
              <span className="text-white/30">0.0mm</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Detailed view for Today and Tomorrow
  return (
    <div className="flex flex-col">
      {/* Day header */}
      <div
        className={`h-5 flex items-center justify-center font-semibold text-xs mb-1 ${
          isToday ? "text-cyan-400" : "text-white/70"
        }`}
      >
        {formatDayName(dayGroup.date)}
      </div>

      {/* Hour columns in a card */}
      <div className="flex rounded-xl py-2 px-1 bg-black/30">
        {dayGroup.hours.map((hour) => (
          <HourColumn key={hour.id} forecast={hour} />
        ))}
      </div>
    </div>
  );
}

import type { DayGroup } from "../types";
import { HourColumn } from "./HourColumn";
import { NightColumn } from "./NightColumn";
import { formatDayName } from "../utils";

interface DayDetailViewProps {
  dayGroup: DayGroup;
}

export function DayDetailView({ dayGroup }: DayDetailViewProps) {
  const isToday = dayGroup.date.toDateString() === new Date().toDateString();

  // Group hours: morning night (0-5), day (6-21), evening night (22-23)
  const morningNight = dayGroup.hours.filter((h) => h.hour >= 0 && h.hour < 6);
  const dayHours = dayGroup.hours.filter((h) => h.hour >= 6 && h.hour < 22);
  const eveningNight = dayGroup.hours.filter((h) => h.hour >= 22);

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
      <div className="flex justify-center rounded-xl py-2 px-1 bg-black/30 gap-0.5">
        {/* Morning night summary */}
        {morningNight.length > 0 && (
          <NightColumn hours={morningNight} label="0-6" />
        )}

        {/* Individual day hours */}
        {dayHours.map((hour) => (
          <HourColumn key={hour.id} forecast={hour} />
        ))}

        {/* Evening night summary */}
        {eveningNight.length > 0 && (
          <NightColumn hours={eveningNight} label="22+" />
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import type { DayGroup, HourlyForecast } from "../types";
import { fetchForecast, processResponse } from "../weatherService";
import { LOCATION, REFRESH_INTERVAL_MS } from "../constants";
import { DaySection } from "./DaySection";
import {
  getWeatherCondition,
  getWeatherIcon,
  getCurrentForecast,
} from "../utils";
import { invoke } from "@tauri-apps/api/core";

export function ForecastStrip() {
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchForecast();
      const groups = processResponse(response);
      setDayGroups(groups);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
      console.error("Weather fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const allHours: HourlyForecast[] = dayGroups.flatMap((g) => g.hours);
  const currentForecast = getCurrentForecast(allHours);
  const currentTemp = currentForecast
    ? Math.round(currentForecast.temperature)
    : null;
  const currentIcon = currentForecast
    ? getWeatherIcon(
        getWeatherCondition(
          currentForecast.cloudCover,
          currentForecast.precipitation
        )
      )
    : "☁️";

  // Update tray title when weather data changes
  useEffect(() => {
    if (currentTemp !== null) {
      const title = `${currentIcon} ${currentTemp}°`;
      invoke("update_tray_title", { title }).catch(console.error);
    }
  }, [currentTemp, currentIcon]);

  const handleQuit = async () => {
    try {
      await invoke("hide_window");
    } catch (e) {
      console.error("Failed to hide window:", e);
    }
  };

  return (
    <div className="flex flex-col weather-gradient overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{currentIcon}</span>
          <span className="font-medium text-2xl text-white">
            {currentTemp !== null ? `${currentTemp}°C` : "--°C"}
          </span>
          <span className="text-white/60 text-sm">
            {LOCATION.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
          )}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <svg
              className="w-4 h-4 text-white/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <span className="text-xs text-white/40">
            {lastUpdated
              ? `Updated: ${lastUpdated.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}`
              : ""}
          </span>
        </div>
      </div>


      {/* Main content */}
      <div className="flex flex-col px-3 pb-1 gap-3">
        {error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-white/60">
            <span className="text-3xl">⚠️</span>
            <span className="text-sm">{error}</span>
            <button
              onClick={refresh}
              className="px-3 py-1.5 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : dayGroups.length === 0 && isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-white/60">
            <div className="w-8 h-8 border-3 border-white/50 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading forecast...</span>
          </div>
        ) : (
          <>
            {/* Today & Tomorrow - detailed view */}
            <div className="flex gap-3">
              {dayGroups.filter(d => d.isDetailedView).map((dayGroup) => (
                <DaySection key={dayGroup.id} dayGroup={dayGroup} />
              ))}
            </div>

            {/* Days 3-7 - summary cards row */}
            <div className="flex gap-3">
              {dayGroups.filter(d => !d.isDetailedView).map((dayGroup) => (
                <DaySection key={dayGroup.id} dayGroup={dayGroup} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs text-white/30">
          Data: ECMWF via Open-Meteo
        </span>
        <button
          onClick={handleQuit}
          className="text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

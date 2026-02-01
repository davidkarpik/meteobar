export interface WeatherAPIResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  hourly: HourlyData;
  hourly_units: HourlyUnits;
  daily: DailyData;
  daily_units: DailyUnits;
}

export interface DailyData {
  time: string[];
  sunrise: string[];
  sunset: string[];
}

export interface DailyUnits {
  time: string;
  sunrise: string;
  sunset: string;
}

export interface HourlyData {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  snowfall: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  wind_direction_10m: number[];
  cloud_cover: number[];
  sunshine_duration: number[];
}

export interface HourlyUnits {
  time: string;
  temperature_2m: string;
  precipitation: string;
  snowfall: string;
  wind_speed_10m: string;
  wind_gusts_10m: string;
  wind_direction_10m: string;
  cloud_cover: string;
  sunshine_duration: string;
}

export interface HourlyForecast {
  id: string;
  date: Date;
  hour: number;
  temperature: number;
  precipitation: number;
  snowfall: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  cloudCover: number;
  sunshineDuration: number;
}

export interface DayGroup {
  id: string;
  date: Date;
  hours: HourlyForecast[];
  isDetailedView: boolean; // true for Today/Tomorrow, false for days 3+
  summary?: DaySummary; // only for days 3+
}

export interface DaySummary {
  maxTemp: number;
  minTemp: number;
  avgCloudCover: number;
  sunshineHours: number;
  totalPrecipitation: number;
  totalSnowfall: number;
  dominantCondition: WeatherCondition;
}

export type WeatherCondition =
  | "clear"
  | "partlyCloudy"
  | "cloudy"
  | "overcast"
  | "lightRain"
  | "rain"
  | "heavyRain";

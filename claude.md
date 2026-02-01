# MeteoBar

A native macOS menu bar app displaying weather forecasts using ECMWF data via Open-Meteo API.

## Claude Code Usage

**Always start Claude from this directory:**
```bash
cd /Users/davidkarpik/Developer/MeteoBar
claude
```

**Warning for directory renames:** If moving/renaming the project folder, change to the new directory BEFORE deleting the old one, otherwise the shell breaks:
```bash
mv old_dir/* new_dir/
cd new_dir        # Change first!
rm -rf old_dir    # Then delete
```

## Tech Stack

- **Framework**: Tauri 2.x (Rust backend + WebView frontend)
- **Frontend**: React 18 + TypeScript + Tailwind CSS 4
- **Build**: Vite
- **API**: Open-Meteo ECMWF (free, 9km resolution)

## Project Structure

```
meteobar/
├── src/                      # React frontend
│   ├── components/
│   │   ├── ForecastStrip.tsx # Main container with header/footer
│   │   ├── DaySection.tsx    # Day column group
│   │   └── HourColumn.tsx    # Single hour data column
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css             # Tailwind imports
│   ├── types.ts              # TypeScript interfaces
│   ├── constants.ts          # Location, thresholds
│   ├── utils.ts              # Helper functions
│   └── weatherService.ts     # API fetch + processing
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── lib.rs            # Tray icon + window management
│   │   └── main.rs           # Entry point
│   ├── tauri.conf.json       # App config (window, tray, bundle)
│   ├── Cargo.toml            # Rust dependencies
│   └── icons/                # App icons
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Commands

```bash
# Development (hot reload)
npm run tauri dev

# Build release
npm run tauri build
# Output: src-tauri/target/release/bundle/macos/MeteoBar.app

# Frontend only (for UI development)
npm run dev

# Kill running app and restart with new build
pkill -f "meteobar"; sleep 2; open "/Users/davidkarpik/Developer/MeteoBar/src-tauri/target/release/bundle/macos/MeteoBar.app"
```

**Important**: After building, you must kill the running app before launching the new version. The app won't auto-reload - always run the kill/restart command after `npm run tauri build`.

## Configuration

### Location (src/constants.ts)
```typescript
export const LOCATION = {
  name: "Braunschweig, DE",
  latitude: 52.283,
  longitude: 10.569,
};
```

### Window Settings (src-tauri/tauri.conf.json)
- Width: 780px, Height: 420px
- Transparent window (macOSPrivateApi enabled)
- No window decorations (frameless)
- Always on top when visible
- Starts hidden (tray icon only)
- Content auto-sizes with rounded card appearance

## API

**Endpoint**: `https://api.open-meteo.com/v1/ecmwf`

**Parameters**:
- `latitude`, `longitude`: Location coordinates
- `hourly`: temperature_2m, precipitation, snowfall, wind_speed_10m, wind_gusts_10m, wind_direction_10m, cloud_cover
- `forecast_days`: 8
- `timezone`: auto

**Rate Limits**: 10,000 requests/day (free tier)

## Features

- System tray icon (click to toggle forecast panel)
- Dark gradient UI (macOS Weather app style)
- 8-day forecast with adaptive intervals:
  - Today: every 3 hours (8 data points)
  - Tomorrow: every 6 hours (4 data points)
  - Days 3-8: summary cards
- Snow (cm) vs rain (mm) display with appropriate icons
- Color-coded temperature (cyan=freezing, blue=cold, green=mild, orange=warm, red=hot)
- Color-coded wind gusts (orange=strong, red=very strong)
- Auto-refresh every 30 minutes
- Manual refresh button

## Dependencies

### Rust (Cargo.toml)
- `tauri` with `tray-icon` feature
- `tauri-plugin-positioner` for tray-centered window positioning
- `tauri-plugin-opener`
- `serde`, `serde_json`

### Node (package.json)
- `react`, `react-dom`
- `@tauri-apps/api`
- `tailwindcss`, `@tailwindcss/vite`
- `typescript`, `vite`

## Troubleshooting

### App doesn't appear in menu bar
- Check System Settings > Control Center > Menu Bar Only
- Ensure tray icon path exists: `src-tauri/icons/icon.png`

### Window doesn't position correctly
- The `tauri-plugin-positioner` handles tray-centered positioning
- If issues persist, check `Position::TrayCenter` in lib.rs

### API errors
- Check network connectivity
- Verify coordinates are valid
- Open-Meteo has no API key requirement

## Future Enhancements

- [ ] Location picker / CoreLocation integration
- [ ] User preferences (units, refresh interval)
- [ ] Keyboard shortcut to show/hide
- [ ] Multiple locations
- [ ] Weather alerts

use tauri::{
    image::Image,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent, TrayIconId},
    AppHandle, Manager,
};
use tauri_plugin_positioner::{Position, WindowExt};
use std::sync::Mutex;

#[cfg(target_os = "macos")]
use objc2_app_kit::{NSApplication, NSApplicationActivationPolicy};
#[cfg(target_os = "macos")]
use objc2::MainThreadMarker;

// Store tray icon ID for later updates
struct TrayState {
    tray_id: TrayIconId,
}

#[tauri::command]
fn hide_window(window: tauri::Window) {
    let _ = window.hide();
}

#[tauri::command]
fn update_tray_title(app: AppHandle, title: String) {
    if let Some(tray_state) = app.try_state::<Mutex<TrayState>>() {
        if let Ok(state) = tray_state.lock() {
            if let Some(tray) = app.tray_by_id(&state.tray_id) {
                let _ = tray.set_title(Some(&title));
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_positioner::init())
        .invoke_handler(tauri::generate_handler![hide_window, update_tray_title])
        .setup(|app| {
            // Hide dock icon on macOS
            #[cfg(target_os = "macos")]
            {
                let mtm = MainThreadMarker::new().expect("must be on main thread");
                let ns_app = NSApplication::sharedApplication(mtm);
                ns_app.setActivationPolicy(NSApplicationActivationPolicy::Accessory);
            }

            // Create system tray icon with initial title (transparent 1x1 icon, text only)
            let transparent_icon = Image::new_owned(vec![0, 0, 0, 0], 1, 1);
            let tray = TrayIconBuilder::new()
                .icon(transparent_icon)
                .icon_as_template(true)
                .title("--°")
                .tooltip("MeteoBar")
                .on_tray_icon_event(|tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);

                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.move_window(Position::TrayCenter);
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Store tray ID for later updates
            app.manage(Mutex::new(TrayState {
                tray_id: tray.id().clone(),
            }));

            // Handle click outside to hide window
            let window = app.get_webview_window("main").unwrap();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::Focused(false) = event {
                    // Window lost focus - could hide here if desired
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

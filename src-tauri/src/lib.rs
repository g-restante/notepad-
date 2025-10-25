// File operations commands
#[tauri::command]
async fn open_file_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let result = std::sync::Arc::new(std::sync::Mutex::new(None));
    let result_clone = result.clone();
    
    app.dialog().file()
        .set_title("Open File")
        .add_filter("Text Files", &["txt", "md", "js", "ts", "html", "css", "json", "py", "java", "cpp", "c", "h", "rs", "go", "php", "rb", "swift", "kt", "dart", "vue", "jsx", "tsx"])
        .add_filter("All Files", &["*"])
        .pick_file(move |file_path| {
            let mut result = result_clone.lock().unwrap();
            *result = file_path.map(|p| p.to_string());
        });

    // Wait for the dialog to complete (simple approach)
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    
    let result = result.lock().unwrap().clone();
    Ok(result)
}

#[tauri::command]
async fn save_file_dialog(app: tauri::AppHandle, default_name: Option<String>) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let result = std::sync::Arc::new(std::sync::Mutex::new(None));
    let result_clone = result.clone();
    
    let mut dialog = app.dialog().file()
        .set_title("Save File")
        .add_filter("Text Files", &["txt", "md", "js", "ts", "html", "css", "json", "py", "java", "cpp", "c", "h", "rs", "go", "php", "rb", "swift", "kt", "dart", "vue", "jsx", "tsx"])
        .add_filter("All Files", &["*"]);
    
    if let Some(name) = default_name {
        dialog = dialog.set_file_name(&name);
    }
    
    dialog.save_file(move |file_path| {
        let mut result = result_clone.lock().unwrap();
        *result = file_path.map(|p| p.to_string());
    });
    
    // Wait for the dialog to complete
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    
    let result = result.lock().unwrap().clone();
    Ok(result)
}

#[tauri::command]
async fn read_file_content(file_path: String) -> Result<String, String> {
    std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
async fn write_file_content(file_path: String, content: String) -> Result<(), String> {
    std::fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_file_dialog,
            save_file_dialog,
            read_file_content,
            write_file_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

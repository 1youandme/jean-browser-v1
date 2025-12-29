use crate::commands::{FileEntry, list_directory, open_in_system};
use tauri::command;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FileSystemOperation {
    operation: String,
    path: String,
    result: Option<String>,
    error: Option<String>,
}

#[command]
pub async fn create_directory(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[command]
pub async fn delete_file_or_directory(path: String) -> Result<(), String> {
    if std::path::Path::new(&path).is_dir() {
        std::fs::remove_dir_all(&path).map_err(|e| e.to_string())
    } else {
        std::fs::remove_file(&path).map_err(|e| e.to_string())
    }
}

#[command]
pub async fn move_file(source: String, destination: String) -> Result<(), String> {
    std::fs::rename(&source, &destination).map_err(|e| e.to_string())
}

#[command]
pub async fn copy_file(source: String, destination: String) -> Result<(), String> {
    std::fs::copy(&source, &destination).map_err(|e| e.to_string()).map(|_| ())
}

#[command]
pub async fn get_file_info(path: String) -> Result<FileEntry, String> {
    use std::path::Path;
    let path_obj = Path::new(&path);
    
    if !path_obj.exists() {
        return Err("File does not exist".to_string());
    }

    let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    
    Ok(FileEntry {
        name: path_obj.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string(),
        path: path,
        is_directory: metadata.is_dir(),
        size: if metadata.is_file() { Some(metadata.len()) } else { None },
        modified: metadata.modified()
            .ok()
            .and_then(|t| t.elapsed().ok())
            .map(|d| chrono::Utc::now() - chrono::Duration::from_std(d).unwrap())
            .map(|dt| dt.to_rfc3339()),
    })
}
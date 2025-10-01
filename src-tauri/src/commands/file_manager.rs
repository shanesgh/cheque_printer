
use std::fs;
use std::path::PathBuf;
use dirs::download_dir;
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn open_excel_from_database(
    document_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<String, String> {
    println!("The id is: {:?}", document_id);

    // Fetch file from the database
    let record = sqlx::query!(
        "SELECT file_name, file_data FROM documents WHERE id = ?",
        document_id
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Failed to fetch document: {}", e))?;

    let file_name = format!("{}_{}", Utc::now().timestamp(), record.file_name);
    let file_data = record.file_data;

    // Get the Downloads folder path
    let downloads_path = download_dir()
        .ok_or("Could not locate Downloads folder")?;

    let mut file_path = PathBuf::from(downloads_path);
    file_path.push(file_name);

    println!("Saving to: {:?}", &file_path);

    // Write the file to Downloads
    fs::write(&file_path, &file_data)
        .map_err(|e| format!("Failed to write file to Downloads: {}", e))?;

    // Return the full path as a string
    Ok(file_path.to_string_lossy().to_string())
}


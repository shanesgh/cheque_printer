
use std::fs;
use std::path::PathBuf;
use dirs::download_dir;
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn get_excel_file(
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

#[tauri::command]
pub async fn rename_document(
    document_id: i64,
    new_name: String,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    println!("Renaming document ID {} to '{}'", document_id, new_name);

    sqlx::query!(
        "UPDATE documents SET file_name = ? WHERE id = ?",
        new_name,
        document_id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Failed to rename document: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn delete_document(
    document_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    println!("Deleting document ID: {}", document_id);

    sqlx::query!(
        "DELETE FROM documents WHERE id = ?",
        document_id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Failed to delete document: {}", e))?;

    Ok(())
}

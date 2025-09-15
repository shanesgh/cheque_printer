use serde_json::json;
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn process_blob(
    file_name: String,
    data: Vec<u8>,
    pool: State<'_, SqlitePool>,
) -> Result<String, String> {
    // Generate the current UTC timestamp
    let created_at: chrono::DateTime<Utc> = Utc::now();

    // Insert the file metadata and binary data into the database
    let result = sqlx::query!(
        "INSERT INTO documents (file_name, file_data, created_at) VALUES (?, ?, ?)",
        file_name,
        data,
        created_at
    )
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Failed to insert blob into the documents table: {}", e))?;

    let document_id = result.last_insert_rowid();

    // Create a JSON response with relevant metadata
    let response: serde_json::Value = json!({
        "status": "success",
        "message": format!("File '{}' saved successfully!", file_name),
        "file_name": file_name,
        "document_id": document_id,
        "created_at": created_at.to_rfc3339()
    });

    // Serialize the JSON response to a string safely
    serde_json::to_string(&response)
        .map_err(|e| format!("Failed to serialize JSON response: {}", e))
}

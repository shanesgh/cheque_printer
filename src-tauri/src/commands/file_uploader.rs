use serde_json::json;
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;
use calamine::{Data, Reader, Xlsx};
use std::io::Cursor;

#[tauri::command]
pub async fn upload_excel_as_blob(
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

    // Process Excel data and insert cheques
    let cursor = Cursor::new(data.clone());
    if let Ok(mut workbook) = Xlsx::new(cursor) {
        if let Ok(range) = workbook.worksheet_range("Sheet1") {
            for row in range.rows().skip(1) {
                if row.len() >= 3 {
                    let cheque_number = match &row[0] {
                        Data::String(s) => s.clone(),
                        Data::Int(i) => i.to_string(),
                        Data::Float(f) => f.to_string(),
                        _ => continue,
                    };
                    let amount = match &row[1] {
                        Data::Float(f) => *f,
                        Data::Int(i) => *i as f64,
                        _ => continue,
                    };
                    let client_name = match &row[2] {
                        Data::String(s) => s.clone(),
                        _ => continue,
                    };

                    sqlx::query!(
                        "INSERT INTO cheques (document_id, cheque_number, amount, client_name, status) VALUES (?, ?, ?, ?, 'Pending')",
                        document_id,
                        cheque_number,
                        amount,
                        client_name
                    )
                    .execute(pool.inner())
                    .await
                    .map_err(|e| format!("Failed to insert cheque: {}", e))?;
                }
            }
        }
    }
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

use crate::database::models::{FileMetadata,DataError, Document};
use sqlx::{sqlite::SqliteQueryResult, SqlitePool };
use std::path::PathBuf;
use tokio::fs;
use tauri::{path::BaseDirectory, AppHandle, Manager, State};

type Result<T> = std::result::Result<T, DataError>;


//QUERIES - FILEMETADATA  TABLE

// Fetch all records from the `file_metadata` table

pub async fn get_metadata(pool: &SqlitePool) -> Result<Vec<FileMetadata>> {
    let rows: Vec<FileMetadata> = sqlx::query_as!(
        FileMetadata,
        "SELECT id, name, path, uploaded_at FROM file_metadata"
    )
    .fetch_all(pool)
    .await
    .map_err(|e| DataError::Database(e.to_string()))?; // Automatically wrap sqlx::Error as DataError::Database
    Ok(rows) // Return the resulting rows
}


// Insert a new record into the `file_metadata` table
pub async fn insert_metadata(
    pool: &SqlitePool,
    name: &str,
    path: &str,
) -> Result<i64> {
    let result: SqliteQueryResult = sqlx::query!(
        "INSERT INTO file_metadata (name, path) VALUES (?, ?)",
        name,
        path
    )
    .execute(pool)
    .await
    .map_err(|e| DataError::Database(e.to_string()))?; // Automatically wrap sqlx::Error as DataError::Database
    Ok(result.last_insert_rowid())
}

// Update a record in the `file_metadata` table by ID
pub async fn update_metadata(
    pool: &SqlitePool,
    id: i64,
    name: Option<&str>,
    path: Option<&str>,
) -> Result<()> {
    sqlx::query!(
        "UPDATE file_metadata SET name = COALESCE(?, name), path = COALESCE(?, path) WHERE id = ?",
        name,
        path,
        id
    )
    .execute(pool)
    .await
    .map_err(|e| DataError::Database(e.to_string()))?; // Automatically wrap sqlx::Error as DataError::Database
    Ok(())
}

// Delete a record from the `file_metadata` table by ID
pub async fn delete_metadata(pool: &SqlitePool, id: i64) -> Result<()> {
    sqlx::query!(
        "DELETE FROM file_metadata WHERE id = ?",
        id
    )
    .execute(pool)
    .await
    .map_err(|e| DataError::Database(e.to_string()))?; // Automatically wrap sqlx::Error as DataError::Database
    Ok(())
}



// QUERIES - DOCUMENTS TABLE

// remember to call `.manage(MyState::default())`


#[tauri::command]
pub async fn get_all_documents(pool: State<'_, SqlitePool>) -> Result<String> {
    let documents: Vec<Document> = sqlx::query_as!(
        Document,
        "SELECT id, file_name, file_data, created_at FROM documents"
    )
    .fetch_all(pool.inner())
    .await?; // Automatically converts `sqlx::Error` into `DataError::Database`

    // Serialize the documents into a JSON string
    let response: String = serde_json::to_string(&documents)?; // Automatically converts `serde_json::Error` into `DataError::Serialization`

    Ok(response) // Return the JSON string
}



#[tauri::command]
pub async fn get_document_file(
    app_handle: AppHandle,
    pool: State<'_, SqlitePool>,
    document_id: i32,
) -> Result<String> {
    // Fetch file metadata and data from the SQLite database
    let result = sqlx::query!(
        "SELECT file_name, file_data FROM documents WHERE id = ?",
        document_id
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| DataError::Database(e.to_string()))?;

    let file_name = result.file_name; // File name from the database
    let file_data = result.file_data; // Binary data (Vec<u8>) from the database

    // Resolve the Downloads directory using `BaseDirectory`
    let download_dir = app_handle
        .path()
        .resolve(PathBuf::new(), BaseDirectory::Download)
        .map_err(|_| DataError::FileSystem("Could not resolve the Downloads directory".to_string()))?;

    // Construct the full file path
    let file_path = PathBuf::from(download_dir).join(&file_name);

    // Write the file data to the resolved path
    fs::write(&file_path, file_data)
        .await
        .map_err(|e| DataError::FileSystem(format!("Failed to write file: {}", e)))?;

    Ok(file_path.to_string_lossy().to_string()) // Return the file path
}




#[tauri::command]
pub async fn delete_all_documents(pool: State<'_, SqlitePool>) -> Result<String> {
    // Execute a SQL query to delete all records from the `documents` table
    sqlx::query!("DELETE FROM documents")
        .execute(pool.inner())
        .await
        .map_err(|e| DataError::FileSystem(format!("Failed to delete file: {}", e)))?;

    Ok("All records have been deleted successfully.".to_string())
}

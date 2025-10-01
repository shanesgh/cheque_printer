use sqlx::SqlitePool;
use tauri::State;
use serde_json::json;
use std::path::PathBuf;
use tokio::fs;
use tauri::{path::BaseDirectory, AppHandle, Manager};
use crate::database::models::DataError;

type Result<T> = std::result::Result<T, DataError>;

/// Retrieve all documents with metadata
#[tauri::command]
pub async fn get_all_documents(pool: State<'_, SqlitePool>) -> Result<String> {
    let documents = sqlx::query!(
        "SELECT id, file_name, file_data, created_at, is_locked FROM documents"
    )
    .fetch_all(pool.inner())
    .await?;

    let response: Vec<serde_json::Value> = documents
        .into_iter()
        .map(|doc| {
            json!({
                "id": doc.id,
                "file_name": doc.file_name,
                "file_data": doc.file_data,
                "created_at": doc.created_at,
                "is_locked": doc.is_locked
            })
        })
        .collect();

    Ok(serde_json::to_string(&response)?)
}

/// Download document to user's downloads folder
#[tauri::command]
pub async fn download_document_to_folder(
    app_handle: AppHandle,
    pool: State<'_, SqlitePool>,
    document_id: i32,
) -> Result<String> {
    let result = sqlx::query!(
        "SELECT file_name, file_data FROM documents WHERE id = ?",
        document_id
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| DataError::Database(e.to_string()))?;

    let download_dir = app_handle
        .path()
        .resolve(PathBuf::new(), BaseDirectory::Download)
        .map_err(|_| DataError::FileSystem("Could not resolve downloads directory".to_string()))?;

    let file_path = PathBuf::from(download_dir).join(&result.file_name);

    fs::write(&file_path, result.file_data)
        .await
        .map_err(|e| DataError::FileSystem(format!("Failed to write file: {}", e)))?;

    Ok(file_path.to_string_lossy().to_string())
}

/// Rename document
#[tauri::command]
pub async fn rename_document(
    pool: State<'_, SqlitePool>,
    document_id: i64,
    new_name: String,
) -> Result<()> {
    if new_name.trim().is_empty() {
        return Err(DataError::Custom("Document name cannot be empty".to_string()));
    }

    let rows_affected = sqlx::query!(
        "UPDATE documents SET file_name = ? WHERE id = ?",
        new_name,
        document_id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to rename document: {}", e)))?
    .rows_affected();

    if rows_affected == 0 {
        return Err(DataError::Custom(format!("Document with ID {} not found", document_id)));
    }

    Ok(())
}

/// Delete document (checks if locked first)
#[tauri::command]
pub async fn delete_document(
    pool: State<'_, SqlitePool>,
    document_id: i64,
) -> Result<()> {
    let is_locked = sqlx::query!(
        "SELECT is_locked FROM documents WHERE id = ?",
        document_id
    )
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to check document lock status: {}", e)))?;

    if is_locked.is_none() {
        return Err(DataError::Custom(format!("Document with ID {} not found", document_id)));
    }

    if is_locked.unwrap().is_locked.unwrap_or(0) == 1 {
        return Err(DataError::Custom("Cannot delete: Document is locked. Documents are locked after printing to maintain audit trail.".to_string()));
    }

    sqlx::query!("DELETE FROM documents WHERE id = ?", document_id)
        .execute(pool.inner())
        .await
        .map_err(|e| DataError::Database(format!("Failed to delete document: {}", e)))?;

    Ok(())
}

/// Delete all documents (for admin/testing purposes)
#[tauri::command]
pub async fn delete_all_documents(pool: State<'_, SqlitePool>) -> Result<String> {
    let result = sqlx::query!("DELETE FROM documents")
        .execute(pool.inner())
        .await
        .map_err(|e| DataError::Database(format!("Failed to delete all documents: {}", e)))?;

    let rows_affected = result.rows_affected();
    Ok(format!("Successfully deleted {} document(s)", rows_affected))
}

/// Lock document (prevent deletion after printing)
#[tauri::command]
pub async fn lock_document(
    document_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    let rows_affected = sqlx::query!(
        "UPDATE documents SET is_locked = 1 WHERE id = ?",
        document_id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to lock document: {}", e)))?
    .rows_affected();

    if rows_affected == 0 {
        return Err(DataError::Custom(format!("Document with ID {} not found", document_id)));
    }

    Ok(())
}

/// Check if document is locked
#[tauri::command]
pub async fn is_document_locked(
    document_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<bool> {
    let result = sqlx::query!(
        "SELECT is_locked FROM documents WHERE id = ?",
        document_id
    )
    .fetch_one(pool.inner())
    .await?;

    Ok(result.is_locked.unwrap_or(0) == 1)
}

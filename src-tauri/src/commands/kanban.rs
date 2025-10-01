use sqlx::SqlitePool;
use tauri::State;
use serde_json::json;
use crate::database::models::{KanbanNote, KanbanComment};

#[tauri::command]
pub async fn get_kanban_notes(pool: State<'_, SqlitePool>) -> Result<String, String> {
    let notes: Vec<KanbanNote> = sqlx::query_as!(
        KanbanNote,
        "SELECT id, title, description, status, note_type, created_at, updated_at, position 
         FROM kanban_notes ORDER BY position ASC"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    serde_json::to_string(&notes).map_err(|e| format!("Serialization error: {}", e))
}

#[tauri::command]
pub async fn create_kanban_note(
    title: String,
    description: Option<String>,
    note_type: String,
    pool: State<'_, SqlitePool>,
) -> Result<String, String> {
    let max_position: Option<i64> = sqlx::query_scalar!(
        "SELECT MAX(position) FROM kanban_notes WHERE status = 'todo'"
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let position = max_position.unwrap_or(0) + 1;

    let result = sqlx::query!(
        "INSERT INTO kanban_notes (title, description, status, note_type, position, created_at, updated_at) 
         VALUES (?, ?, 'todo', ?, ?, datetime('now'), datetime('now'))",
        title,
        description,
        note_type,
        position
    )
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let note = KanbanNote {
        id: result.last_insert_rowid(),
        title,
        description,
        status: "todo".to_string(),
        note_type,
        created_at: chrono::Utc::now().naive_utc().into(),
        updated_at: chrono::Utc::now().naive_utc().into(),
        position,
    };

    serde_json::to_string(&note).map_err(|e| format!("Serialization error: {}", e))
}

#[tauri::command]
pub async fn update_kanban_note_status(
    id: i64,
    status: String,
    position: i64,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query!(
        "UPDATE kanban_notes SET status = ?, position = ?, updated_at = datetime('now') WHERE id = ?",
        status,
        position,
        id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn update_kanban_note(
    id: i64,
    title: String,
    description: Option<String>,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query!(
        "UPDATE kanban_notes SET title = ?, description = ?, updated_at = datetime('now') WHERE id = ?",
        title,
        description,
        id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn delete_kanban_note(
    id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query!("DELETE FROM kanban_notes WHERE id = ?", id)
        .execute(pool.inner())
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_kanban_comments(
    note_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<String, String> {
    let comments: Vec<KanbanComment> = sqlx::query_as!(
        KanbanComment,
        "SELECT id, note_id, comment_text, created_at, updated_at
         FROM kanban_comments
         WHERE note_id = ?
         ORDER BY created_at ASC",
        note_id
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    serde_json::to_string(&comments).map_err(|e| format!("Serialization error: {}", e))
}

#[tauri::command]
pub async fn create_kanban_comment(
    note_id: i64,
    comment_text: String,
    pool: State<'_, SqlitePool>,
) -> Result<String, String> {
    let result = sqlx::query!(
        "INSERT INTO kanban_comments (note_id, comment_text, created_at, updated_at)
         VALUES (?, ?, datetime('now'), datetime('now'))",
        note_id,
        comment_text
    )
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let comment = KanbanComment {
        id: result.last_insert_rowid(),
        note_id,
        comment_text,
        created_at: Some(chrono::Utc::now().naive_utc()),
        updated_at: Some(chrono::Utc::now().naive_utc()),
    };

    serde_json::to_string(&comment).map_err(|e| format!("Serialization error: {}", e))
}

#[tauri::command]
pub async fn delete_kanban_comment(
    id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query!("DELETE FROM kanban_comments WHERE id = ?", id)
        .execute(pool.inner())
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    Ok(())
}
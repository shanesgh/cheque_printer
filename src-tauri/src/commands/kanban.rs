use sqlx::SqlitePool;
use tauri::State;
use serde_json::json;
use crate::database::models::KanbanNote;

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
    let max_position: Option<i32> = sqlx::query_scalar!(
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
        created_at: chrono::Utc::now().naive_utc(),
        updated_at: chrono::Utc::now().naive_utc(),
        position,
    };

    serde_json::to_string(&note).map_err(|e| format!("Serialization error: {}", e))
}

#[tauri::command]
pub async fn update_kanban_note_status(
    id: i64,
    status: String,
    position: i32,
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
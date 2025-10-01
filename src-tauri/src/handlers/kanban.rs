use sqlx::SqlitePool;
use tauri::State;
use crate::database::models::{KanbanNote, KanbanComment, DataError};

type Result<T> = std::result::Result<T, DataError>;

/// Get all kanban notes
#[tauri::command]
pub async fn get_kanban_notes(pool: State<'_, SqlitePool>) -> Result<String> {
    let notes: Vec<KanbanNote> = sqlx::query_as!(
        KanbanNote,
        "SELECT id, title, description, status, note_type, created_at, updated_at, position FROM kanban_notes ORDER BY position ASC"
    )
    .fetch_all(pool.inner())
    .await?;

    Ok(serde_json::to_string(&notes)?)
}

/// Create a new kanban note
#[tauri::command]
pub async fn create_kanban_note(
    title: String,
    description: Option<String>,
    note_type: String,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    let max_position: Option<i64> = sqlx::query_scalar("SELECT MAX(position) FROM kanban_notes")
        .fetch_one(pool.inner())
        .await?;

    let new_position = max_position.unwrap_or(0) + 1;

    sqlx::query!(
        "INSERT INTO kanban_notes (title, description, note_type, position) VALUES (?, ?, ?, ?)",
        title,
        description,
        note_type,
        new_position
    )
    .execute(pool.inner())
    .await?;

    Ok(())
}

/// Update kanban note
#[tauri::command]
pub async fn update_kanban_note(
    id: i64,
    title: String,
    description: Option<String>,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    sqlx::query!(
        "UPDATE kanban_notes SET title = ?, description = ? WHERE id = ?",
        title,
        description,
        id
    )
    .execute(pool.inner())
    .await?;

    Ok(())
}

/// Update kanban note status and position
#[tauri::command]
pub async fn update_kanban_note_status(
    id: i64,
    status: String,
    position: i64,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    sqlx::query!(
        "UPDATE kanban_notes SET status = ?, position = ? WHERE id = ?",
        status,
        position,
        id
    )
    .execute(pool.inner())
    .await?;

    Ok(())
}

/// Delete kanban note
#[tauri::command]
pub async fn delete_kanban_note(
    id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    sqlx::query!("DELETE FROM kanban_notes WHERE id = ?", id)
        .execute(pool.inner())
        .await?;

    Ok(())
}

/// Get comments for a kanban note
#[tauri::command]
pub async fn get_kanban_comments(
    note_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<String> {
    let comments: Vec<KanbanComment> = sqlx::query_as!(
        KanbanComment,
        "SELECT id, note_id, comment_text, created_at, updated_at FROM kanban_comments WHERE note_id = ? ORDER BY created_at ASC",
        note_id
    )
    .fetch_all(pool.inner())
    .await?;

    Ok(serde_json::to_string(&comments)?)
}

/// Create a new comment on a kanban note
#[tauri::command]
pub async fn create_kanban_comment(
    note_id: i64,
    comment_text: String,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    sqlx::query!(
        "INSERT INTO kanban_comments (note_id, comment_text) VALUES (?, ?)",
        note_id,
        comment_text
    )
    .execute(pool.inner())
    .await?;

    Ok(())
}

/// Delete a comment from a kanban note
#[tauri::command]
pub async fn delete_kanban_comment(
    id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    sqlx::query!("DELETE FROM kanban_comments WHERE id = ?", id)
        .execute(pool.inner())
        .await?;

    Ok(())
}

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
    if title.trim().is_empty() {
        return Err(DataError::Custom("Note title cannot be empty".to_string()));
    }

    let valid_types = ["bug", "feature", "task", "enhancement"];
    if !valid_types.contains(&note_type.as_str()) {
        return Err(DataError::Custom(format!(
            "Invalid note type '{}'. Must be one of: bug, feature, task, or enhancement",
            note_type
        )));
    }

    let max_position: Option<i64> = sqlx::query_scalar("SELECT MAX(position) FROM kanban_notes")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| DataError::Database(format!("Failed to get max position: {}", e)))?;

    let new_position = max_position.unwrap_or(0) + 1;

    sqlx::query!(
        "INSERT INTO kanban_notes (title, description, note_type, position) VALUES (?, ?, ?, ?)",
        title,
        description,
        note_type,
        new_position
    )
    .execute(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to create kanban note: {}", e)))?;

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
    if title.trim().is_empty() {
        return Err(DataError::Custom("Note title cannot be empty".to_string()));
    }

    let rows_affected = sqlx::query!(
        "UPDATE kanban_notes SET title = ?, description = ? WHERE id = ?",
        title,
        description,
        id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to update kanban note: {}", e)))?
    .rows_affected();

    if rows_affected == 0 {
        return Err(DataError::Custom(format!("Kanban note with ID {} not found", id)));
    }

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
    let valid_statuses = ["todo", "in_progress", "done"];
    if !valid_statuses.contains(&status.as_str()) {
        return Err(DataError::Custom(format!(
            "Invalid status '{}'. Must be one of: todo, in_progress, or done",
            status
        )));
    }

    if position < 0 {
        return Err(DataError::Custom("Position must be a non-negative number".to_string()));
    }

    let rows_affected = sqlx::query!(
        "UPDATE kanban_notes SET status = ?, position = ? WHERE id = ?",
        status,
        position,
        id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to update kanban note status: {}", e)))?
    .rows_affected();

    if rows_affected == 0 {
        return Err(DataError::Custom(format!("Kanban note with ID {} not found", id)));
    }

    Ok(())
}

/// Delete kanban note
#[tauri::command]
pub async fn delete_kanban_note(
    id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    let rows_affected = sqlx::query!("DELETE FROM kanban_notes WHERE id = ?", id)
        .execute(pool.inner())
        .await
        .map_err(|e| DataError::Database(format!("Failed to delete kanban note: {}", e)))?
        .rows_affected();

    if rows_affected == 0 {
        return Err(DataError::Custom(format!("Kanban note with ID {} not found", id)));
    }

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
    if comment_text.trim().is_empty() {
        return Err(DataError::Custom("Comment text cannot be empty".to_string()));
    }

    let note_exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM kanban_notes WHERE id = ?"
    )
    .bind(note_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to verify note exists: {}", e)))?;

    if note_exists == 0 {
        return Err(DataError::Custom(format!("Kanban note with ID {} not found", note_id)));
    }

    sqlx::query!(
        "INSERT INTO kanban_comments (note_id, comment_text) VALUES (?, ?)",
        note_id,
        comment_text
    )
    .execute(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to create comment: {}", e)))?;

    Ok(())
}

/// Delete a comment from a kanban note
#[tauri::command]
pub async fn delete_kanban_comment(
    id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    let rows_affected = sqlx::query!("DELETE FROM kanban_comments WHERE id = ?", id)
        .execute(pool.inner())
        .await
        .map_err(|e| DataError::Database(format!("Failed to delete comment: {}", e)))?
        .rows_affected();

    if rows_affected == 0 {
        return Err(DataError::Custom(format!("Comment with ID {} not found", id)));
    }

    Ok(())
}

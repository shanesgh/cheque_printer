use sqlx::SqlitePool;
use tauri::State;
use serde_json::json;

#[tauri::command]
pub async fn increment_print_count(
    cheque_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query!(
        "UPDATE cheques SET print_count = COALESCE(print_count, 0) + 1 WHERE id = ?",
        cheque_id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Failed to increment print count: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn lock_document(
    document_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query!(
        "UPDATE documents SET is_locked = 1 WHERE id = ?",
        document_id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Failed to lock document: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn is_document_locked(
    document_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<bool, String> {
    let result = sqlx::query!(
        "SELECT is_locked FROM documents WHERE id = ?",
        document_id
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Failed to check document lock status: {}", e))?;

    Ok(result.is_locked.unwrap_or(0) == 1)
}

#[tauri::command]
pub async fn update_decline_reason(
    cheque_id: i64,
    reason: String,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query!(
        "UPDATE cheques SET status = 'Declined', decline_reason = ?, remarks = ? WHERE id = ?",
        reason,
        reason,
        cheque_id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Failed to update decline reason: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn update_cheque_issue_date(
    cheque_id: i64,
    issue_date: String,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query!(
        "UPDATE cheques SET issue_date = ? WHERE id = ?",
        issue_date,
        cheque_id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| format!("Failed to update issue date: {}", e))?;

    Ok(())
}

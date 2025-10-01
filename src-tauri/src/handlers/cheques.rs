use sqlx::SqlitePool;
use tauri::State;
use serde_json::json;
use crate::database::models::{ChequeWithDocument, DataError};

type Result<T> = std::result::Result<T, DataError>;

/// Get all cheques with their document information
#[tauri::command]
pub async fn get_all_cheques(pool: State<'_, SqlitePool>) -> Result<String> {
    let records: Vec<ChequeWithDocument> = sqlx::query_as::<_, ChequeWithDocument>(
        "SELECT d.id as document_id, d.file_name, d.created_at, d.is_locked,
                c.id as cheque_id, c.cheque_number, c.amount, c.client_name,
                c.status, c.issue_date, c.date_field, c.remarks,
                c.current_signatures, c.first_signature_user_id, c.second_signature_user_id,
                c.print_count
         FROM documents d
         LEFT JOIN cheques c ON d.id = c.document_id
         ORDER BY d.created_at DESC, c.id ASC"
    )
    .fetch_all(pool.inner())
    .await?;

    let response = json!({
        "cheques": records.iter().filter_map(|r| {
            if r.cheque_id.is_some() {
                Some(json!({
                    "cheque_id": r.cheque_id,
                    "document_id": r.document_id,
                    "file_name": r.file_name,
                    "created_at": r.created_at,
                    "cheque_number": r.cheque_number,
                    "amount": r.amount,
                    "client_name": r.client_name,
                    "status": r.status,
                    "issue_date": r.issue_date,
                    "date": r.date_field,
                    "remarks": r.remarks,
                    "current_signatures": r.current_signatures,
                    "first_signature_user_id": r.first_signature_user_id,
                    "second_signature_user_id": r.second_signature_user_id,
                    "print_count": r.print_count,
                    "is_locked": r.is_locked
                }))
            } else { None }
        }).collect::<Vec<_>>()
    });

    Ok(serde_json::to_string(&response)?)
}

/// Update cheque status (Approved, Declined, Pending)
#[tauri::command]
pub async fn update_cheque_status(
    cheque_id: i64,
    new_status: String,
    remarks: Option<String>,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    let valid_statuses = ["Approved", "Declined", "Pending"];
    if !valid_statuses.contains(&new_status.as_str()) {
        return Err(DataError::Custom(format!(
            "Invalid status '{}'. Must be one of: Approved, Declined, or Pending",
            new_status
        )));
    }

    let cheque_exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM cheques WHERE id = ?"
    )
    .bind(cheque_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to check if cheque exists: {}", e)))?;

    if cheque_exists == 0 {
        return Err(DataError::Custom(format!(
            "Cheque with ID {} not found",
            cheque_id
        )));
    }

    let result = if new_status == "Approved" && remarks.is_some() {
        sqlx::query!(
            "UPDATE cheques SET status = ?, current_signatures = 1, first_signature_user_id = 1, remarks = ? WHERE id = ?",
            new_status,
            remarks,
            cheque_id
        )
        .execute(pool.inner())
        .await
    } else if new_status == "Approved" {
        sqlx::query!(
            "UPDATE cheques SET status = ?, current_signatures = 1, first_signature_user_id = 1 WHERE id = ?",
            new_status,
            cheque_id
        )
        .execute(pool.inner())
        .await
    } else if let Some(remarks_text) = remarks {
        sqlx::query!(
            "UPDATE cheques SET status = ?, remarks = ? WHERE id = ?",
            new_status,
            remarks_text,
            cheque_id
        )
        .execute(pool.inner())
        .await
    } else {
        sqlx::query!(
            "UPDATE cheques SET status = ? WHERE id = ?",
            new_status,
            cheque_id
        )
        .execute(pool.inner())
        .await
    };

    result.map_err(|e| DataError::Database(format!("Failed to update cheque status: {}", e)))?;
    Ok(())
}

/// Update cheque issue date
#[tauri::command]
pub async fn update_cheque_issue_date(
    cheque_id: i64,
    issue_date: String,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    let cheque_exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM cheques WHERE id = ?"
    )
    .bind(cheque_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to verify cheque exists: {}", e)))?;

    if cheque_exists == 0 {
        return Err(DataError::Custom(format!("Cheque with ID {} not found", cheque_id)));
    }

    sqlx::query!(
        "UPDATE cheques SET issue_date = ? WHERE id = ?",
        issue_date,
        cheque_id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to update cheque issue date: {}", e)))?;

    Ok(())
}

/// Update decline reason for rejected cheques
#[tauri::command]
pub async fn update_decline_reason(
    cheque_id: i64,
    reason: String,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    if reason.trim().is_empty() {
        return Err(DataError::Custom("Decline reason cannot be empty".to_string()));
    }

    let cheque_exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM cheques WHERE id = ?"
    )
    .bind(cheque_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to verify cheque exists: {}", e)))?;

    if cheque_exists == 0 {
        return Err(DataError::Custom(format!("Cheque with ID {} not found", cheque_id)));
    }

    sqlx::query!(
        "UPDATE cheques SET status = 'Declined', decline_reason = ?, remarks = ? WHERE id = ?",
        reason,
        reason,
        cheque_id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to update decline reason: {}", e)))?;

    Ok(())
}

/// Increment cheque print count
#[tauri::command]
pub async fn increment_print_count(
    cheque_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    let rows_affected = sqlx::query!(
        "UPDATE cheques SET print_count = COALESCE(print_count, 0) + 1 WHERE id = ?",
        cheque_id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| DataError::Database(format!("Failed to increment print count: {}", e)))?
    .rows_affected();

    if rows_affected == 0 {
        return Err(DataError::Custom(format!("Cheque with ID {} not found", cheque_id)));
    }

    Ok(())
}

/// Execute custom SQL query for analytics (use with caution)
#[tauri::command]
pub async fn execute_dynamic_query(
    sql_query: String,
    pool: State<'_, SqlitePool>,
) -> Result<String> {
    if sql_query.trim().is_empty() {
        return Err(DataError::Custom("SQL query cannot be empty".to_string()));
    }

    let dangerous_keywords = ["DROP", "DELETE", "TRUNCATE", "ALTER"];
    let uppercase_query = sql_query.to_uppercase();
    for keyword in &dangerous_keywords {
        if uppercase_query.contains(keyword) {
            return Err(DataError::Custom(format!(
                "Query contains dangerous keyword '{}' and is not allowed",
                keyword
            )));
        }
    }

    let rows = sqlx::query(&sql_query)
        .fetch_all(pool.inner())
        .await
        .map_err(|e| DataError::Database(format!("Query execution failed: {}", e)))?;

    let result: Vec<serde_json::Value> = rows
        .iter()
        .map(|row| {
            let mut obj = serde_json::Map::new();
            for (i, col) in row.columns().iter().enumerate() {
                let value: Option<String> = row.try_get(i).ok();
                obj.insert(col.name().to_string(), json!(value));
            }
            json!(obj)
        })
        .collect();

    Ok(serde_json::to_string(&result)?)
}

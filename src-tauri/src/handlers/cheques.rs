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
    if new_status == "Approved" && remarks.is_some() {
        sqlx::query!(
            "UPDATE cheques SET status = ?, current_signatures = 1, first_signature_user_id = 1, remarks = ? WHERE id = ?",
            new_status,
            remarks,
            cheque_id
        )
    } else if new_status == "Approved" {
        sqlx::query!(
            "UPDATE cheques SET status = ?, current_signatures = 1, first_signature_user_id = 1 WHERE id = ?",
            new_status,
            cheque_id
        )
    } else if let Some(remarks_text) = remarks {
        sqlx::query!(
            "UPDATE cheques SET status = ?, remarks = ? WHERE id = ?",
            new_status,
            remarks_text,
            cheque_id
        )
    } else {
        sqlx::query!(
            "UPDATE cheques SET status = ? WHERE id = ?",
            new_status,
            cheque_id
        )
    }
    .execute(pool.inner())
    .await?;

    Ok(())
}

/// Update cheque issue date
#[tauri::command]
pub async fn update_cheque_issue_date(
    cheque_id: i64,
    issue_date: String,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    sqlx::query!(
        "UPDATE cheques SET issue_date = ? WHERE id = ?",
        issue_date,
        cheque_id
    )
    .execute(pool.inner())
    .await?;

    Ok(())
}

/// Update decline reason for rejected cheques
#[tauri::command]
pub async fn update_decline_reason(
    cheque_id: i64,
    reason: String,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    sqlx::query!(
        "UPDATE cheques SET status = 'Declined', decline_reason = ?, remarks = ? WHERE id = ?",
        reason,
        reason,
        cheque_id
    )
    .execute(pool.inner())
    .await?;

    Ok(())
}

/// Increment cheque print count
#[tauri::command]
pub async fn increment_print_count(
    cheque_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<()> {
    sqlx::query!(
        "UPDATE cheques SET print_count = COALESCE(print_count, 0) + 1 WHERE id = ?",
        cheque_id
    )
    .execute(pool.inner())
    .await?;

    Ok(())
}

/// Execute custom SQL query for analytics (use with caution)
#[tauri::command]
pub async fn execute_dynamic_query(
    sql_query: String,
    pool: State<'_, SqlitePool>,
) -> Result<String> {
    let rows = sqlx::query(&sql_query)
        .fetch_all(pool.inner())
        .await?;

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

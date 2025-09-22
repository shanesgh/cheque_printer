use sqlx::SqlitePool;
use tauri::State;
use serde_json::json;
use crate::database::models::ChequeWithDocument;


#[tauri::command]
pub async fn get_all_cheques(pool: State<'_, SqlitePool>) -> Result<String, String> {
    let records: Vec<ChequeWithDocument> = sqlx::query_as::<_, ChequeWithDocument>(
        "SELECT d.id as document_id, d.file_name, d.created_at, 
                c.id as cheque_id, c.cheque_number, c.amount, c.client_name, 
                c.status, c.issue_date, c.date_field, c.remarks,
                c.current_signatures, c.first_signature_user_id
         FROM documents d 
         LEFT JOIN cheques c ON d.id = c.document_id 
         ORDER BY d.created_at DESC, c.id ASC"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

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
                    "first_signature_user_id": r.first_signature_user_id
                }))
            } else { None }
        }).collect::<Vec<_>>()
    });

    serde_json::to_string(&response).map_err(|e| format!("Serialization error: {}", e))
}

#[tauri::command]
pub async fn update_cheque_status(
    cheque_id: i64,
    new_status: String,
    remarks: Option<String>,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    match (new_status.as_str(), remarks) {
        ("Approved", Some(remarks_text)) => {
            sqlx::query!(
                "UPDATE cheques SET status = ?, current_signatures = 1, first_signature_user_id = 1, remarks = ? WHERE id = ?",
                new_status,
                remarks_text,
                cheque_id
            )
            .execute(pool.inner())
            .await
            .map_err(|e| format!("Failed to update status: {}", e))?;
        }
        ("Approved", None) => {
            sqlx::query!(
                "UPDATE cheques SET status = ?, current_signatures = 1, first_signature_user_id = 1 WHERE id = ?",
                new_status,
                cheque_id
            )
            .execute(pool.inner())
            .await
            .map_err(|e| format!("Failed to update status: {}", e))?;
        }
        (_, Some(remarks_text)) => {
            sqlx::query!(
                "UPDATE cheques SET status = ?, remarks = ? WHERE id = ?",
                new_status,
                remarks_text,
                cheque_id
            )
            .execute(pool.inner())
            .await
            .map_err(|e| format!("Failed to update status: {}", e))?;
        }
        (_, None) => {
            sqlx::query!(
                "UPDATE cheques SET status = ? WHERE id = ?",
                new_status,
                cheque_id
            )
            .execute(pool.inner())
            .await
            .map_err(|e| format!("Failed to update status: {}", e))?;
        }
    }

    Ok(())
}

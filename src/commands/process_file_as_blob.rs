@@ .. @@
 use serde_json::json;
 use chrono::Utc;
 use sqlx::SqlitePool;
 use tauri::State;
 use calamine::{Data, Reader, Xlsx};
 use std::io::Cursor;

 #[tauri::command]
 pub async fn process_blob(
     file_name: String,
     data: Vec<u8>,
     pool: State<'_, SqlitePool>,
 ) -> Result<String, String> {
     // Generate the current UTC timestamp
     let created_at: chrono::DateTime<Utc> = Utc::now();
+    let today_date = created_at.format("%Y-%m-%d").to_string();

     // Insert the file metadata and binary data into the database
@@ .. @@
                         _ => continue,
                     };

-                    sqlx::query!(
-                        "INSERT INTO cheques (document_id, cheque_number, amount, client_name, status) VALUES (?, ?, ?, ?, 'Pending')",
+                    sqlx::query!(
+                        "INSERT INTO cheques (document_id, cheque_number, amount, client_name, status, issue_date, date_field) VALUES (?, ?, ?, ?, 'Pending', ?, ?)",
                         document_id,
                         cheque_number,
                         amount,
-                        client_name
+                        client_name,
+                        today_date,
+                        today_date
                     )
                     .execute(pool.inner())
                     .await
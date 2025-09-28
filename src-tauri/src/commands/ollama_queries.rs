use sqlx::SqlitePool;
use tauri::State;
use serde_json::{json, Value};

#[tauri::command]
pub async fn execute_dynamic_query(
    sql_query: String,
    pool: State<'_, SqlitePool>,
) -> Result<String, String> {
    let rows = sqlx::query(&sql_query)
        .fetch_all(pool.inner())
        .await
        .map_err(|e| format!("Query error: {}", e))?;

    let mut results = Vec::new();
    for row in rows {
        let mut obj = serde_json::Map::new();
        for (i, column) in row.columns().iter().enumerate() {
            let value: Value = match row.try_get_raw(i) {
                Ok(raw) => {
                    if raw.is_null() {
                        Value::Null
                    } else {
                        match column.type_info().name() {
                            "TEXT" => json!(row.get::<Option<String>, _>(i)),
                            "INTEGER" => json!(row.get::<Option<i64>, _>(i)),
                            "REAL" => json!(row.get::<Option<f64>, _>(i)),
                            _ => json!(row.get::<Option<String>, _>(i)),
                        }
                    }
                }
                Err(_) => Value::Null,
            };
            obj.insert(column.name().to_string(), value);
        }
        results.push(Value::Object(obj));
    }

    serde_json::to_string(&results).map_err(|e| format!("Serialization error: {}", e))
}
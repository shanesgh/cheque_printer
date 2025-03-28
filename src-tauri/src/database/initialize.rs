use sqlx::SqlitePool;
use crate::database::models::DataError;

/// Initialize the database by creating necessary tables.
pub async fn initialize_database(pool: &SqlitePool) -> Result<(), DataError> {
    // Create `file_metadata` table if it doesn't exist
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS file_metadata (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        );"
    )
    .execute(pool)
    .await
    .map_err(|e| DataError::Database(e.to_string()))?; // Automatically wrap sqlx::Error as DataError::Database

    // Create `documents` table if it doesn't exist
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL,
            file_data BLOB NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        );"
    )
    .execute(pool)
    .await
    .map_err(|e| DataError::Database(e.to_string()))?; // Automatically wrap sqlx::Error as DataError::Database

    println!("Database initialized successfully with `file_metadata` and `documents` tables!");
    Ok(())
}

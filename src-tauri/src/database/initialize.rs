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

    // Create `cheques` table if it doesn't exist
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS cheques (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            cheque_number TEXT NOT NULL,
            amount REAL NOT NULL,
            client_name TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            issue_date TEXT,
            date_field TEXT,
            remarks TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (document_id) REFERENCES documents (id)
        );"
    )
    .execute(pool)
    .await
    .map_err(|e| DataError::Database(e.to_string()))?;

    // Create `kanban_notes` table if it doesn't exist
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS kanban_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'todo',
            note_type TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );"
    )
    .execute(pool)
    .await
    .map_err(|e| DataError::Database(e.to_string()))?;

    println!("Database initialized successfully with `file_metadata` and `documents` tables!");
    Ok(())
}

             

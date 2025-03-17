use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// pub type DatabasePool = sqlx::sqlite::SqlitePool;
// pub type DatabaseTransaction<'t> = sqlx::Transaction<'t, sqlx::Sqlite>;
// pub type QueryResult = sqlx::sqlite::SqliteQueryResult;

/// Represents the metadata for an uploaded file in the database.
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct FileMetadata {
    pub id: i64,                        // Primary key
    pub name: String,                   // Name of the file
    pub path: String,                   // Location of the file on disk
    pub uploaded_at: Option<NaiveDateTime>, // Upload timestamp
}

/// Represents a document stored as a BLOB in the database.
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Document {
    pub id: i64,                   // Unique document ID
    pub file_name: String,         // File name
    pub file_data: Vec<u8>,        // Binary data stored as a BLOB
    pub created_at: NaiveDateTime, // Timestamp of creation
}

#[derive(Debug, thiserror::Error, Serialize, Deserialize)]
#[serde(tag = "type", content = "details")]
pub enum DataError {
    #[error("Database error")]
    Database(String), // Use a String instead of directly storing `sqlx::Error`
    #[error("File system error: {0}")]
    FileSystem(String),
    
    #[error("Serialization error")]
    Serialization(String), // Use a String instead of directly storing `serde_json::Error`
    #[error("Custom error: {0}")]
    Custom(String),
}

// Add From<String> implementation
impl From<String> for DataError {
    fn from(error: String) -> Self {
        DataError::Custom(error)
    }
}

impl From<sqlx::Error> for DataError {
    fn from(error: sqlx::Error) -> Self {
        DataError::Database(error.to_string()) // Convert `sqlx::Error` into a string
    }
}

impl From<serde_json::Error> for DataError {
    fn from(error: serde_json::Error) -> Self {
        DataError::Serialization(error.to_string()) // Convert `serde_json::Error` into a string
    }
}


impl From<DataError> for String {
    fn from(error: DataError) -> Self {
        error.to_string() // Converts the error to a string for frontend compatibility.
    }
}





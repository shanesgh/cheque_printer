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
    pub uploaded_at: NaiveDateTime, // Upload timestamp
}

/// Represents a document stored as a BLOB in the database.
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Document {
    pub id: i64,                   // Unique document ID
    pub file_name: String,         // File name
    pub file_data: Vec<u8>,        // Binary data stored as a BLOB
    pub created_at: NaiveDateTime, // Timestamp of creation
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ChequeWithDocument {
    // Document fields (without file_data since we don't need the blob in this query)
    pub document_id: i64,
    pub file_name: String,
    pub created_at: NaiveDateTime,
    
    // Cheque fields (all optional because of LEFT JOIN)
    pub cheque_id: Option<i64>,
    pub cheque_number: Option<String>,
    pub amount: Option<f64>,
    pub client_name: Option<String>,
    pub status: Option<String>,
    pub issue_date: Option<String>,
    pub date_field: Option<String>,
    pub remarks: Option<String>,
    pub current_signatures: Option<i64>,
    pub first_signature_user_id: Option<i64>,
    pub second_signature_user_id: Option<i64>,
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

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Cheque {
    pub id: i64,                        // Primary key
    pub document_id: i64,              // Foreign key to documents
    pub cheque_number: String,         // Cheque number
    pub amount: f64,                   // Amount on the cheque
    pub client_name: String,           // Name of the client
    pub status: String,                // Status (e.g., Pending, Approved)
    pub issue_date: Option<String>,    // Optional issue date (stored as TEXT)
    pub date_field: Option<String>,    // Optional additional date field
    pub remarks: Option<String>,       // Optional remarks
    pub created_at: Option<NaiveDateTime>, // Timestamp of creation
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

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct KanbanNote {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String, // "todo", "in_progress", "done"
    pub note_type: String, // "issue", "feature", "update"
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub position: i32,
}





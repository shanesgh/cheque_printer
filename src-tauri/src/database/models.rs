use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Document stored as binary blob in database
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Document {
    pub id: i64,
    pub file_name: String,
    pub file_data: Vec<u8>,
    pub created_at: NaiveDateTime,
}

/// Cheque with associated document information (for joins)
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ChequeWithDocument {
    pub document_id: i64,
    pub file_name: String,
    pub created_at: NaiveDateTime,
    pub is_locked: Option<i64>,
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
    pub print_count: Option<i64>,
}

/// Individual cheque record
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Cheque {
    pub id: i64,
    pub document_id: i64,
    pub cheque_number: String,
    pub amount: f64,
    pub client_name: String,
    pub status: String,
    pub issue_date: Option<String>,
    pub date_field: Option<String>,
    pub remarks: Option<String>,
    pub created_at: Option<NaiveDateTime>,
}

/// Kanban board note
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct KanbanNote {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub note_type: String,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub position: i64,
}

/// Comment on kanban note
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct KanbanComment {
    pub id: i64,
    pub note_id: i64,
    pub comment_text: String,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

/// Custom error types for database operations
#[derive(Debug, thiserror::Error, Serialize, Deserialize)]
#[serde(tag = "type", content = "details")]
pub enum DataError {
    #[error("Database error: {0}")]
    Database(String),
    #[error("File system error: {0}")]
    FileSystem(String),
    #[error("Serialization error: {0}")]
    Serialization(String),
    #[error("Custom error: {0}")]
    Custom(String),
}

impl From<String> for DataError {
    fn from(error: String) -> Self {
        DataError::Custom(error)
    }
}

impl From<sqlx::Error> for DataError {
    fn from(error: sqlx::Error) -> Self {
        DataError::Database(error.to_string())
    }
}

impl From<serde_json::Error> for DataError {
    fn from(error: serde_json::Error) -> Self {
        DataError::Serialization(error.to_string())
    }
}

impl From<DataError> for String {
    fn from(error: DataError) -> Self {
        error.to_string()
    }
}

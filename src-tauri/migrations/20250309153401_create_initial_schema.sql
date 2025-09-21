-- Add migration script here

-- Create file_metadata table
CREATE TABLE IF NOT EXISTS file_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create documents table  
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    file_data BLOB NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Create cheques table with foreign key reference
CREATE TABLE IF NOT EXISTS cheques (
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
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cheques_document_id ON cheques(document_id);
CREATE INDEX IF NOT EXISTS idx_cheques_status ON cheques(status);
CREATE INDEX IF NOT EXISTS idx_cheques_client_name ON cheques(client_name);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_file_metadata_name ON file_metadata(name);
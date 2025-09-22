-- -- Add migration script here

-- -- Create file_metadata table
-- CREATE TABLE IF NOT EXISTS file_metadata (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     name TEXT NOT NULL,
--     path TEXT NOT NULL,
--     uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
-- );

-- -- Create documents table  
-- CREATE TABLE IF NOT EXISTS documents (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     file_name TEXT NOT NULL,
--     file_data BLOB NOT NULL,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
-- );

-- -- Enable foreign key constraints
-- PRAGMA foreign_keys = ON;

-- -- Create cheques table with foreign key reference
-- CREATE TABLE IF NOT EXISTS cheques (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     document_id INTEGER NOT NULL,
--     cheque_number TEXT NOT NULL,
--     amount REAL NOT NULL,
--     client_name TEXT NOT NULL,
--     status TEXT DEFAULT 'Pending',
--     issue_date TEXT,
--     date_field TEXT,
--     remarks TEXT,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
-- );

-- -- Create indexes for better query performance
-- CREATE INDEX IF NOT EXISTS idx_cheques_document_id ON cheques(document_id);
-- CREATE INDEX IF NOT EXISTS idx_cheques_status ON cheques(status);
-- CREATE INDEX IF NOT EXISTS idx_cheques_client_name ON cheques(client_name);
-- CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
-- CREATE INDEX IF NOT EXISTS idx_file_metadata_name ON file_metadata(name);

-- Complete SQLite Migration - All Tables and Indexes
-- This file contains the complete database schema with audit trail system

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

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

-- Create cheques table with all columns including audit fields
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
    current_signatures INTEGER DEFAULT 0,
    first_signature_user_id INTEGER,
    second_signature_user_id INTEGER,
    required_signatures INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
);

-- Create audit_trail table for complete cheque lifecycle tracking
CREATE TABLE IF NOT EXISTS audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cheque_id INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- 'uploaded', 'status_changed', 'signed', 'approved', 'declined', 'amount_changed', 'remarks_updated'
    old_value TEXT,
    new_value TEXT,
    user_id INTEGER DEFAULT 1,
    user_name TEXT DEFAULT 'System',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    session_id TEXT, -- Track user sessions for grouped actions
    ip_address TEXT, -- Optional: track IP for security
    FOREIGN KEY (cheque_id) REFERENCES cheques (id) ON DELETE CASCADE
);

-- Create users table for better user tracking (optional - if you need user management)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    first_name TEXT,
    last_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Create cheque_analytics table for pre-computed metrics (performance optimization)
CREATE TABLE IF NOT EXISTS cheque_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    period_date TEXT NOT NULL, -- '2024-01', '2024-W01', '2024-01-01'
    total_cheques INTEGER DEFAULT 0,
    total_amount REAL DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    declined_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    avg_processing_time REAL DEFAULT 0, -- in hours
    max_amount REAL DEFAULT 0,
    min_amount REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_type, period_date)
);

-- Create processing_metrics table for performance tracking
CREATE TABLE IF NOT EXISTS processing_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cheque_id INTEGER NOT NULL,
    uploaded_at DATETIME,
    first_signature_at DATETIME,
    second_signature_at DATETIME,
    approved_at DATETIME,
    declined_at DATETIME,
    printed_at DATETIME,
    total_processing_time REAL, -- in hours
    status_changes_count INTEGER DEFAULT 0,
    FOREIGN KEY (cheque_id) REFERENCES cheques (id) ON DELETE CASCADE
);

-- ===== INDEXES FOR PERFORMANCE =====

-- File metadata indexes
CREATE INDEX IF NOT EXISTS idx_file_metadata_name ON file_metadata(name);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploaded_at ON file_metadata(uploaded_at);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_file_name ON documents(file_name);

-- Cheques indexes
CREATE INDEX IF NOT EXISTS idx_cheques_document_id ON cheques(document_id);
CREATE INDEX IF NOT EXISTS idx_cheques_status ON cheques(status);
CREATE INDEX IF NOT EXISTS idx_cheques_client_name ON cheques(client_name);
CREATE INDEX IF NOT EXISTS idx_cheques_amount ON cheques(amount);
CREATE INDEX IF NOT EXISTS idx_cheques_created_at ON cheques(created_at);
CREATE INDEX IF NOT EXISTS idx_cheques_cheque_number ON cheques(cheque_number);
CREATE INDEX IF NOT EXISTS idx_cheques_current_signatures ON cheques(current_signatures);
CREATE INDEX IF NOT EXISTS idx_cheques_first_signature_user_id ON cheques(first_signature_user_id);

-- Audit trail indexes (critical for performance)
CREATE INDEX IF NOT EXISTS idx_audit_trail_cheque_id ON audit_trail(cheque_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action_type ON audit_trail(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_session_id ON audit_trail(session_id);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_cheque_analytics_period ON cheque_analytics(period_type, period_date);
CREATE INDEX IF NOT EXISTS idx_cheque_analytics_updated_at ON cheque_analytics(updated_at);

-- Processing metrics indexes
CREATE INDEX IF NOT EXISTS idx_processing_metrics_cheque_id ON processing_metrics(cheque_id);
CREATE INDEX IF NOT EXISTS idx_processing_metrics_uploaded_at ON processing_metrics(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_processing_metrics_total_processing_time ON processing_metrics(total_processing_time);

-- ===== TRIGGERS FOR AUTOMATIC UPDATES =====

-- Update cheques updated_at timestamp on any change
CREATE TRIGGER IF NOT EXISTS update_cheques_timestamp 
AFTER UPDATE ON cheques
FOR EACH ROW
BEGIN
    UPDATE cheques SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Automatically log audit trail for status changes
CREATE TRIGGER IF NOT EXISTS log_status_change
AFTER UPDATE OF status ON cheques
FOR EACH ROW
WHEN OLD.status != NEW.status
BEGIN
    INSERT INTO audit_trail (cheque_id, action_type, old_value, new_value, timestamp, notes)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, CURRENT_TIMESTAMP, 'Status changed from ' || OLD.status || ' to ' || NEW.status);
END;

-- Automatically log audit trail for amount changes
CREATE TRIGGER IF NOT EXISTS log_amount_change
AFTER UPDATE OF amount ON cheques
FOR EACH ROW
WHEN OLD.amount != NEW.amount
BEGIN
    INSERT INTO audit_trail (cheque_id, action_type, old_value, new_value, timestamp, notes)
    VALUES (NEW.id, 'amount_changed', CAST(OLD.amount AS TEXT), CAST(NEW.amount AS TEXT), CURRENT_TIMESTAMP, 'Amount changed from $' || OLD.amount || ' to $' || NEW.amount);
END;

-- Automatically log audit trail for remarks updates
CREATE TRIGGER IF NOT EXISTS log_remarks_change
AFTER UPDATE OF remarks ON cheques
FOR EACH ROW
WHEN (OLD.remarks IS NULL AND NEW.remarks IS NOT NULL) OR (OLD.remarks != NEW.remarks)
BEGIN
    INSERT INTO audit_trail (cheque_id, action_type, old_value, new_value, timestamp, notes)
    VALUES (NEW.id, 'remarks_updated', OLD.remarks, NEW.remarks, CURRENT_TIMESTAMP, 'Remarks updated');
END;

-- Automatically update processing metrics
CREATE TRIGGER IF NOT EXISTS update_processing_metrics
AFTER UPDATE ON cheques
FOR EACH ROW
BEGIN
    INSERT OR REPLACE INTO processing_metrics (
        cheque_id, 
        uploaded_at,
        first_signature_at,
        approved_at,
        declined_at,
        total_processing_time,
        status_changes_count
    )
    SELECT 
        NEW.id,
        NEW.created_at,
        CASE WHEN NEW.current_signatures >= 1 AND OLD.current_signatures < 1 THEN CURRENT_TIMESTAMP ELSE pm.first_signature_at END,
        CASE WHEN NEW.status = 'Approve' AND OLD.status != 'Approve' THEN CURRENT_TIMESTAMP ELSE pm.approved_at END,
        CASE WHEN NEW.status = 'Declined' AND OLD.status != 'Declined' THEN CURRENT_TIMESTAMP ELSE pm.declined_at END,
        CASE 
            WHEN NEW.status IN ('Approve', 'Declined') THEN 
                ROUND((julianday(CURRENT_TIMESTAMP) - julianday(NEW.created_at)) * 24, 2)
            ELSE pm.total_processing_time 
        END,
        COALESCE(pm.status_changes_count, 0) + CASE WHEN OLD.status != NEW.status THEN 1 ELSE 0 END
    FROM (SELECT * FROM processing_metrics WHERE cheque_id = NEW.id) pm
    WHERE TRUE;
END;

-- ===== INITIAL DATA SETUP =====

-- Insert default system user if not exists
INSERT OR IGNORE INTO users (id, username, email, role, first_name, last_name)
VALUES (1, 'system', 'system@company.com', 'system', 'System', 'User');

-- Create views for common queries (performance optimization)

-- View for cheque summary with processing time
CREATE VIEW IF NOT EXISTS cheque_summary AS
SELECT 
    c.id,
    c.cheque_number,
    c.amount,
    c.client_name,
    c.status,
    c.created_at,
    c.current_signatures,
    c.required_signatures,
    pm.total_processing_time,
    pm.status_changes_count,
    d.file_name as source_file
FROM cheques c
LEFT JOIN processing_metrics pm ON c.id = pm.cheque_id
LEFT JOIN documents d ON c.document_id = d.id;

-- View for audit trail with user names
CREATE VIEW IF NOT EXISTS audit_trail_detailed AS
SELECT 
    at.id,
    at.cheque_id,
    c.cheque_number,
    c.client_name,
    at.action_type,
    at.old_value,
    at.new_value,
    at.user_name,
    at.timestamp,
    at.notes
FROM audit_trail at
LEFT JOIN cheques c ON at.cheque_id = c.id
ORDER BY at.timestamp DESC;
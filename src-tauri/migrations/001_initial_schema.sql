/*
  # Initial Database Schema

  Complete database schema for cheque processing application.
  Includes all tables, indexes, triggers, views, and initial data.
*/

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ===== CORE TABLES =====

-- Documents table stores uploaded Excel files as binary data
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    file_data BLOB NOT NULL,
    is_locked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Cheques table stores extracted cheque data from documents
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
    decline_reason TEXT,
    current_signatures INTEGER DEFAULT 0,
    first_signature_user_id INTEGER,
    second_signature_user_id INTEGER,
    required_signatures INTEGER DEFAULT 1,
    print_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
);

-- Audit trail for complete cheque lifecycle tracking
CREATE TABLE IF NOT EXISTS audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cheque_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    user_id INTEGER DEFAULT 1,
    user_name TEXT DEFAULT 'System',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    session_id TEXT,
    ip_address TEXT,
    FOREIGN KEY (cheque_id) REFERENCES cheques (id) ON DELETE CASCADE
);

-- Users table for user management
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    first_name TEXT,
    last_name TEXT,
    signature_image BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Pre-computed analytics for performance optimization
CREATE TABLE IF NOT EXISTS cheque_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_type TEXT NOT NULL,
    period_date TEXT NOT NULL,
    total_cheques INTEGER DEFAULT 0,
    total_amount REAL DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    declined_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    avg_processing_time REAL DEFAULT 0,
    max_amount REAL DEFAULT 0,
    min_amount REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_type, period_date)
);

-- Processing metrics for performance tracking
CREATE TABLE IF NOT EXISTS processing_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cheque_id INTEGER NOT NULL,
    uploaded_at DATETIME,
    first_signature_at DATETIME,
    second_signature_at DATETIME,
    approved_at DATETIME,
    declined_at DATETIME,
    printed_at DATETIME,
    total_processing_time REAL,
    status_changes_count INTEGER DEFAULT 0,
    FOREIGN KEY (cheque_id) REFERENCES cheques (id) ON DELETE CASCADE
);

-- Kanban board for help and support tracking
CREATE TABLE IF NOT EXISTS kanban_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    note_type TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Comments for kanban notes
CREATE TABLE IF NOT EXISTS kanban_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES kanban_notes(id) ON DELETE CASCADE
);

-- ===== INDEXES FOR PERFORMANCE =====

CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_file_name ON documents(file_name);

CREATE INDEX IF NOT EXISTS idx_cheques_document_id ON cheques(document_id);
CREATE INDEX IF NOT EXISTS idx_cheques_status ON cheques(status);
CREATE INDEX IF NOT EXISTS idx_cheques_client_name ON cheques(client_name);
CREATE INDEX IF NOT EXISTS idx_cheques_amount ON cheques(amount);
CREATE INDEX IF NOT EXISTS idx_cheques_created_at ON cheques(created_at);
CREATE INDEX IF NOT EXISTS idx_cheques_cheque_number ON cheques(cheque_number);
CREATE INDEX IF NOT EXISTS idx_cheques_current_signatures ON cheques(current_signatures);
CREATE INDEX IF NOT EXISTS idx_cheques_first_signature_user_id ON cheques(first_signature_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_trail_cheque_id ON audit_trail(cheque_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action_type ON audit_trail(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_session_id ON audit_trail(session_id);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_cheque_analytics_period ON cheque_analytics(period_type, period_date);
CREATE INDEX IF NOT EXISTS idx_cheque_analytics_updated_at ON cheque_analytics(updated_at);

CREATE INDEX IF NOT EXISTS idx_processing_metrics_cheque_id ON processing_metrics(cheque_id);
CREATE INDEX IF NOT EXISTS idx_processing_metrics_uploaded_at ON processing_metrics(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_processing_metrics_total_processing_time ON processing_metrics(total_processing_time);

CREATE INDEX IF NOT EXISTS idx_kanban_comments_note_id ON kanban_comments(note_id);
CREATE INDEX IF NOT EXISTS idx_kanban_comments_created_at ON kanban_comments(created_at);

-- ===== TRIGGERS FOR AUTOMATIC UPDATES =====

CREATE TRIGGER IF NOT EXISTS update_cheques_timestamp
AFTER UPDATE ON cheques
FOR EACH ROW
BEGIN
    UPDATE cheques SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS log_status_change
AFTER UPDATE OF status ON cheques
FOR EACH ROW
WHEN OLD.status != NEW.status
BEGIN
    INSERT INTO audit_trail (cheque_id, action_type, old_value, new_value, timestamp, notes)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, CURRENT_TIMESTAMP, 'Status changed from ' || OLD.status || ' to ' || NEW.status);
END;

CREATE TRIGGER IF NOT EXISTS log_amount_change
AFTER UPDATE OF amount ON cheques
FOR EACH ROW
WHEN OLD.amount != NEW.amount
BEGIN
    INSERT INTO audit_trail (cheque_id, action_type, old_value, new_value, timestamp, notes)
    VALUES (NEW.id, 'amount_changed', CAST(OLD.amount AS TEXT), CAST(NEW.amount AS TEXT), CURRENT_TIMESTAMP, 'Amount changed from $' || OLD.amount || ' to $' || NEW.amount);
END;

CREATE TRIGGER IF NOT EXISTS log_remarks_change
AFTER UPDATE OF remarks ON cheques
FOR EACH ROW
WHEN (OLD.remarks IS NULL AND NEW.remarks IS NOT NULL) OR (OLD.remarks != NEW.remarks)
BEGIN
    INSERT INTO audit_trail (cheque_id, action_type, old_value, new_value, timestamp, notes)
    VALUES (NEW.id, 'remarks_updated', OLD.remarks, NEW.remarks, CURRENT_TIMESTAMP, 'Remarks updated');
END;

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

CREATE TRIGGER IF NOT EXISTS update_kanban_comments_timestamp
AFTER UPDATE ON kanban_comments
FOR EACH ROW
BEGIN
    UPDATE kanban_comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ===== VIEWS FOR COMMON QUERIES =====

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

-- ===== INITIAL DATA =====

INSERT OR IGNORE INTO users (id, username, email, role, first_name, last_name)
VALUES (1, 'system', 'system@company.com', 'system', 'System', 'User');

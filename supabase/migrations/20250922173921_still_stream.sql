-- Add missing columns to cheques table

-- Add current_signatures column if it doesn't exist
ALTER TABLE cheques ADD COLUMN current_signatures INTEGER DEFAULT 0;

-- Add first_signature_user_id column if it doesn't exist  
ALTER TABLE cheques ADD COLUMN first_signature_user_id INTEGER;

-- Create audit_trail table for complete cheque lifecycle tracking
CREATE TABLE IF NOT EXISTS audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cheque_id INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- 'uploaded', 'status_changed', 'signed', 'approved', 'declined'
    old_value TEXT,
    new_value TEXT,
    user_id INTEGER DEFAULT 1,
    user_name TEXT DEFAULT 'System',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (cheque_id) REFERENCES cheques (id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_trail_cheque_id ON audit_trail(cheque_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_cheques_current_signatures ON cheques(current_signatures);
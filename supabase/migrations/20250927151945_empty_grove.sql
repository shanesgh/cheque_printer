@@ .. @@
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
 
+-- Create kanban_notes table for help/support system
+CREATE TABLE IF NOT EXISTS kanban_notes (
+    id INTEGER PRIMARY KEY AUTOINCREMENT,
+    title TEXT NOT NULL,
+    description TEXT,
+    status TEXT NOT NULL DEFAULT 'todo',
+    note_type TEXT NOT NULL,
+    position INTEGER NOT NULL DEFAULT 0,
+    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
+    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
+);
+
 -- ===== INDEXES FOR PERFORMANCE =====
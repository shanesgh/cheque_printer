/*
  # Add Kanban Comments and Print Tracking

  1. New Tables
    - `kanban_comments` - For comments/sub-notes on kanban notes
      - `id` (integer, primary key)
      - `note_id` (integer, foreign key to kanban_notes)
      - `comment_text` (text)
      - `created_at` (datetime)
      - `updated_at` (datetime)

  2. Changes to Existing Tables
    - `documents` - Add `is_locked` boolean field for print tracking
    - `cheques` - Add `print_count` integer field to track number of times printed

  3. Security
    - Foreign key constraints for data integrity
    - Indexes for performance
*/

-- Add comments table for kanban notes
CREATE TABLE IF NOT EXISTS kanban_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES kanban_notes(id) ON DELETE CASCADE
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_kanban_comments_note_id ON kanban_comments(note_id);
CREATE INDEX IF NOT EXISTS idx_kanban_comments_created_at ON kanban_comments(created_at);

-- Add is_locked field to documents table to prevent deletion after printing
ALTER TABLE documents ADD COLUMN is_locked INTEGER DEFAULT 0;

-- Add print_count field to cheques table to track print history
ALTER TABLE cheques ADD COLUMN print_count INTEGER DEFAULT 0;

-- Add decline_reason field to cheques table
ALTER TABLE cheques ADD COLUMN decline_reason TEXT;

-- Create trigger to update kanban_comments timestamp
CREATE TRIGGER IF NOT EXISTS update_kanban_comments_timestamp
AFTER UPDATE ON kanban_comments
FOR EACH ROW
BEGIN
    UPDATE kanban_comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

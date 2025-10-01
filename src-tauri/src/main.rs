#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use tauri::{generate_context, generate_handler};
use sqlx::SqlitePool;

mod commands;
mod database;
mod handlers;

// Import all command handlers
use commands::{
    convert_amount_to_words,
    parse_excel_to_cheques,
    upload_excel_as_blob,
    open_excel_from_database
};

use handlers::{
    documents::{
        get_all_documents,
        download_document_to_folder,
        rename_document,
        delete_document,
        delete_all_documents,
        lock_document,
        is_document_locked
    },
    cheques::{
        get_all_cheques,
        update_cheque_status,
        update_cheque_issue_date,
        update_decline_reason,
        increment_print_count,
        execute_dynamic_query
    },
    kanban::{
        get_kanban_notes,
        create_kanban_note,
        update_kanban_note,
        update_kanban_note_status,
        delete_kanban_note,
        get_kanban_comments,
        create_kanban_comment,
        delete_kanban_comment
    }
};

fn main() {
    tauri::async_runtime::block_on(async_main());
}

async fn async_main() {
    // Connect to database
    let database_url = "sqlite://storage.db?mode=rwc";
    let pool = SqlitePool::connect(database_url)
        .await
        .expect("Failed to connect to database");

    // Verify database connection
    match sqlx::query("SELECT 1")
        .execute(&pool)
        .await
    {
        Ok(_) => println!("✓ Database connection successful"),
        Err(e) => println!("✗ Database connection failed: {}", e),
    }

    // Run migrations
    match sqlx::migrate!("./migrations")
        .run(&pool)
        .await
    {
        Ok(_) => println!("✓ Database migrations applied successfully"),
        Err(e) => println!("✗ Migration error: {}", e),
    }

    // Start Tauri application
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(pool)
        .invoke_handler(generate_handler![
            // Excel processing
            parse_excel_to_cheques,
            convert_amount_to_words,
            upload_excel_as_blob,
            open_excel_from_database,
            // Document management
            get_all_documents,
            download_document_to_folder,
            rename_document,
            delete_document,
            delete_all_documents,
            lock_document,
            is_document_locked,
            // Cheque operations
            get_all_cheques,
            update_cheque_status,
            update_cheque_issue_date,
            update_decline_reason,
            increment_print_count,
            execute_dynamic_query,
            // Kanban board
            get_kanban_notes,
            create_kanban_note,
            update_kanban_note,
            update_kanban_note_status,
            delete_kanban_note,
            get_kanban_comments,
            create_kanban_comment,
            delete_kanban_comment
        ])
        .run(generate_context!())
        .expect("Error running Tauri application");
}

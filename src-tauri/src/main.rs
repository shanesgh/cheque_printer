#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use tauri::{generate_context, generate_handler};
use sqlx::SqlitePool;

mod commands;
mod database;

use database::queries::{delete_all_documents, get_all_documents, get_document_file};
use database::initialize::initialize_database;
use commands::{cheque_to_text, process_excel_file, process_blob, get_excel_file, rename_document, delete_document, get_all_cheques, update_cheque_status, get_kanban_notes, create_kanban_note, update_kanban_note_status, delete_kanban_note, execute_dynamic_query};

fn main() {
    // Start the tokio runtime
    tauri::async_runtime::block_on(async_main());
}

async fn async_main() {
    // Initialize the database connection pool
    let database_url: &'static str = "sqlite://storage.db?mode=rwc";
    let pool: sqlx::Pool<sqlx::Sqlite> = SqlitePool::connect(database_url)
        .await
        .expect("Failed to connect to the database");

    // Initialize the database schema
    if let Err(e) = initialize_database(&pool).await {
        println!("Database setup error: {}", e);
    } else {
        println!("Database initialized successfully!");
    }

    // Run the Tauri application
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(pool) // Manage the database connection pool
        .invoke_handler(generate_handler![process_excel_file, rename_document,cheque_to_text, process_blob, get_all_documents, get_document_file,delete_all_documents, get_excel_file, delete_document, get_all_cheques, update_cheque_status, get_kanban_notes, create_kanban_note, update_kanban_note_status, delete_kanban_note, execute_dynamic_query])
        .run(generate_context!())
        .expect("Error while running Tauri application");
}










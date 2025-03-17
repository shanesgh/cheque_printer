#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use tauri::{generate_context, generate_handler};
use sqlx::SqlitePool;

mod commands;
mod database;

use database::queries::{delete_all_documents, get_all_documents, get_document_file};
use database::initialize::initialize_database;
use commands::{cheque_to_text, process_excel_file, process_blob};

fn main() {
    // Start the tokio runtime
    tauri::async_runtime::block_on(async_main());
}

async fn async_main() {
    // Initialize the database connection pool
    let database_url = "sqlite://storage.db";
    let pool = SqlitePool::connect(database_url)
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
        .manage(pool) // Manage the database connection pool
        .invoke_handler(generate_handler![process_excel_file, cheque_to_text, process_blob, get_all_documents, get_document_file,delete_all_documents])
        .run(generate_context!())
        .expect("Error while running Tauri application");
}










// #![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

// use tauri::{generate_context, generate_handler, Manager};
// use sqlx::SqlitePool;
// use std::sync::Once;

// mod commands;
// mod database;

// use database::initialize::initialize_database;
// use commands::{cheque_to_text, process_excel_file, process_blob};

// // One-time initialization to avoid running multiple setups during runtime
// static INIT: Once = Once::new();

// fn main() {
//     run();
// }

// #[cfg_attr(mobile, tauri::mobile_entry_point)]
// pub fn run() {
//     tauri::Builder::default()
//         .plugin(tauri_plugin_opener::init())
//         .invoke_handler(generate_handler![process_excel_file, cheque_to_text, process_blob])
//         .setup(|app| {
//             // Ensure database initialization runs only once
//             let handle = app.handle().clone(); // Clone the Tauri app handle for async context
//             INIT.call_once(|| {
//                 tauri::async_runtime::spawn(async move {
//                     let database_url = "sqlite://storage.db";

//                     // Create the database connection pool
//                     match SqlitePool::connect(database_url).await {
//                         Ok(pool) => {
//                             // Initialize the database
//                             if let Err(e) = initialize_database(&pool).await {
//                                 println!("Database setup error: {}", e);
//                             } else {
//                                 println!("Database initialized successfully!");

//                                 // Add the pool to Tauri's state
//                                 handle.state::<tauri::AppHandle>().manage(pool);
//                             }
//                         }
//                         Err(e) => println!("Failed to connect to the database: {}", e),
//                     }
//                 });
//             });
//             Ok(())
//         })
//         .run(generate_context!())
//         .expect("Error while running Tauri application");
// }

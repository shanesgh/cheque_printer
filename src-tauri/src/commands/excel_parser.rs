use calamine::{Data, Reader, Xlsx};
use serde_json::json;
use std::io::Cursor;
use rand::Rng; // For random ID generation
use chrono::Utc;

#[tauri::command]
pub fn parse_excel_to_cheques(file_data: Vec<u8>, file_name: String) -> Result<String, String> {
    println!("Processing file: {}", file_name); // Print the file name
    let cursor: Cursor<Vec<u8>> = Cursor::new(file_data);

    let mut workbook: Xlsx<Cursor<Vec<u8>>> = Xlsx::new(cursor).map_err(|e| e.to_string())?;

    // Access the worksheet
    let mut records: Vec<serde_json::Map<String, serde_json::Value>> = Vec::new();
    let today: String = Utc::now().format("%Y-%m-%d").to_string();
    match workbook.worksheet_range("Sheet1") {
        Ok(range) => {
            for row in range.rows().skip(1) {
                let mut record: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
                let random_id: i32 = rand::thread_rng().gen_range(1000..999999);
                record.insert("cheque_id".to_string(), json!(random_id));
                record.insert("file_name".to_string(), json!(file_name.clone())); // Add file_name to the record
                record.insert("issue_date".to_string(), json!(today));
                record.insert("date".to_string(), json!(today));

                for (i, cell) in row.iter().enumerate() {
                    let key: &str = match i {
                        0 => "cheque_number",
                        1 => "amount",
                        2 => "client_name",
                        _ => "unknown",
                    };
                    let value: serde_json::Value = match cell {
                        Data::Float(f) => json!(f),
                        Data::Int(i) => json!(i),
                        Data::String(s) => json!(s),
                        _ => json!(null),
                    };
                    record.insert(key.to_string(), value);
                }
                records.push(record);
            }
            Ok(serde_json::to_string(&records).map_err(|e| e.to_string())?)
        }
        Err(e) => Err(format!("Failed to read the worksheet or range: {:?}", e)),
    }
}

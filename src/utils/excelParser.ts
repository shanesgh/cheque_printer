import * as XLSX from 'xlsx';
import { ExcelRowData } from '../types/claims';

export function parseExcelFile(file: File): Promise<ExcelRowData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON, skipping the header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip header row and parse data
        const parsedData: ExcelRowData[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row && row.length >= 3) {
            parsedData.push({
              check_number: String(row[0] || ''),
              amount: Number(row[1]) || 0,
              client_name: String(row[2] || ''),
            });
          }
        }
        
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + error));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

export function generateChequeId(): string {
  return `CHQ${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function getTodaysDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function calculateRequiredSignatures(amount: number): number {
  return amount <= 1500 ? 1 : 2;
}
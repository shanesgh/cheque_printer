import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet } from "lucide-react";
import { parseExcelFile, generateChequeId, getTodaysDate, calculateRequiredSignatures } from "@/utils/excelParser";
import { saveDocument } from "@/utils/documentStorage";
import { ClaimType, Status, ExcelRowData } from "@/types/claims";
import toast from "react-hot-toast";

interface FileUploadProps {
  onDataParsed: (data: ClaimType[]) => void;
}

export function FileUpload({ onDataParsed }: FileUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const loadingToast = toast.loading("Processing Excel file...");

    try {
      // Parse the Excel file
      const excelData: ExcelRowData[] = await parseExcelFile(file);
      
      if (excelData.length === 0) {
        toast.error("No data found in Excel file", { id: loadingToast });
        return;
      }

      // Convert to ClaimType format
      const claims: ClaimType[] = excelData.map((row) => ({
        cheque_id: generateChequeId(),
        check_number: row.check_number,
        amount: row.amount,
        client_name: row.client_name,
        todays_date: getTodaysDate(),
        issue_date: "",
        payee: "",
        status: Status.PENDING,
        required_signatures: calculateRequiredSignatures(row.amount),
        reason: "",
      }));

      // Save the original file to documents
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          saveDocument(file.name, e.target.result as ArrayBuffer);
        }
      };
      reader.readAsArrayBuffer(file);

      onDataParsed(claims);
      toast.success(`Successfully processed ${claims.length} claims`, { id: loadingToast });
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process Excel file. Please check the format.", { id: loadingToast });
    }
  }, [onDataParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-primary bg-primary/5' 
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center space-y-4">
        {isDragActive ? (
          <Upload className="h-12 w-12 text-primary" />
        ) : (
          <FileSpreadsheet className="h-12 w-12 text-gray-400" />
        )}
        <div>
          <p className="text-lg font-medium">
            {isDragActive ? "Drop the Excel file here" : "Upload Excel File"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Drag and drop an Excel file here, or click to select
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Expected columns: check_number, amount, client_name
          </p>
        </div>
      </div>
    </div>
  );
}
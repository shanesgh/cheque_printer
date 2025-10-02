import { FC, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { invoke } from "@tauri-apps/api/core";
import toast, { Toaster } from "react-hot-toast";
import { TaskTable } from "./tasktable";
import { columns } from "@/components/columns";
import { ChequeType } from "@/type";
import { useChequeStore } from "@/store/chequeStore";

const Basic: FC = () => {
  const [invokedExcelData, setInvokedExcelData] = useState<ChequeType[]>([]);
  const [excelDataArray, setExcelDataArray] = useState<ArrayBuffer | null>(
    null
  );
  const [filename, setFileName] = useState<String>("");
  const { clearActiveCheques } = useChequeStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Clear any existing active cheques when new file is uploaded
      clearActiveCheques();

      const file = acceptedFiles[0];
      setFileName(file.name);
      // Read the file as an ArrayBuffer
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = event.target?.result as ArrayBuffer;
        setExcelDataArray(data);

        // Send the file data to the Tauri backend
        console.log("Data,", data);
        const process_data: string = await invoke("parse_excel_to_cheques", {
          fileData: Array.from(new Uint8Array(data)),
          fileName: file.name,
        });
        let returnedData = JSON.parse(process_data);
        setInvokedExcelData(returnedData);
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true, // Disable the default click behavior
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  return (
    <div className="w-full">
      <Toaster position="top-right" reverseOrder={false} />

      <div
        {...getRootProps()}
        className="dropzone flex w-full h-[150px] mb-4 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors duration-200"
      >
        <input {...getInputProps()} id="dropzone-file" className="hidden" />
        <div
          onClick={open}
          className="flex flex-col items-center justify-center pb-2 pt-3"
        >
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-muted-foreground">
            XLSX, XLS (Excel files only)
          </p>
        </div>
      </div>
      {invokedExcelData.length > 0 ? (
        <TaskTable
          excelDataArray={excelDataArray}
          columns={columns}
          data={invokedExcelData}
          filename={filename}
        />
      ) : null}
    </div>
  );
};

export default Basic;

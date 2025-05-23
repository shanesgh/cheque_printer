import { FC, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { invoke } from "@tauri-apps/api/core";
import { TaskTable } from "./tasktable";
import { columns } from "@/components/columns";
import { ChequeType } from "@/type";

const Basic: FC = () => {
  const [invokedExcelData, setInvokedExcelData] = useState<ChequeType[]>([]);
  const [excelDataArray, setExcelDataArray] = useState<ArrayBuffer | null>(
    null
  );
  const [filename, setFileName] = useState<String>("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      // Read the file as an ArrayBuffer
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = event.target?.result as ArrayBuffer;
        setExcelDataArray(data);
        // Send the file data to the Tauri backend
        const process_data: string = await invoke("process_excel_file", {
          fileData: Array.from(new Uint8Array(data)),
          fileName: filename,
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
    <div className="">
      <div
        {...getRootProps()}
        className="dropzone flex w-[700px] h-[150px] m-4 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
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
          <p className="text-xs text-gray-500 dark:text-gray-400">
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

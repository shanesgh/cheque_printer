import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  ColumnDef,
  flexRender,
  SortingState,
  getSortedRowModel,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { invoke } from "@tauri-apps/api/core";
import { useChequeStore } from "@/store/chequeStore";
import { ChequeType } from "@/type";

type TaskTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  excelDataArray?: ArrayBuffer | null;
  filename: String;
};

export function TaskTable<TData, TValue>({
  columns,
  data,
  excelDataArray,
  filename,
}: TaskTableProps<TData, TValue>) {
  const { setActiveCheques, checkForDuplicates } = useChequeStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  // const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      pagination,
      columnFilters,
      rowSelection,
    },
  });

  // Reset row selection when new excel opened
  useEffect(() => {
    setRowSelection({});
  }, [data]);

  // saves unedited data as Array buffer to database.
  const handleSendForProcessing = async () => {
    if (excelDataArray) {
      try {
        // Check for duplicates before processing
        const chequeData = data as ChequeType[];
        const duplicates = checkForDuplicates();

        if (duplicates.length > 0) {
          toast.error(
            `Found ${duplicates.length} duplicate cheques. Please review before processing.`
          );
          return;
        }

        // Call the Tauri backend command
        const response: string = await invoke("process_blob", {
          data: Array.from(new Uint8Array(excelDataArray)),
          fileName: filename,
        });

        // Parse response to get document ID
        const responseData = JSON.parse(response);
        const documentId = responseData.document_id || Date.now(); // Fallback ID

        // Set active cheques in store
        setActiveCheques(chequeData, documentId, filename.toString());

        // Notify success
        toast.success("Excel sent for processing successfully!");
        console.log("Response from backend:", response);
      } catch (error) {
        // Handle errors from the backend
        console.error("Error saving file:", error);
        toast.error("Failed to send for processing. Please try again.");
      }
    } else {
      toast.error("No Excel data available to save.");
    }
  };

  return (
    <div className="">
      <div className=" flex items-center py-4">
        <Input
          placeholder="Filter payee..."
          value={
            (table.getColumn("client_name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("client_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm mr-4"
        />
        <div>
          <Button onClick={handleSendForProcessing} className="ml-2">
            Send for Processing
          </Button>
          <Toaster position="bottom-right" />
        </div>
      </div>
      <div className=" rounded-md border">
        <Table className="">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead className=" whitespace-nowrap " key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="whitespace-nowrap"
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-16 text-center"
                >
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center gap-2 p-4">
          <button
            className="border rounded p-1"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {">>"}
          </button>
          <span className="flex items-center gap-1">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </strong>
          </span>
          <span className="flex items-center gap-1">
            | Go to page:
            <input
              type="number"
              min="1"
              max={table.getPageCount()}
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
              className="border p-1 rounded w-16"
            />
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="border p-1 rounded"
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="p-4">
          Showing {table.getRowModel().rows.length} of {table.getRowCount()}{" "}
          Rows
        </div>
      </div>
    </div>
  );
}

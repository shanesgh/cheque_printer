import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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

  const handleSendForProcessing = async () => {
    if (!excelDataArray) {
      toast.error("No Excel data available to save");
      return;
    }

    try {
      const chequeData = data as ChequeType[];
      const duplicates = checkForDuplicates();

      if (duplicates.length > 0) {
        toast.error(`Found ${duplicates.length} duplicate cheques. Please review before processing.`);
        return;
      }

      const response: string = await invoke("process_blob", {
        data: Array.from(new Uint8Array(excelDataArray)),
        fileName: filename,
      });

      const responseData = JSON.parse(response);
      const documentId = responseData.document_id || Date.now();

      setActiveCheques(chequeData, documentId, filename.toString());

      toast.success("Excel file processed successfully");
    } catch (error: any) {
      const errorMsg = error?.toString() || "Failed to process file. Please try again.";
      console.error("Error saving file:", error);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
        <Input
          placeholder="Filter payee..."
          value={
            (table.getColumn("client_name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("client_name")?.setFilterValue(event.target.value)
          }
          className="w-full sm:max-w-sm"
        />
        <div>
          <Button onClick={handleSendForProcessing} className="w-full sm:w-auto">
            Send for Processing
          </Button>
        </div>
      </div>
      <div className="rounded-md border w-full overflow-x-auto">
        <Table className="w-full min-w-[600px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead className="whitespace-nowrap px-2 md:px-4" key={header.id}>
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
                  className="whitespace-nowrap hover:bg-muted/50"
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-2 md:px-4">
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
        <div className="flex flex-wrap items-center gap-2 p-4 text-sm">
          <button
            className="border rounded p-2 hover:bg-accent transition-colors"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}
          </button>
          <button
            className="border rounded p-2 hover:bg-accent transition-colors"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </button>
          <button
            className="border rounded p-2 hover:bg-accent transition-colors"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </button>
          <button
            className="border rounded p-2 hover:bg-accent transition-colors"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {">>"}
          </button>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </strong>
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap">
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
              className="border p-1 rounded w-16 bg-background"
            />
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="border p-1 rounded bg-background"
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="p-4 text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {table.getRowCount()}{" "}
          Rows
        </div>
      </div>
    </div>
  );
}

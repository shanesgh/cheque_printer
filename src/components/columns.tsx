import { ColumnDef } from "@tanstack/react-table";
import { ChequeType } from "../type";
import { ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { useChequeStore } from "@/store/chequeStore";
import { DatePicker } from "./datepicker"; // Import the date picker component

// Define the columns for TanStack Table
export const columns: ColumnDef<ChequeType>[] = [
  {
    accessorKey: "cheque_id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="justify-start h-auto p-0 font-normal"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cheque ID
          <ArrowUpDown className="ml-2" />
        </Button>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "cheque_number",
    header: "Cheque Number",
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="justify-start h-auto p-0 font-normal"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown className="ml-2" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "issue_date",
    header: "Issue Date",
    cell: ({ row }) => {
      const cheque = row.original;
      const { activeCheques, updateChequeIssueDate } = useChequeStore();

      const currentCheque =
        activeCheques.find((c) => c.cheque_id === cheque.cheque_id) || cheque;

      const handleDateChange = (newDate: string) => {
        if (cheque.cheque_id) {
          updateChequeIssueDate(cheque.cheque_id, newDate);
        }
      };

      return (
        <div className="w-40">
          <DatePicker
            value={currentCheque.issue_date || ""}
            onChange={handleDateChange}
            placeholder="Select date..."
            className="w-full"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "client_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="justify-start h-auto p-0 font-normal"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Payee
          <ArrowUpDown className="ml-2" />
        </Button>
      );
    },
  },
  {
    accessorKey: "required_signatures",
    header: "Required Signatures",
    cell: ({ row }) => {
      const value = row.getValue("amount") as number;
      const comparedValue = value > 1500 ? 2 : 1;
      return <div>{comparedValue}</div>;
    },
  },
];

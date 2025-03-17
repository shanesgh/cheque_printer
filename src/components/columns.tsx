import { ColumnDef } from "@tanstack/react-table";
import { ChequeType, Status } from "../type";
import { ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { useState } from "react";

// Define the columns for TanStack Table
export const columns: ColumnDef<ChequeType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        className=""
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className=""
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "cheque_id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cheque ID
          <ArrowUpDown className="" />
        </Button>
      );
    },
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
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className=" font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "issue_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Issue Date
          <ArrowUpDown className="" />
        </Button>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "client_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Payee
          <ArrowUpDown className="" />
        </Button>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          className=""
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status <ArrowUpDown className="" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const [status, setStatus] = useState<Status>(row.original.status);
      return (
        <select
          className="border p-1 rounded"
          value={status}
          onChange={(e) => {
            const newStatus = e.target.value as Status;
            setStatus(newStatus);
            return (row.original.status = newStatus);
          }}
        >
          <option value={Status.PENDING}>Pending</option>

          <option value={Status.APPROVED}>Approved</option>
          <option value={Status.DECLINED}>Declined</option>
        </select>
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
  {
    accessorKey: "current_signatures",
    header: "Current Signatures",
    cell: ({ row }) => {
      const value = row.getValue("current_signatures") as number | null;
      const comparedValue = value !== undefined ? value : 0;
      return <div>{comparedValue}</div>;
    },
  },
  {
    accessorKey: "first_signature_user_id",
    header: "First Signature User ID",
  },
  {
    accessorKey: "second_signature_user_id",
    header: "Second Signature User ID",
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
  },
];

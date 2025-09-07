export enum Status {
  APPROVED = "approved",
  PENDING = "pending",
  DECLINED = "declined",
}

export type ClaimType = {
  cheque_id: string;
  check_number: string;
  amount: number;
  client_name: string;
  todays_date: string;
  issue_date: string;
  payee: string;
  status: Status;
  required_signatures: number;
  reason: string;
}

export type ExcelRowData = {
  check_number: string;
  amount: number;
  client_name: string;
}

export type SavedDocument = {
  id: string;
  fileName: string;
  uploadDate: string;
  data: ArrayBuffer;
}
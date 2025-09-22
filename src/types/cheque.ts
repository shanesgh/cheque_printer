export enum Status {
  APPROVED = "Approved",
  DECLINED = "Declined", 
  PENDING = "Pending",
}

export type ChequeType = {
  cheque_number: string;
  amount: number;
  client_name: string;
  cheque_id?: number;
  date?: string;
  issue_date?: string;
  status: Status;
  required_signatures?: number;
  current_signatures?: number;
  first_signature_user_id?: number | null;
  second_signature_user_id?: number | null;
  remarks?: string;
  document_id?: number;
  created_at?: string;
  updated_at?: string;
};

export type ChequeWithDocument = {
  document_id: number;
  file_name: string;
  created_at: string;
  cheque_id?: number;
  cheque_number?: string;
  amount?: number;
  client_name?: string;
  status?: string;
  issue_date?: string;
  date_field?: string;
  remarks?: string;
  current_signatures?: number;
  first_signature_user_id?: number;
};
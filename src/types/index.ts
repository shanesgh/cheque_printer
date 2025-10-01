export * from './user';
export * from './cheque';
export * from './navigation';
export * from './audit';
export * from './settings';

export interface ChequeData {
  cheque_id: number;
  document_id: number;
  file_name: string;
  created_at: string;
  cheque_number: string;
  amount: number;
  client_name: string;
  status: string;
  issue_date?: string;
  date?: string;
  remarks?: string;
  current_signatures?: number;
  first_signature_user_id?: number;
  second_signature_user_id?: number;
  print_count?: number;
  is_locked?: boolean;
}
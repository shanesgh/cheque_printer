export type AuditTrail = {
  id: number;
  cheque_id: number;
  action_type: 'uploaded' | 'status_changed' | 'signed' | 'approved' | 'declined' | 'created' | 'updated';
  old_value?: string;
  new_value?: string;
  user_id: number;
  user_name: string;
  timestamp: string;
  notes?: string;
  ip_address?: string;
  user_agent?: string;
};

export type AuditFilter = {
  cheque_id?: number;
  user_id?: number;
  action_type?: string;
  date_from?: string;
  date_to?: string;
};
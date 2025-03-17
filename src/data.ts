import { UserType, UserRole, ChequeType, Status } from "./type";

export const users: UserType[] = [
  {
    user_id: 1,

    password_hash: "hashed_password_1",
    role: UserRole.CEO,
    email: "ceo@example.com",
    first_name: "John",
    last_name: "Doe",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    user_id: 2,

    password_hash: "hashed_password_2",
    role: UserRole.Manager,
    email: "manager@example.com",
    first_name: "Jane",
    last_name: "Smith",
    created_at: "2023-01-02T00:00:00Z",
    updated_at: "2023-01-02T00:00:00Z",
  },
  {
    user_id: 3,

    password_hash: "hashed_password_3",
    role: UserRole.Supervisor,
    email: "supervisor@example.com",
    first_name: "Alice",
    last_name: "Johnson",
    created_at: "2023-01-03T00:00:00Z",
    updated_at: "2023-01-03T00:00:00Z",
  },
  {
    user_id: 4,

    password_hash: "hashed_password_4",
    role: UserRole.Accountant,
    email: "accountant@example.com",
    first_name: "Bob",
    last_name: "Brown",
    created_at: "2023-01-04T00:00:00Z",
    updated_at: "2023-01-04T00:00:00Z",
  },
];

export const cheques: ChequeType[] = [
  {
    cheque_id: 1,
    cheque_number: "CHQ1001",
    amount: 2000.5,
    issue_date: "2023-02-01",
    date: "2023-02-15",
    client_name: "Client A",
    status: Status.PENDING,
    required_signatures: 1,
    current_signatures: 0,
    first_signature_user_id: null,
    second_signature_user_id: null,
    remarks: "Urgent",
  },
  {
    cheque_id: 2,
    cheque_number: "CHQ1002",
    amount: 500.0,
    issue_date: "2023-02-02",
    date: "2023-02-16",
    client_name: "Client B",
    status: Status.PENDING,
    required_signatures: 1,
    current_signatures: 0,
    first_signature_user_id: null,
    second_signature_user_id: null,
    remarks: "Standard",
  },
  {
    cheque_id: 3,
    cheque_number: "CHQ1003",
    amount: 17000.0,
    issue_date: "2023-02-03",
    date: "2023-02-17",
    client_name: "Client C",
    status: Status.PENDING,
    required_signatures: 2,
    current_signatures: 1,
    first_signature_user_id: 2,
    second_signature_user_id: null,
    remarks: "High value",
  },
  {
    cheque_id: 4,
    cheque_number: "CHQ1004",
    amount: 8000.0,
    issue_date: "2023-02-04",
    date: "2023-02-18",
    client_name: "Client D",
    status: Status.APPROVED,
    required_signatures: 1,
    current_signatures: 1,
    first_signature_user_id: 3,
    second_signature_user_id: null,
    remarks: "Standard",
  },
  {
    cheque_id: 5,
    cheque_number: "CHQ1005",
    amount: 25000.0,
    issue_date: "2023-02-05",
    date: "2023-02-19",
    client_name: "Client E",
    status: Status.DECLINED,
    required_signatures: 2,
    current_signatures: 0,
    first_signature_user_id: null,
    second_signature_user_id: null,
    remarks: "Very high value",
  },
  {
    cheque_id: 6,
    cheque_number: "CHQ1006",
    amount: 950.0,
    issue_date: "2023-02-06",
    date: "2023-02-20",
    client_name: "Client F",
    status: Status.APPROVED,
    required_signatures: 1,
    current_signatures: 0,
    first_signature_user_id: null,
    second_signature_user_id: null,
    remarks: "Standard",
  },
  {
    cheque_id: 7,
    cheque_number: "CHQ1007",
    amount: 12300.0,
    issue_date: "2023-02-07",
    date: "2023-02-21",
    client_name: "Client G",
    status: Status.DECLINED,
    required_signatures: 1,
    current_signatures: 1,
    first_signature_user_id: 2,
    second_signature_user_id: null,
    remarks: "Standard",
  },
  {
    cheque_id: 8,
    cheque_number: "CHQ1008",
    amount: 6000.0,
    issue_date: "2023-02-08",
    date: "2023-02-22",
    client_name: "Client H",
    status: Status.DECLINED,
    required_signatures: 1,
    current_signatures: 1,
    first_signature_user_id: 4,
    second_signature_user_id: null,
    remarks: "Standard",
  },
  {
    cheque_id: 9,
    cheque_number: "CHQ1009",
    amount: 18000.0,
    issue_date: "2023-02-09",
    date: "2023-02-23",
    client_name: "Client I",
    status: Status.PENDING,
    required_signatures: 2,
    current_signatures: 1,
    first_signature_user_id: 3,
    second_signature_user_id: null,
    remarks: "High value",
  },
  {
    cheque_id: 10,
    cheque_number: "CHQ1010",
    amount: 7000.0,
    issue_date: "2023-02-10",
    date: "2023-02-24",
    client_name: "Client J",
    status: Status.PENDING,
    required_signatures: 1,
    current_signatures: 0,
    first_signature_user_id: null,
    second_signature_user_id: null,
    remarks: "Standard",
  },
  {
    cheque_id: 11,
    cheque_number: "CHQ1011",
    amount: 2000.5,
    issue_date: "2023-02-01",
    date: "2023-02-15",
    client_name: "Client B",
    status: Status.PENDING,
    required_signatures: 1,
    current_signatures: 0,
    first_signature_user_id: null,
    second_signature_user_id: null,
    remarks: "Urgent",
  },
];

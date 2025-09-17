import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, FileText, CheckCircle, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/analysis")({
  component: RouteComponent,
});

interface ChequeData {
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
}

function RouteComponent() {
  const [allCheques, setAllCheques] = useState<ChequeData[]>([]);
  const [filteredCheques, setFilteredCheques] = useState<ChequeData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAllCheques = async () => {
    try {
      const response = await invoke<string>("get_all_cheques");
      const data = JSON.parse(response);
      setAllCheques(data.cheques);
      setFilteredCheques(data.cheques);
    } catch (error) {
      console.error("Failed to fetch cheques:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (chequeId: number, newStatus: string) => {
    try {
      await invoke("update_cheque_status", { chequeId, newStatus });
      const updated = allCheques.map(c => 
        c.cheque_id === chequeId ? { ...c, status: newStatus } : c
      );
      setAllCheques(updated);
      setFilteredCheques(updated.filter(c => matchesSearch(c, searchQuery)));
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const matchesSearch = (cheque: ChequeData, query: string) => {
    const q = query.toLowerCase();
    return cheque.file_name.toLowerCase().includes(q) ||
           cheque.client_name.toLowerCase().includes(q) ||
           cheque.amount.toString().includes(q) ||
           cheque.cheque_number.toLowerCase().includes(q);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilteredCheques(allCheques.filter(c => matchesSearch(c, query)));
  };

  const stats = {
    total: allCheques.length,
    approved: allCheques.filter(c => c.status === 'Approved').length,
    denied: allCheques.filter(c => c.status === 'Declined').length,
    pending: allCheques.filter(c => c.status === 'Pending').length,
  };

  const uniqueFiles = [...new Set(allCheques.map(c => c.file_name))];

  useEffect(() => {
    fetchAllCheques();
  }, []);

  if (loading) {
    return (
      <div className="ml-[280px] flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading analysis data...</div>
      </div>
    );
  }

  return (
    <div className="ml-[280px] p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Analysis</h1>
            <p className="text-gray-600 mt-1">All uploaded Excel files across the system</p>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {stats.pending} Pending
          </Badge>
        </div>
      </div>

      <div className="relative w-96 mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search files, clients, or amounts..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cheques</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Across {uniqueFiles.length} files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.denied}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.denied / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Cheques ({filteredCheques.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCheques.map((cheque) => (
              <div
                key={cheque.cheque_id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  cheque.status === 'Approved' ? 'bg-green-50 border-green-200' :
                  cheque.status === 'Declined' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{cheque.client_name}</p>
                      <p className="text-sm text-gray-500">#{cheque.cheque_number}</p>
                    </div>
                    <div>
                      <p className="font-semibold">${cheque.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{cheque.file_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {new Date(cheque.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <select
                  value={cheque.status}
                  onChange={(e) => handleStatusChange(cheque.cheque_id, e.target.value)}
                  disabled={cheque.status === 'Approved'}
                  className={`border rounded px-3 py-1 text-sm ${
                    cheque.status === 'Approved' 
                      ? 'bg-gray-100 cursor-not-allowed' 
                      : 'bg-white cursor-pointer'
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
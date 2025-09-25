import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { ChequeData } from "@/types";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const [cheques, setCheques] = useState<ChequeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCheques, setSelectedCheques] = useState<Set<number>>(new Set());
  const [previousStates, setPreviousStates] = useState<Map<number, string>>(new Map());
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchCheques = async () => {
    try {
      const response = await invoke<string>("get_all_cheques");
      const data = JSON.parse(response);
      setCheques(data.cheques || []);
      
      // Store initial states as previous states
      const states = new Map();
      data.cheques?.forEach((c: ChequeData) => {
        states.set(c.cheque_id, c.status === 'Approved' ? 'Pending' : c.status);
      });
      setPreviousStates(states);
    } catch (error) {
      console.error("Failed to fetch cheques:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateChequeStatus = async (chequeId: number, newStatus: string, remarks?: string) => {
    try {
      await invoke("update_cheque_status", { 
        chequeId, 
        newStatus,
        ...(remarks && { remarks })
      });
      
      setCheques(prev => prev.map(c => {
        if (c.cheque_id === chequeId) {
          const updated = { 
            ...c, 
            status: newStatus,
            ...(remarks && { remarks }),
            ...(newStatus === 'Approved' && { 
              current_signatures: 1, 
              first_signature_user_id: 1 
            })
          };
          
          // Update previous state
          if (newStatus !== 'Approved') {
            setPreviousStates(prev => new Map(prev.set(chequeId, newStatus)));
          }
          
          return updated;
        }
        return c;
      }));
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleCheckboxChange = (chequeId: number, checked: boolean) => {
    const cheque = cheques.find(c => c.cheque_id === chequeId);
    if (!cheque) return;

    if (checked) {
      setSelectedCheques(prev => new Set(prev.add(chequeId)));
      if (cheque.status !== 'Approved') {
        updateChequeStatus(chequeId, 'Approved');
      }
    } else {
      setSelectedCheques(prev => {
        const newSet = new Set(prev);
        newSet.delete(chequeId);
        return newSet;
      });
      
      const previousState = previousStates.get(chequeId) || 'Pending';
      if (cheque.status === 'Approved') {
        updateChequeStatus(chequeId, previousState);
      }
    }
  };

  const handleMasterSelect = (checked: boolean) => {
    const filteredCheques = getFilteredCheques();
    
    if (checked) {
      // Approve all
      const newSelected = new Set(selectedCheques);
      filteredCheques.forEach(cheque => {
        newSelected.add(cheque.cheque_id);
        if (cheque.status !== 'Approved') {
          updateChequeStatus(cheque.cheque_id, 'Approved');
        }
      });
      setSelectedCheques(newSelected);
    } else {
      // Revert all to previous state
      filteredCheques.forEach(cheque => {
        const previousState = previousStates.get(cheque.cheque_id) || 'Pending';
        if (cheque.status === 'Approved') {
          updateChequeStatus(cheque.cheque_id, previousState);
        }
      });
      setSelectedCheques(new Set());
    }
  };

  const handleStatusChange = (chequeId: number, newStatus: string) => {
    if (newStatus === 'Declined') {
      const remarks = prompt("Please provide a reason for declining:");
      if (!remarks?.trim()) return;
      updateChequeStatus(chequeId, newStatus, remarks);
    } else {
      updateChequeStatus(chequeId, newStatus);
    }
  };

  const getFilteredCheques = () => {
    if (!searchQuery) return cheques;
    const q = searchQuery.toLowerCase();
    return cheques.filter(c => 
      c.client_name.toLowerCase().includes(q) ||
      c.cheque_number.toLowerCase().includes(q) ||
      c.amount.toString().includes(q) ||
      c.cheque_id.toString().includes(q)
    );
  };

  const getStatusFilteredCheques = () => {
    const filtered = getFilteredCheques();
    if (statusFilter === 'all') return filtered;
    return filtered.filter(c => c.status.toLowerCase() === statusFilter.toLowerCase());
  };

  const getRowColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-50 border-green-200';
      case 'Declined': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const stats = {
    total: cheques.length,
    approved: cheques.filter(c => c.status === 'Approved').length,
    declined: cheques.filter(c => c.status === 'Declined').length,
    pending: cheques.filter(c => c.status === 'Pending').length,
  };

  const filteredCheques = getStatusFilteredCheques();
  const allSelected = filteredCheques.length > 0 && filteredCheques.every(c => selectedCheques.has(c.cheque_id));
  const someSelected = filteredCheques.some(c => selectedCheques.has(c.cheque_id));

  useEffect(() => {
    fetchCheques();
  }, []);

  if (loading) {
    return (
      <div className="ml-[280px] flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="ml-[280px] p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analysis</h1>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-4">
        <Input
          placeholder="Search cheques..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <Button>Print Cheques</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('all')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('approved')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {stats.approved}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('declined')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {stats.declined}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('pending')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {stats.pending}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleMasterSelect}
                    />
                  </th>
                  <th className="p-3 text-left">Client</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Cheque ID</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheques.map((cheque) => (
                  <tr key={cheque.cheque_id} className={`border-b ${getRowColor(cheque.status)}`}>
                    <td className="p-3">
                      <Checkbox
                        checked={selectedCheques.has(cheque.cheque_id)}
                        onCheckedChange={(checked) => handleCheckboxChange(cheque.cheque_id, !!checked)}
                      />
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{cheque.client_name}</div>
                        <div className="text-sm text-gray-500">#{cheque.cheque_number}</div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold">
                      ${cheque.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-sm">
                      {cheque.date || cheque.issue_date || 'N/A'}
                    </td>
                    <td className="p-3 text-sm">
                      {cheque.cheque_id}
                    </td>
                    <td className="p-3">
                      <select
                        value={cheque.status}
                        onChange={(e) => handleStatusChange(cheque.cheque_id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm bg-white"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Declined">Declined</option>
                      </select>
                    </td>
                    <td className="p-3">
                      {cheque.status === 'Declined' ? (
                        <div className="text-sm text-red-600">{cheque.remarks || 'No reason provided'}</div>
                      ) : (
                        <Input
                          placeholder="Add remarks..."
                          defaultValue={cheque.remarks || ''}
                          className="text-sm h-8"
                          onBlur={(e) => {
                            if (e.target.value !== (cheque.remarks || '')) {
                              updateChequeStatus(cheque.cheque_id, cheque.status, e.target.value);
                            }
                          }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
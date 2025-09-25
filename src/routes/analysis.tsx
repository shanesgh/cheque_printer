import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, TrendingUp, Clock, Search, Eye } from "lucide-react";

export const Route = createFileRoute("/analysis")({
  component: RouteComponent,
});

import { ChequeData } from "@/types";

function RouteComponent() {
  const [cheques, setCheques] = useState<ChequeData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCheque, setSelectedCheque] = useState<number | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCheques = async () => {
    try {
      const response = await invoke<string>("get_all_cheques");
      const data = JSON.parse(response);
      setCheques(data.cheques || []);
    } catch (error) {
      console.error("Failed to fetch cheques:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCheques = () => {
    if (!searchQuery) return cheques;
    const q = searchQuery.toLowerCase();
    return cheques.filter(c => 
      c.client_name.toLowerCase().includes(q) ||
      c.cheque_number.toLowerCase().includes(q) ||
      c.amount.toString().includes(q) ||
      (c.date && c.date.includes(q)) ||
      (c.issue_date && c.issue_date.includes(q))
    );
  };

  const getAnalytics = () => {
    const now = new Date();
    const thisMonth = cheques.filter(c => {
      const date = new Date(c.created_at);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    const highValue = cheques.filter(c => c.amount > 10000);
    const avgProcessingTime = "2.3 days"; // Mock data
    
    return {
      monthlyTotal: thisMonth.reduce((sum, c) => sum + c.amount, 0),
      monthlyCount: thisMonth.length,
      highValueCount: highValue.length,
      avgProcessingTime
    };
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
            ...(remarks && { remarks })
          };
          
          return updated;
        }
        return c;
      }));
    } catch (error) {
      console.error("Failed to update cheque status:", error);
    }
  };

  const analytics = getAnalytics();
  const filteredCheques = getFilteredCheques();

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
    <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monthly Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.monthlyTotal.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">{analytics.monthlyCount} cheques</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              High Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.highValueCount}</div>
            <div className="text-sm text-gray-500">&gt; $10,000</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgProcessingTime}</div>
            <div className="text-sm text-gray-500">processing time</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.monthlyCount}</div>
            <div className="text-sm text-gray-500">new cheques</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by date, cheque number, or payee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Cheques Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[100px]">Cheque #</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[120px]">Payee</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[100px]">Amount</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[80px]">Date</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[80px]">Status</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheques.map((cheque) => (
                  <tr key={cheque.cheque_id} className="border-b hover:bg-gray-50">
                    <td className="p-2 md:p-3 font-mono text-xs md:text-sm">{cheque.cheque_number}</td>
                    <td className="p-2 md:p-3 text-xs md:text-sm">{cheque.client_name}</td>
                    <td className="p-2 md:p-3 font-semibold text-xs md:text-sm">
                      ${cheque.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 md:p-3 text-xs md:text-sm">
                      {cheque.date || cheque.issue_date || 'N/A'}
                    </td>
                    <td className="p-2 md:p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cheque.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        cheque.status === 'Declined' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cheque.status}
                      </span>
                    </td>
                    <td className="p-2 md:p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCheque(cheque.cheque_id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
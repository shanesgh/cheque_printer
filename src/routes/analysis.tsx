import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Search, TriangleAlert as AlertTriangle, Target, Download } from "lucide-react";

export const Route = createFileRoute("/analysis")({
  component: RouteComponent,
});

import { ChequeData } from "@/types";

function RouteComponent() {
  const [cheques, setCheques] = useState<ChequeData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCheque, setSelectedCheque] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChart, setSelectedChart] = useState("table");
  const [queryResult, setQueryResult] = useState<any>(null);

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

  const getAnalytics = () => {
    const now = new Date();
    const thisMonth = cheques.filter(c => {
      const date = new Date(c.created_at);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    const highValue = cheques.filter(c => c.amount > 10000);
    const pendingApproval = cheques.filter(c => c.status === 'Pending');
    const flaggedCheques = cheques.filter(c => c.amount > 50000);
    
    return {
      monthlyTotal: thisMonth.reduce((sum, c) => sum + c.amount, 0),
      monthlyCount: thisMonth.length,
      highValueCount: highValue.length,
      pendingApproval: pendingApproval.length,
      flaggedCheques: flaggedCheques.length,
      avgChequeValue: cheques.length ? cheques.reduce((sum, c) => sum + c.amount, 0) / cheques.length : 0
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // TODO: Integrate with Ollama/Phi-3 Mini
    // This would send the query to the local model
    // The model would generate SQL and return results
    console.log("Searching:", searchQuery);
    
    // Placeholder for now
    setQueryResult({
      data: cheques.slice(0, 5),
      query: searchQuery,
      sql: "SELECT * FROM cheques LIMIT 5"
    });
  };

  const exportData = (format: 'excel' | 'pdf') => {
    if (!queryResult) return;
    
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}:`, queryResult);
  };

  const analytics = getAnalytics();

  useEffect(() => {
    fetchCheques();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 bg-background min-h-screen w-full">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Analytics Dashboard</h1>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              Avg Cheque Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.avgChequeValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
            <div className="text-sm text-gray-500">average amount</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingApproval}</div>
            <div className="text-sm text-gray-500">awaiting approval</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Flagged Cheques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.flaggedCheques}</div>
            <div className="text-sm text-gray-500"> $50,000</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex gap-4 items-center w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Ask about your data: 'How many payments in 2023?' or 'Total amount by client'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
          <select
            className="border rounded-md px-3 py-2 bg-background text-sm min-w-[150px]"
            value={selectedChart}
            onChange={(e) => setSelectedChart(e.target.value)}
          >
            <option value="table">Table View</option>
            <option value="pie">Pie Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="area">Area Chart</option>
            <option value="donut">Donut Chart</option>
            <option value="histogram">Histogram</option>
            <option value="heatmap">Heat Map</option>
            <option value="treemap">Tree Map</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {queryResult && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Query Results</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportData('excel')}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportData('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Query: {queryResult.query}</p>
              <p className="text-xs text-muted-foreground mt-1">SQL: {queryResult.sql}</p>
            </div>
            
            {selectedChart === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left text-sm">Client</th>
                      <th className="p-2 text-left text-sm">Amount</th>
                      <th className="p-2 text-left text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.data.map((item: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 text-sm">{item.client_name}</td>
                        <td className="p-2 text-sm">${item.amount?.toLocaleString()}</td>
                        <td className="p-2 text-sm">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <p className="text-muted-foreground">
                  {selectedChart.charAt(0).toUpperCase() + selectedChart.slice(1)} chart visualization will be implemented here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
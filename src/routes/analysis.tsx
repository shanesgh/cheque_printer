import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { OllamaService } from "@/services/ollamaService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Loader as Loader2, DollarSign, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Route = createFileRoute("/analysis")({
  component: RouteComponent,
});

import { ChequeData } from "@/types";

function RouteComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState("pie");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [cheques, setCheques] = useState<ChequeData[]>([]);
  const ollamaService = new OllamaService();

  const fetchCheques = async () => {
    setLoading(true);
    try {
      const response = await invoke<string>("get_all_cheques");
      const data = JSON.parse(response);
      setCheques(data);
    } catch (error) {
      console.error("Failed to fetch cheques:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAnalytics = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyData = cheques.filter(c => {
      const chequeDate = new Date(c.date);
      return chequeDate.getMonth() === currentMonth && chequeDate.getFullYear() === currentYear;
    });
    
    const monthlyTotal = monthlyData.reduce((sum, c) => sum + c.amount, 0);
    const monthlyCount = monthlyData.length;
    const avgChequeValue = cheques.length > 0 ? cheques.reduce((sum, c) => sum + c.amount, 0) / cheques.length : 0;
    const pendingApproval = cheques.filter(c => c.status === 'pending').length;
    const flaggedCheques = cheques.filter(c => c.amount > 50000).length;
    
    return {
      monthlyTotal,
      monthlyCount,
      avgChequeValue,
      pendingApproval,
      flaggedCheques
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
    
    setLoading(true);
    try {
      const sql = await ollamaService.generateSQL(searchQuery);
      const response = await invoke<string>("execute_dynamic_query", { sqlQuery: sql });
      const data = JSON.parse(response);
      
      setQueryResult({
        data,
        query: searchQuery,
        sql
      });
    } catch (error) {
      console.error("Query failed:", error);
      setQueryResult({ error: "Query failed" });
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format: 'excel' | 'pdf') => {
    if (!queryResult?.data) return;
    
    const dataStr = JSON.stringify(queryResult.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-result.${format === 'excel' ? 'json' : 'json'}`;
    a.click();
  };

  const renderChart = () => {
    if (!queryResult?.data || queryResult.data.length === 0) return null;

    const data = queryResult.data;
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

    switch (selectedChart) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey={Object.keys(data[0] || {})[1] || 'value'}
                label
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={Object.keys(data[0] || {})[0] || 'name'} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={Object.keys(data[0] || {})[1] || 'value'} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  {Object.keys(data[0] || {}).map((key) => (
                    <th key={key} className="p-2 text-left text-sm">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item: any, index: number) => (
                  <tr key={index} className="border-b">
                    {Object.values(item).map((value: any, i: number) => (
                      <td key={i} className="p-2 text-sm">{String(value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
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
              disabled={loading}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
          <select
            className="border rounded-md px-3 py-2 bg-background text-sm min-w-[150px]"
            value={selectedChart}
            onChange={(e) => setSelectedChart(e.target.value)}
          >
            <option value="table">Table</option>
            <option value="pie">Pie Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="donut">Donut Chart</option>
            <option value="histogram">Histogram</option>
            <option value="treemap">Tree Map</option>
            <option value="heatmap">Heat Map</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Processing query...</span>
          </div>
        </div>
      )}

      {/* Results */}
      {queryResult && !loading && (
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
            
            {queryResult.error ? (
              <div className="text-red-500 p-4 text-center">{queryResult.error}</div>
            ) : (
              renderChart()
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
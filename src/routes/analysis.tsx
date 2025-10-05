import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, TrendingUp, DollarSign, Users, FileText, CircleCheck as CheckCircle, Circle as XCircle, Clock, Printer, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, subMonths } from 'date-fns';
import noDataImage from '@/assets/cq6QnU2UR9GdEBaT-35qUw.webp';

export const Route = createFileRoute("/analysis")({
  component: RouteComponent,
});

interface ChequeAnalytics {
  cheque_id: number;
  cheque_number: string;
  amount: number;
  client_name: string;
  status: string;
  issue_date: string;
  print_count?: number;
  handler?: string;
  created_at: string;
}

type DateFilter = 'all' | 'day' | 'month' | 'year' | 'custom';
type AnalyticsCategory = 'total-cheques' | 'avg-amount' | 'amount-by-month' | 'top-clients' | 'approval-rate' | 'pending-approvals' | 'high-value' | 'declined-analysis' | 'print-status' | 'approved-vs-declined' | 'unsigned-high-value' | 'cheques-by-handler';

type SortDirection = 'asc' | 'desc' | null;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function RouteComponent() {
  const [selectedCategory, setSelectedCategory] = useState<AnalyticsCategory>('total-cheques');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [cheques, setCheques] = useState<ChequeAnalytics[]>([]);
  const [filteredData, setFilteredData] = useState<ChequeAnalytics[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof ChequeAnalytics | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const categories = [
    { id: 'total-cheques' as AnalyticsCategory, label: 'Total Cheques Processed', icon: FileText },
    { id: 'avg-amount' as AnalyticsCategory, label: 'Average Cheque Amount', icon: TrendingUp },
    { id: 'amount-by-month' as AnalyticsCategory, label: 'Total Amount by Month', icon: DollarSign },
    { id: 'top-clients' as AnalyticsCategory, label: 'Top Clients by Amount', icon: Users },
    { id: 'approval-rate' as AnalyticsCategory, label: 'Approval Rate', icon: CheckCircle },
    { id: 'pending-approvals' as AnalyticsCategory, label: 'Pending Approvals', icon: Clock },
    { id: 'high-value' as AnalyticsCategory, label: 'High Value Cheques (>$1500)', icon: DollarSign },
    { id: 'declined-analysis' as AnalyticsCategory, label: 'Declined Cheques Analysis', icon: XCircle },
    { id: 'print-status' as AnalyticsCategory, label: 'Print Status Overview', icon: Printer },
    { id: 'approved-vs-declined' as AnalyticsCategory, label: 'Approved vs Declined Amounts', icon: TrendingUp },
    { id: 'unsigned-high-value' as AnalyticsCategory, label: 'Unsigned High-Value Cheques', icon: FileText },
    { id: 'cheques-by-handler' as AnalyticsCategory, label: 'Cheques Approved by Handler', icon: Users },
  ];

  useEffect(() => {
    const fetchCheques = async () => {
      setLoading(true);
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

    fetchCheques();
  }, []);

  const getDateFilteredData = useMemo(() => {
    let data = [...cheques];
    const now = new Date();

    if (dateFilter === 'day') {
      const today = format(now, 'yyyy-MM-dd');
      data = data.filter(c => c.issue_date === today);
    } else if (dateFilter === 'month') {
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);
      data = data.filter(c => {
        const chequeDate = parseISO(c.issue_date);
        return isWithinInterval(chequeDate, { start, end });
      });
    } else if (dateFilter === 'year') {
      const start = startOfYear(now);
      const end = endOfYear(now);
      data = data.filter(c => {
        const chequeDate = parseISO(c.issue_date);
        return isWithinInterval(chequeDate, { start, end });
      });
    } else if (dateFilter === 'custom' && customDateFrom && customDateTo) {
      data = data.filter(c => {
        const chequeDate = parseISO(c.issue_date);
        return isWithinInterval(chequeDate, { start: customDateFrom, end: customDateTo });
      });
    }

    return data;
  }, [cheques, dateFilter, selectedMonth, customDateFrom, customDateTo]);

  const chartData = useMemo(() => {
    const data = getDateFilteredData;
    const now = new Date();
    const twelveMonthsAgo = subMonths(now, 11);

    switch (selectedCategory) {
      case 'total-cheques':
        return { value: data.length, type: 'number' };

      case 'avg-amount':
        return { value: data.length ? data.reduce((sum, c) => sum + c.amount, 0) / data.length : 0, type: 'currency' };

      case 'amount-by-month':
        const limitedData = dateFilter === 'all' || dateFilter === 'year'
          ? data.filter(c => {
              const chequeDate = parseISO(c.issue_date);
              return chequeDate >= twelveMonthsAgo;
            })
          : data;

        const amountByMonth = limitedData.reduce((acc, c) => {
          const month = format(parseISO(c.issue_date), 'MMM yyyy');
          acc[month] = (acc[month] || 0) + c.amount;
          return acc;
        }, {} as Record<string, number>);
        return { data: Object.entries(amountByMonth).map(([name, value]) => ({ name, value })), type: 'line' };

      case 'top-clients':
        const clientAmounts = data.reduce((acc, c) => {
          acc[c.client_name] = (acc[c.client_name] || 0) + c.amount;
          return acc;
        }, {} as Record<string, number>);
        return {
          data: Object.entries(clientAmounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name, value]) => ({ name, value })),
          type: 'bar'
        };

      case 'approval-rate':
        const approved = data.filter(c => c.status === 'Approved').length;
        const declined = data.filter(c => c.status === 'Declined').length;
        const total = approved + declined;
        return {
          data: [
            { name: 'Approved', value: approved },
            { name: 'Declined', value: declined },
          ],
          type: 'pie',
          percentage: total ? ((approved / total) * 100).toFixed(1) : 0
        };

      case 'pending-approvals':
        const pending = data.filter(c => c.status === 'Pending');
        return {
          value: pending.length,
          amount: pending.reduce((sum, c) => sum + c.amount, 0),
          type: 'number'
        };

      case 'high-value':
        const highValue = data.filter(c => c.amount > 1500);
        return {
          value: highValue.length,
          amount: highValue.reduce((sum, c) => sum + c.amount, 0),
          type: 'number'
        };

      case 'declined-analysis':
        const declinedCheques = data.filter(c => c.status === 'Declined');
        return {
          value: declinedCheques.length,
          amount: declinedCheques.reduce((sum, c) => sum + c.amount, 0),
          type: 'number'
        };

      case 'print-status':
        const printed = data.filter(c => c.print_count && c.print_count > 0).length;
        const unprinted = data.length - printed;
        return {
          data: [
            { name: 'Printed', value: printed },
            { name: 'Unprinted', value: unprinted },
          ],
          type: 'pie'
        };

      case 'approved-vs-declined':
        const approvedAmount = data.filter(c => c.status === 'Approved').reduce((sum, c) => sum + c.amount, 0);
        const declinedAmount = data.filter(c => c.status === 'Declined').reduce((sum, c) => sum + c.amount, 0);
        return {
          data: [
            { name: 'Approved', value: approvedAmount },
            { name: 'Declined', value: declinedAmount },
          ],
          type: 'bar'
        };

      case 'unsigned-high-value':
        const unsigned = data.filter(c => c.amount > 1500 && (!c.print_count || c.print_count === 0));
        return {
          value: unsigned.length,
          amount: unsigned.reduce((sum, c) => sum + c.amount, 0),
          type: 'number'
        };

      case 'cheques-by-handler':
        const handlerCounts = data
          .filter(c => c.status === 'Approved' && c.handler)
          .reduce((acc, c) => {
            acc[c.handler!] = (acc[c.handler!] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        return {
          data: Object.entries(handlerCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value]) => ({ name, value })),
          type: 'bar'
        };

      default:
        return { value: 0, type: 'number' };
    }
  }, [selectedCategory, getDateFilteredData, dateFilter]);

  useEffect(() => {
    const filtered = getDateFilteredData;

    switch (selectedCategory) {
      case 'pending-approvals':
        setFilteredData(filtered.filter(c => c.status === 'Pending'));
        break;
      case 'high-value':
        setFilteredData(filtered.filter(c => c.amount > 1500));
        break;
      case 'declined-analysis':
        setFilteredData(filtered.filter(c => c.status === 'Declined'));
        break;
      case 'unsigned-high-value':
        setFilteredData(filtered.filter(c => c.amount > 1500 && (!c.print_count || c.print_count === 0)));
        break;
      case 'cheques-by-handler':
        setFilteredData(filtered.filter(c => c.status === 'Approved' && c.handler));
        break;
      default:
        setFilteredData(filtered);
    }
  }, [selectedCategory, getDateFilteredData]);

  const handleCategoryChange = (category: AnalyticsCategory) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSort = (column: keyof ChequeAnalytics) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedAndFilteredData = useMemo(() => {
    let data = filteredData;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(c =>
        c.client_name.toLowerCase().includes(query) ||
        c.cheque_number.toLowerCase().includes(query) ||
        c.amount.toString().includes(query) ||
        c.status.toLowerCase().includes(query) ||
        (c.handler && c.handler.toLowerCase().includes(query))
      );
    }

    if (sortColumn && sortDirection) {
      data = [...data].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (sortColumn === 'cheque_number') {
          const aNum = parseInt(String(aVal), 10);
          const bNum = parseInt(String(bVal), 10);
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (sortColumn === 'print_count') {
          const aNum = Number(aVal) || 0;
          const bNum = Number(bVal) || 0;
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return data;
  }, [filteredData, searchQuery, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedAndFilteredData.length / itemsPerPage);

  const exportToCSV = () => {
    const csv = [
      ['Cheque #', 'Client Name', 'Amount', 'Status', 'Issue Date', 'Print Count', 'Handler'].join(','),
      ...sortedAndFilteredData.map(c => [
        c.cheque_number,
        `"${c.client_name}"`,
        c.amount,
        c.status,
        c.issue_date,
        c.print_count || 0,
        c.handler || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedCategory}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const SortIcon = ({ column }: { column: keyof ChequeAnalytics }) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 inline" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="h-4 w-4 ml-1 inline" />;
    }
    return <ChevronDown className="h-4 w-4 ml-1 inline" />;
  };

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const month = subMonths(now, i);
      options.push({
        value: month.toISOString(),
        label: format(month, 'MMMM yyyy')
      });
    }
    return options;
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Comprehensive cheque analytics and insights</p>
      </div>

      <div className="grid gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Category</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value as AnalyticsCategory)}
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Date Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as DateFilter);
                setCurrentPage(1);
              }}
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="all">All Time</option>
              <option value="day">Today</option>
              <option value="month">Select Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </CardContent>
        </Card>

        {dateFilter === 'month' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Select Month</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedMonth.toISOString()}
                onChange={(e) => {
                  setSelectedMonth(new Date(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
              >
                {generateMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}

        {dateFilter === 'custom' && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">From Date</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="date"
                  value={customDateFrom ? format(customDateFrom, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    setCustomDateFrom(e.target.value ? new Date(e.target.value) : undefined);
                    setCurrentPage(1);
                  }}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">To Date</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="date"
                  value={customDateTo ? format(customDateTo, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    setCustomDateTo(e.target.value ? new Date(e.target.value) : undefined);
                    setCurrentPage(1);
                  }}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{categories.find(c => c.id === selectedCategory)?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.type === 'number' && (
            <div className="text-center py-8">
              <div className="text-5xl font-bold mb-2">
                {chartData.value !== undefined && typeof chartData.value === 'number' ? chartData.value.toLocaleString() : '0'}
              </div>
              {chartData.amount !== undefined && (
                <div className="text-2xl text-muted-foreground">
                  ${chartData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>
          )}

          {chartData.type === 'currency' && (
            <div className="text-center py-8">
              <div className="text-5xl font-bold">
                ${chartData.value !== undefined && typeof chartData.value === 'number'
                  ? chartData.value.toLocaleString('en-US', { minimumFractionDigits: 2 })
                  : '0.00'}
              </div>
            </div>
          )}

          {chartData.type === 'bar' && chartData.data && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => selectedCategory === 'cheques-by-handler' ? value : `$${value.toLocaleString()}`} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartData.type === 'line' && chartData.data && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {chartData.type === 'pie' && chartData.data && (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {chartData.percentage && (
                <div className="ml-8 text-center">
                  <div className="text-4xl font-bold">{chartData.percentage}%</div>
                  <div className="text-sm text-muted-foreground">Approval Rate</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detailed Data</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-64"
                />
              </div>
              <Button onClick={exportToCSV} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th
                    className="p-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('cheque_number')}
                  >
                    Cheque #
                    <SortIcon column="cheque_number" />
                  </th>
                  <th
                    className="p-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('client_name')}
                  >
                    Client Name
                    <SortIcon column="client_name" />
                  </th>
                  <th
                    className="p-3 text-right text-sm font-medium cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('amount')}
                  >
                    Amount
                    <SortIcon column="amount" />
                  </th>
                  <th
                    className="p-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    <SortIcon column="status" />
                  </th>
                  <th
                    className="p-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('issue_date')}
                  >
                    Issue Date
                    <SortIcon column="issue_date" />
                  </th>
                  <th
                    className="p-3 text-center text-sm font-medium cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('print_count')}
                  >
                    Print Count
                    <SortIcon column="print_count" />
                  </th>
                  <th
                    className="p-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('handler')}
                  >
                    Handler
                    <SortIcon column="handler" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((cheque) => (
                  <tr key={cheque.cheque_id} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-sm">{cheque.cheque_number}</td>
                    <td className="p-3 text-sm">{cheque.client_name}</td>
                    <td className="p-3 text-sm text-right font-medium">
                      ${cheque.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        cheque.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        cheque.status === 'Declined' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cheque.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{format(parseISO(cheque.issue_date), 'MMM dd, yyyy')}</td>
                    <td className="p-3 text-sm text-center">{cheque.print_count || 0}</td>
                    <td className="p-3 text-sm">{cheque.handler || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <img
                  src={noDataImage}
                  alt="No data available"
                  className="w-64 h-auto mb-4 opacity-80"
                />
                <p className="text-muted-foreground text-lg">No data available for the selected filters</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-input rounded-md px-2 py-1 text-sm bg-background"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

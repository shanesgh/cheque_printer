import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, FileText, CheckCircle, XCircle, Clock, CalendarIcon, Printer, Lock, Unlock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  uploader?: string;
  is_printed?: boolean;
}

interface Upload {
  document_id: number;
  file_name: string;
  uploader: string;
  created_at: string;
  cheques: ChequeData[];
}

function RouteComponent() {
  const [allCheques, setAllCheques] = useState<ChequeData[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<Date>();
  const [loading, setLoading] = useState(true);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedForPrint, setSelectedForPrint] = useState<ChequeData[]>([]);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [chequeToDecline, setChequeToDecline] = useState<number | null>(null);
  const [unlockReason, setUnlockReason] = useState("");
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [chequeToUnlock, setChequeToUnlock] = useState<number | null>(null);

  const fetchAllCheques = async () => {
    try {
      const response = await invoke<string>("get_all_cheques");
      const data = JSON.parse(response);
      const cheques = data.cheques.map((c: ChequeData) => ({
        ...c,
        uploader: "System User" // Default uploader
      }));
      
      setAllCheques(cheques);
      
      // Group by uploads
      const uploadsMap = new Map<number, Upload>();
      cheques.forEach((cheque: ChequeData) => {
        if (!uploadsMap.has(cheque.document_id)) {
          uploadsMap.set(cheque.document_id, {
            document_id: cheque.document_id,
            file_name: cheque.file_name,
            uploader: cheque.uploader || "System User",
            created_at: cheque.created_at,
            cheques: []
          });
        }
        uploadsMap.get(cheque.document_id)!.cheques.push(cheque);
      });
      
      setUploads(Array.from(uploadsMap.values()));
    } catch (error) {
      console.error("Failed to fetch cheques:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (chequeId: number, newStatus: string) => {
    if (newStatus === 'Declined') {
      setChequeToDecline(chequeId);
      setShowDeclineDialog(true);
      return;
    }
    
    try {
      await invoke("update_cheque_status", { chequeId, newStatus });
      const updated = allCheques.map(c => 
        c.cheque_id === chequeId ? { ...c, status: newStatus } : c
      );
      setAllCheques(updated);
      
      // Update uploads
      const updatedUploads = uploads.map(upload => ({
        ...upload,
        cheques: upload.cheques.map(c => 
          c.cheque_id === chequeId ? { ...c, status: newStatus } : c
        )
      }));
      setUploads(updatedUploads);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDeclineConfirm = async () => {
    if (!chequeToDecline || !declineReason.trim()) return;
    
    try {
      await invoke("update_cheque_status", { 
        chequeId: chequeToDecline, 
        newStatus: 'Declined',
        reason: declineReason 
      });
      
      const updated = allCheques.map(c => 
        c.cheque_id === chequeToDecline ? { ...c, status: 'Declined', remarks: declineReason } : c
      );
      setAllCheques(updated);
      
      const updatedUploads = uploads.map(upload => ({
        ...upload,
        cheques: upload.cheques.map(c => 
          c.cheque_id === chequeToDecline ? { ...c, status: 'Declined', remarks: declineReason } : c
        )
      }));
      setUploads(updatedUploads);
      
      setShowDeclineDialog(false);
      setDeclineReason("");
      setChequeToDecline(null);
    } catch (error) {
      console.error("Failed to decline cheque:", error);
    }
  };

  const handlePrintCheques = () => {
    const approvedCheques = getCurrentCheques().filter(c => c.status === 'Approved' && !c.is_printed);
    setSelectedForPrint(approvedCheques);
    setShowPrintDialog(true);
  };

  const confirmPrint = async () => {
    try {
      for (const cheque of selectedForPrint) {
        await invoke("mark_cheque_printed", { chequeId: cheque.cheque_id });
      }
      
      const updated = allCheques.map(c => 
        selectedForPrint.find(p => p.cheque_id === c.cheque_id) 
          ? { ...c, is_printed: true } : c
      );
      setAllCheques(updated);
      
      setShowPrintDialog(false);
      setSelectedForPrint([]);
    } catch (error) {
      console.error("Failed to mark as printed:", error);
    }
  };

  const handleUnlockPrinted = (chequeId: number) => {
    setChequeToUnlock(chequeId);
    setShowUnlockDialog(true);
  };

  const confirmUnlock = async () => {
    if (!chequeToUnlock || !unlockReason.trim()) return;
    
    try {
      await invoke("unlock_printed_cheque", { 
        chequeId: chequeToUnlock, 
        reason: unlockReason 
      });
      
      const updated = allCheques.map(c => 
        c.cheque_id === chequeToUnlock ? { ...c, is_printed: false } : c
      );
      setAllCheques(updated);
      
      setShowUnlockDialog(false);
      setUnlockReason("");
      setChequeToUnlock(null);
    } catch (error) {
      console.error("Failed to unlock cheque:", error);
    }
  };

  const getCurrentCheques = () => {
    if (activeTab === -1) return allCheques; // All view
    return uploads[activeTab]?.cheques || [];
  };

  const getFilteredCheques = () => {
    let cheques = getCurrentCheques();
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      cheques = cheques.filter(c => 
        c.client_name.toLowerCase().includes(q) ||
        c.amount.toString().includes(q) ||
        c.cheque_number.toLowerCase().includes(q) ||
        (c.created_at && new Date(c.created_at).toLocaleDateString().includes(q))
      );
    }
    
    if (dateFilter) {
      const filterDate = format(dateFilter, 'yyyy-MM-dd');
      cheques = cheques.filter(c => 
        c.created_at && c.created_at.startsWith(filterDate)
      );
    }
    
    return cheques;
  };

  const stats = {
    total: getCurrentCheques().length,
    approved: getCurrentCheques().filter(c => c.status === 'Approved').length,
    denied: getCurrentCheques().filter(c => c.status === 'Declined').length,
    pending: getCurrentCheques().filter(c => c.status === 'Pending').length,
  };

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
        <h1 className="text-3xl font-bold text-gray-900">System Analysis</h1>
        <p className="text-gray-600 mt-1">Uploaded Excel files and cheque data</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab(-1)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-t-lg",
            activeTab === -1 ? "bg-white border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-700"
          )}
        >
          All Uploads
        </button>
        {uploads.map((upload, index) => (
          <button
            key={upload.document_id}
            onClick={() => setActiveTab(index)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-lg",
              activeTab === index ? "bg-white border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {upload.uploader} - {upload.file_name}
          </button>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, amount, cheque number, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              initialFocus
            />
            {dateFilter && (
              <div className="p-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDateFilter(undefined)}
                  className="w-full"
                >
                  Clear filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <Button onClick={handlePrintCheques} className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Print Cheques
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cheques</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.denied}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cheques List */}
      <Card>
        <CardHeader>
          <CardTitle>Cheques ({getFilteredCheques().length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getFilteredCheques().map((cheque) => (
              <div
                key={cheque.cheque_id}
                className={cn(
                  "flex items-center justify-between p-4 border rounded-lg",
                  cheque.status === 'Approved' ? 'bg-green-50 border-green-200' :
                  cheque.status === 'Declined' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200',
                  cheque.is_printed && 'opacity-60'
                )}
              >
                <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                  <div>
                    <p className="font-medium">{cheque.client_name}</p>
                    <p className="text-sm text-gray-500">#{cheque.cheque_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${cheque.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm">{cheque.issue_date || 'N/A'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm">{cheque.date || 'N/A'}</p>
                  </div>
                  <div>
                    {cheque.remarks ? (
                      <p className="text-sm text-gray-600">{cheque.remarks}</p>
                    ) : (
                      <Input 
                        placeholder="Add remarks..."
                        className="text-sm h-8"
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            // Update remarks
                          }
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {cheque.is_printed && (
                      <button
                        onClick={() => handleUnlockPrinted(cheque.cheque_id)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    )}
                    <select
                      value={cheque.status}
                      onChange={(e) => handleStatusChange(cheque.cheque_id, e.target.value)}
                      disabled={cheque.is_printed}
                      className={cn(
                        "border rounded px-3 py-1 text-sm",
                        cheque.is_printed 
                          ? 'bg-gray-100 cursor-not-allowed' 
                          : 'bg-white cursor-pointer'
                      )}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Print Dialog */}
      {showPrintDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Print Cheques</h3>
            <p className="mb-4">Print {selectedForPrint.length} approved cheques?</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmPrint}>
                Print
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Dialog */}
      {showDeclineDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Decline Cheque</h3>
            <p className="mb-4">Please provide a reason for declining:</p>
            <Input
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Enter reason..."
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleDeclineConfirm} disabled={!declineReason.trim()}>
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Dialog */}
      {showUnlockDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Unlock Printed Cheque</h3>
            <p className="mb-4">Please provide a reason for unlocking:</p>
            <Input
              value={unlockReason}
              onChange={(e) => setUnlockReason(e.target.value)}
              placeholder="e.g., Misprint, correction needed..."
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowUnlockDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmUnlock} disabled={!unlockReason.trim()}>
                Unlock
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ArrowUpDown, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ChequeData } from "@/types";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

interface DocumentTab {
  id: number;
  name: string;
  owner: string;
  date: string;
  cheques: ChequeData[];
}

function DatePickerCell({ cheque, updateIssueDate }: { cheque: ChequeData, updateIssueDate: (id: number, date: Date) => void }) {
  const [open, setOpen] = useState(false);

  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const displayDate = cheque.issue_date ? parseLocalDate(cheque.issue_date) : new Date();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      updateIssueDate(cheque.cheque_id, date);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="justify-start text-left font-normal text-xs">
          <CalendarIcon className="mr-2 h-3 w-3" />
          {format(displayDate, 'MMM dd, yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          key={cheque.issue_date || 'no-date'}
          mode="single"
          selected={displayDate}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function RouteComponent() {
  const [cheques, setCheques] = useState<ChequeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCheques, setSelectedCheques] = useState<Set<number>>(new Set());
  const [previousStates, setPreviousStates] = useState<Map<number, string>>(new Map());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<number | 'all'>('all');
  const [documentTabs, setDocumentTabs] = useState<DocumentTab[]>([]);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [pendingDeclineChequeId, setPendingDeclineChequeId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  const fetchCheques = async () => {
    try {
      const response = await invoke<string>("get_all_cheques");
      const data = JSON.parse(response);
      setCheques(data.cheques || []);

      const grouped = data.cheques?.reduce((acc: any, cheque: ChequeData) => {
        const key = cheque.document_id;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            name: cheque.file_name,
            owner: 'System',
            date: new Date(cheque.created_at).toLocaleDateString(),
            cheques: []
          };
        }
        acc[key].cheques.push(cheque);
        return acc;
      }, {});

      setDocumentTabs(Object.values(grouped || {}));

      const states = new Map();
      data.cheques?.forEach((c: ChequeData) => {
        states.set(c.cheque_id, c.status === 'Approved' ? 'Pending' : c.status);
      });
      setPreviousStates(states);
    } catch (error: any) {
      const errorMsg = error?.toString() || "Failed to load cheques";
      toast.error(errorMsg);
      console.error("Failed to fetch cheques:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateChequeStatus = async (chequeId: number, newStatus: string, remarks?: string, showToast = true) => {
    try {
      const currentCheque = cheques.find(c => c.cheque_id === chequeId);

      if (!currentCheque) {
        if (showToast) toast.error(`Cheque with ID ${chequeId} not found`);
        return;
      }

      let newCurrentSignatures = currentCheque?.current_signatures || 0;
      let newFirstSignatureUserId = currentCheque?.first_signature_user_id;
      let newSecondSignatureUserId = currentCheque?.second_signature_user_id;

      if (newStatus === 'Approved' && currentCheque?.status !== 'Approved') {
        const amount = currentCheque?.amount ?? 0;
        newCurrentSignatures = Math.min((newCurrentSignatures || 0) + 1, amount > 1500 ? 2 : 1);
        if (!newFirstSignatureUserId) {
          newFirstSignatureUserId = 1;
        } else if (!newSecondSignatureUserId && amount > 1500) {
          newSecondSignatureUserId = 1;
        }
      } else if (newStatus !== 'Approved' && currentCheque?.status === 'Approved') {
        newCurrentSignatures = Math.max((newCurrentSignatures || 0) - 1, 0);
        if (newCurrentSignatures === 0) {
          newFirstSignatureUserId = undefined;
          newSecondSignatureUserId = undefined;
        } else if (newCurrentSignatures === 1) {
          newSecondSignatureUserId = undefined;
        }
      }

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
            current_signatures: newCurrentSignatures,
            first_signature_user_id: newFirstSignatureUserId,
            second_signature_user_id: newSecondSignatureUserId
          };

          return updated;
        }
        return c;
      }));

      if (showToast) toast.success(`Cheque status updated to ${newStatus}`);
    } catch (error: any) {
      const errorMsg = error?.toString() || "Failed to update cheque status";
      if (showToast) toast.error(errorMsg);
      console.error("Failed to update status:", error);
    }
  };

  const getUserName = (userId: number) => {
    const userNames: Record<number, string> = {
      1: "System Admin",
      2: "Manager", 
      3: "Supervisor",
      4: "Accountant"
    };
    return userNames[userId] || `User ${userId}`;
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

  const handleMasterSelect = async (checked: boolean) => {
    const filteredCheques = getFilteredCheques();

    if (checked) {
      const newSelected = new Set(selectedCheques);
      const updates = filteredCheques.filter(c => c.status !== 'Approved');

      await Promise.all(updates.map(cheque => {
        newSelected.add(cheque.cheque_id);
        return updateChequeStatus(cheque.cheque_id, 'Approved', undefined, false);
      }));

      setSelectedCheques(newSelected);
      if (updates.length > 0) toast.success(`Approved ${updates.length} cheque(s)`);
    } else {
      const updates = filteredCheques.filter(c => c.status === 'Approved');

      await Promise.all(updates.map(cheque => {
        const previousState = previousStates.get(cheque.cheque_id) || 'Pending';
        return updateChequeStatus(cheque.cheque_id, previousState, undefined, false);
      }));

      setSelectedCheques(new Set());
      if (updates.length > 0) toast.success(`Reverted ${updates.length} cheque(s)`);
    }
  };

  const handleStatusChange = (chequeId: number, newStatus: string) => {
    if (newStatus === 'Declined') {
      setPendingDeclineChequeId(chequeId);
      setShowDeclineDialog(true);
    } else {
      updateChequeStatus(chequeId, newStatus);
    }
  };

  const confirmDecline = async () => {
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining.");
      return;
    }
    if (pendingDeclineChequeId) {
      await updateChequeStatus(pendingDeclineChequeId, 'Declined', declineReason);
      setShowDeclineDialog(false);
      setDeclineReason("");
      setPendingDeclineChequeId(null);
    }
  };

  const updateIssueDate = async (chequeId: number, newDate: Date) => {
    const dateString = format(newDate, 'yyyy-MM-dd');

    try {
      await invoke("update_cheque_issue_date", {
        chequeId,
        issueDate: dateString
      });

      setCheques(prev => prev.map(c =>
        c.cheque_id === chequeId ? { ...c, issue_date: dateString } : c
      ));

      toast.success("Issue date updated successfully");
    } catch (error: any) {
      const errorMsg = error?.toString() || "Failed to update issue date";
      toast.error(errorMsg);
      console.error("Failed to update issue date:", error);
    }
  };

  const handlePrintCheques = () => {
    const approvedCheques = cheques.filter(c => c.status === 'Approved');
    const declinedWithoutRemarks = cheques.filter(c => c.status === 'Declined' && !c.remarks?.trim());
    
    if (declinedWithoutRemarks.length > 0) {
      toast.error("All declined cheques must include a remark before printing.");
      return;
    }
    
    if (approvedCheques.length === 0) {
      toast.error("No approved cheques to print.");
      return;
    }
    
    setShowPrintConfirm(true);
  };

  const confirmPrint = async () => {
    const approvedCheques = cheques.filter(c => c.status === 'Approved');
    const printableCheques = approvedCheques.filter(c => {
      const required = c.amount > 1500 ? 2 : 1;
      return (c.current_signatures || 0) >= required;
    });

    if (printableCheques.length === 0) {
      toast.error("No cheques available to print.");
      return;
    }

    try {
      for (const cheque of printableCheques) {
        await invoke("increment_print_count", { chequeId: cheque.cheque_id });
      }

      const documentIds = [...new Set(printableCheques.map(c => c.document_id))];
      for (const docId of documentIds) {
        await invoke("lock_document", { documentId: docId });
      }

      toast.success(`Successfully sent ${printableCheques.length} cheque(s) to printer`);
      setShowPrintConfirm(false);
      fetchCheques();
    } catch (error: any) {
      const errorMsg = error?.toString() || "Failed to print cheques";
      toast.error(errorMsg);
      console.error("Failed to print cheques:", error);
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

  const handleSort = (key: string) => {
    const direction = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const getSortedCheques = (cheques: ChequeData[]) => {
    if (!sortConfig) return cheques;

    return [...cheques].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (sortConfig.key === 'cheque_number') {
        const aNum = parseInt(aValue) || 0;
        const bNum = parseInt(bValue) || 0;
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  };

  const getStatusFilteredCheques = () => {
    let filtered = getFilteredCheques();

    // Filter by active tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(c => c.document_id === activeTab);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status.toLowerCase() === statusFilter.toLowerCase());
    }

    return getSortedCheques(filtered);
  };

  const getRowColor = (status: string, printCount?: number) => {
    if (printCount && printCount > 0) return 'bg-orange-50 border-orange-200';
    switch (status) {
      case 'Approved': return 'bg-green-50 border-green-200';
      case 'Declined': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getActiveTabCheques = () => {
    if (activeTab === 'all') return cheques;
    return cheques.filter(c => c.document_id === activeTab);
  };

  const activeTabCheques = getActiveTabCheques();
  const stats = {
    total: activeTabCheques.length,
    approved: activeTabCheques.filter(c => c.status === 'Approved').length,
    declined: activeTabCheques.filter(c => c.status === 'Declined').length,
    pending: activeTabCheques.filter(c => c.status === 'Pending').length,
  };

  const filteredCheques = getStatusFilteredCheques();
  const allSelected = filteredCheques.length > 0 && filteredCheques.every(c => selectedCheques.has(c.cheque_id));

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
    <div className="p-3 md:p-6 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Document Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            All Uploads ({cheques.length})
          </button>
          {documentTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.name} ({tab.cheques.length})
              <div className="text-xs text-muted-foreground">{tab.owner} • {tab.date}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-4">
        <Input
          placeholder="Search cheques..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:max-w-md"
        />
        <Button onClick={handlePrintCheques}>Print Cheques</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:bg-accent transition-colors duration-150" onClick={() => setStatusFilter('all')}>
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
        <Card className="cursor-pointer hover:bg-accent transition-colors duration-150" onClick={() => setStatusFilter('approved')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {stats.approved}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent transition-colors duration-150" onClick={() => setStatusFilter('declined')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {stats.declined}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent transition-colors duration-150" onClick={() => setStatusFilter('pending')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {stats.pending}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full min-w-[800px]">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleMasterSelect}
                    />
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[80px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('date')}>
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[100px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('cheque_number')}>
                      Cheque #
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[100px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('amount')}>
                      Amount
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[120px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('issue_date')}>
                      Issue Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[120px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('client_name')}>
                      Client
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[100px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('status')}>
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[80px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('current_signatures')}>
                      Current Sig
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[80px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('required_signatures')}>
                      Required Sig
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[120px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('first_signature_user_id')}>
                      Signed By (First)
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[120px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('second_signature_user_id')}>
                      Signed By (Second)
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[80px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('print_count')}>
                      Print Count
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm min-w-[150px]">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheques.map((cheque) => {
                  const requiredSigs = cheque.amount > 1500 ? 2 : 1;
                  return (
                  <tr key={cheque.cheque_id} className={`border-b ${getRowColor(cheque.status, cheque.print_count)}`}>
                    <td className="p-2 md:p-3">
                      <Checkbox
                        checked={selectedCheques.has(cheque.cheque_id)}
                        onCheckedChange={(checked) => handleCheckboxChange(cheque.cheque_id, !!checked)}
                      />
                    </td>
                    <td className="p-2 md:p-3 text-xs md:text-sm">
                      {cheque.date ? format(new Date(cheque.date), 'MMM dd, yyyy') : cheque.created_at ? format(new Date(cheque.created_at), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="p-2 md:p-3">
                      <div className="font-mono text-xs md:text-sm">{cheque.cheque_number}</div>
                    </td>
                    <td className="p-2 md:p-3 font-semibold text-xs md:text-sm">
                      ${cheque.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 md:p-3">
                      <DatePickerCell
                        cheque={cheque}
                        updateIssueDate={updateIssueDate}
                      />
                    </td>
                    <td className="p-2 md:p-3">
                      <div>
                        <div className="font-medium text-xs md:text-sm">{cheque.client_name}</div>
                        <div className="text-xs text-muted-foreground">ID: {cheque.cheque_id}</div>
                      </div>
                    </td>
                    <td className="p-2 md:p-3">
                      <select
                        value={cheque.status}
                        onChange={(e) => handleStatusChange(cheque.cheque_id, e.target.value)}
                        className="border rounded px-1 md:px-2 py-1 text-xs md:text-sm bg-background w-full"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Declined">Declined</option>
                      </select>
                    </td>
                    <td className="p-2 md:p-3 text-xs md:text-sm">
                      {cheque.current_signatures || 0}
                    </td>
                    <td className="p-2 md:p-3 text-xs md:text-sm">
                      {requiredSigs}
                    </td>
                    <td className="p-2 md:p-3 text-xs md:text-sm">
                      {cheque.first_signature_user_id ? getUserName(cheque.first_signature_user_id) : '-'}
                    </td>
                    <td className="p-2 md:p-3 text-xs md:text-sm">
                      {cheque.second_signature_user_id ? getUserName(cheque.second_signature_user_id) : '-'}
                    </td>
                    <td className="p-2 md:p-3 text-xs md:text-sm text-center">
                      {(cheque as any).print_count || 0}
                    </td>
                    <td className="p-2 md:p-3">
                      {cheque.status === 'Declined' ? (
                        <div className="text-xs md:text-sm text-red-600 bg-red-50 border border-red-200 rounded px-1 md:px-2 py-1">
                          {cheque.remarks || 'No reason provided'}
                        </div>
                      ) : (
                        <Input
                          placeholder={cheque.status === 'Declined' ? 'Reason required' : 'Add remarks...'}
                          defaultValue={cheque.remarks || ''}
                          className={`text-xs md:text-sm h-6 md:h-8 ${cheque.status === 'Declined' ? 'border-red-300 bg-red-50 ring-2 ring-red-200' : ''}`}
                          onBlur={(e) => {
                            if (e.target.value !== (cheque.remarks || '')) {
                              updateChequeStatus(cheque.cheque_id, cheque.status, e.target.value);
                            }
                          }}
                        />
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Print Confirmation Modal */}
      {showPrintConfirm && (() => {
        const approvedCheques = cheques.filter(c => c.status === 'Approved');
        const printableCheques = approvedCheques.filter(c => {
          const required = c.amount > 1500 ? 2 : 1;
          return (c.current_signatures || 0) >= required;
        });
        const missingSignatures = approvedCheques.filter(c => {
          const required = c.amount > 1500 ? 2 : 1;
          return (c.current_signatures || 0) < required;
        });
        const totalAmount = printableCheques.reduce((sum, c) => sum + c.amount, 0);

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Print Cheques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-lg font-semibold mb-2">Total Amount: ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <div className="text-sm text-muted-foreground mb-4">{printableCheques.length} cheque(s) ready to print</div>
                </div>

                {printableCheques.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Cheques to Print:</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2 border rounded p-3">
                      {printableCheques.map(cheque => (
                        <div key={cheque.cheque_id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                          <div className="flex-1">
                            <div className="font-medium">{cheque.client_name}</div>
                            <div className="text-xs text-muted-foreground">Cheque #{cheque.cheque_number}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${cheque.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            <div className="text-xs text-green-600">{cheque.current_signatures}/{cheque.amount > 1500 ? 2 : 1} signatures</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {missingSignatures.length > 0 && (
                  <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">Excluded from Print ({missingSignatures.length} cheque(s)):</h3>
                    <p className="text-sm text-yellow-700 mb-3">The following approved cheques will NOT be printed due to missing signatures:</p>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {missingSignatures.map(cheque => {
                        const required = cheque.amount > 1500 ? 2 : 1;
                        const current = cheque.current_signatures || 0;
                        return (
                          <div key={cheque.cheque_id} className="flex justify-between items-center text-sm py-2 border-b border-yellow-200 last:border-0">
                            <div className="flex-1">
                              <div className="font-medium text-yellow-900">{cheque.client_name}</div>
                              <div className="text-xs text-yellow-700">Cheque #{cheque.cheque_number}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-yellow-900">${cheque.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                              <div className="text-xs text-red-600">{current}/{required} signatures (missing {required - current})</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <Button onClick={confirmPrint} disabled={printableCheques.length === 0}>
                    Print {printableCheques.length} Cheque(s)
                  </Button>
                  <Button variant="outline" onClick={() => setShowPrintConfirm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Decline Reason Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Cheque</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this cheque. This information is required and will be saved for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Enter reason for declining..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeclineDialog(false);
              setDeclineReason("");
              setPendingDeclineChequeId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={confirmDecline} disabled={!declineReason.trim()}>
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useChequeStore } from "@/store/chequeStore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, FileText, AlertTriangle } from "lucide-react";
import { ChequeType, Status } from "@/type";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/analysis")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    activeCheques,
    activeFileName,
    isProcessing,
    getStatistics,
    checkForDuplicates,
    updateChequeStatus,
  } = useChequeStore();

  const [duplicates, setDuplicates] = useState<ChequeType[]>([]);
  const statistics = getStatistics();

  useEffect(() => {
    setDuplicates(checkForDuplicates());
  }, [activeCheques, checkForDuplicates]);

  const handleStatusChange = (chequeId: number, newStatus: Status) => {
    updateChequeStatus(chequeId, newStatus);
  };

  if (!isProcessing || activeCheques.length === 0) {
    return (
      <div className="ml-[280px] flex flex-col items-center justify-center h-screen bg-gray-50">
        <FileText className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-600 mb-2">No Active Processing</h2>
        <p className="text-gray-500">Upload and send an Excel file for processing to view analysis.</p>
      </div>
    );
  }

  return (
    <div className="ml-[280px] p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analysis Dashboard</h1>
            <p className="text-gray-600 mt-1">Processing: {activeFileName}</p>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {statistics.total} Cheques
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cheques</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.approved}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.total > 0 ? Math.round((statistics.approved / statistics.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.denied}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.total > 0 ? Math.round((statistics.denied / statistics.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.total > 0 ? Math.round((statistics.pending / statistics.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Duplicates Warning */}
      {duplicates.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Duplicate Cheques Detected
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Found {duplicates.length} potential duplicate cheques based on name, amount, and cheque number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {duplicates.slice(0, 5).map((cheque) => (
                <div key={cheque.cheque_id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{cheque.client_name}</span>
                    <span className="text-gray-500 ml-2">${cheque.amount}</span>
                    <span className="text-gray-500 ml-2">#{cheque.cheque_number}</span>
                  </div>
                  <Badge variant="outline" className="text-yellow-700">
                    Duplicate
                  </Badge>
                </div>
              ))}
              {duplicates.length > 5 && (
                <p className="text-sm text-yellow-700">
                  And {duplicates.length - 5} more duplicates...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cheques List */}
      <Card>
        <CardHeader>
          <CardTitle>Cheque Details</CardTitle>
          <CardDescription>
            Real-time status tracking for all cheques. Approved cheques are locked and cannot be modified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeCheques.map((cheque) => (
              <div
                key={cheque.cheque_id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  cheque.status === Status.APPROVED ? 'bg-green-50 border-green-200' :
                  cheque.status === Status.DECLINED ? 'bg-red-50 border-red-200' :
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
                      <p className="text-sm text-gray-500">{cheque.date}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {duplicates.some(d => d.cheque_id === cheque.cheque_id) && (
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                      Duplicate
                    </Badge>
                  )}
                  
                  <select
                    value={cheque.status}
                    onChange={(e) => handleStatusChange(cheque.cheque_id!, e.target.value as Status)}
                    disabled={cheque.status === Status.APPROVED}
                    className={`border rounded px-3 py-1 text-sm ${
                      cheque.status === Status.APPROVED 
                        ? 'bg-gray-100 cursor-not-allowed' 
                        : 'bg-white cursor-pointer'
                    }`}
                  >
                    <option value={Status.PENDING}>Pending</option>
                    <option value={Status.APPROVED}>Approved</option>
                    <option value={Status.DECLINED}>Declined</option>
                  </select>
                  
                  {cheque.status === Status.APPROVED && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs">Locked</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
ckboxChange(cheque.cheque_id, !!checked)}
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
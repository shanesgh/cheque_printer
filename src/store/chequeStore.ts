import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChequeType, Status } from '@/type';

interface ChequeStore {
  // Active cheques data
  activeCheques: ChequeType[];
  activeDocumentId: number | null;
  activeFileName: string;
  isProcessing: boolean;
  
  // Statistics
  totalCheques: number;
  approvedCount: number;
  deniedCount: number;
  pendingCount: number;
  
  // Actions
  setActiveCheques: (cheques: ChequeType[], documentId: number, fileName: string) => void;
  updateChequeStatus: (chequeId: number, newStatus: Status) => void;
  clearActiveCheques: () => void;
  setProcessing: (processing: boolean) => void;
  
  // Computed getters
  getStatistics: () => {
    total: number;
    approved: number;
    denied: number;
    pending: number;
  };
  
  // Duplicate detection
  checkForDuplicates: () => ChequeType[];
}

export const useChequeStore = create<ChequeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      activeCheques: [],
      activeDocumentId: null,
      activeFileName: '',
      isProcessing: false,
      totalCheques: 0,
      approvedCount: 0,
      deniedCount: 0,
      pendingCount: 0,

      // Actions
      setActiveCheques: (cheques, documentId, fileName) => {
        const statistics = calculateStatistics(cheques);
        set({
          activeCheques: cheques,
          activeDocumentId: documentId,
          activeFileName: fileName,
          isProcessing: true,
          totalCheques: statistics.total,
          approvedCount: statistics.approved,
          deniedCount: statistics.denied,
          pendingCount: statistics.pending,
        });
      },

      updateChequeStatus: (chequeId, newStatus) => {
        const state = get();
        const updatedCheques = state.activeCheques.map(cheque => {
          if (cheque.cheque_id === chequeId) {
            // Check if cheque is approved and trying to change - prevent if locked
            if (cheque.status === Status.APPROVED && newStatus !== Status.APPROVED) {
              console.warn('Cannot modify approved cheque - it is locked');
              return cheque;
            }
            return { ...cheque, status: newStatus };
          }
          return cheque;
        });

        const statistics = calculateStatistics(updatedCheques);
        set({
          activeCheques: updatedCheques,
          totalCheques: statistics.total,
          approvedCount: statistics.approved,
          deniedCount: statistics.denied,
          pendingCount: statistics.pending,
        });
      },

      clearActiveCheques: () => {
        set({
          activeCheques: [],
          activeDocumentId: null,
          activeFileName: '',
          isProcessing: false,
          totalCheques: 0,
          approvedCount: 0,
          deniedCount: 0,
          pendingCount: 0,
        });
      },

      setProcessing: (processing) => {
        set({ isProcessing: processing });
      },

      getStatistics: () => {
        const state = get();
        return {
          total: state.totalCheques,
          approved: state.approvedCount,
          denied: state.deniedCount,
          pending: state.pendingCount,
        };
      },

      checkForDuplicates: () => {
        const state = get();
        const duplicates: ChequeType[] = [];
        const seen = new Map<string, ChequeType>();

        state.activeCheques.forEach(cheque => {
          const key = `${cheque.client_name}-${cheque.amount}-${cheque.cheque_number}`;
          if (seen.has(key)) {
            duplicates.push(cheque);
            // Also add the original if not already in duplicates
            const original = seen.get(key)!;
            if (!duplicates.find(d => d.cheque_id === original.cheque_id)) {
              duplicates.push(original);
            }
          } else {
            seen.set(key, cheque);
          }
        });

        return duplicates;
      },
    }),
    {
      name: 'cheque-store',
      partialize: (state) => ({
        activeCheques: state.activeCheques,
        activeDocumentId: state.activeDocumentId,
        activeFileName: state.activeFileName,
        isProcessing: state.isProcessing,
        totalCheques: state.totalCheques,
        approvedCount: state.approvedCount,
        deniedCount: state.deniedCount,
        pendingCount: state.pendingCount,
      }),
    }
  )
);

// Helper function to calculate statistics
function calculateStatistics(cheques: ChequeType[]) {
  const total = cheques.length;
  const approved = cheques.filter(c => c.status === Status.APPROVED).length;
  const denied = cheques.filter(c => c.status === Status.DECLINED).length;
  const pending = cheques.filter(c => c.status === Status.PENDING).length;

  return { total, approved, denied, pending };
}
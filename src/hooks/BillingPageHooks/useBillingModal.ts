import { useState } from 'react';
import { BillingReport, Expense } from '@/types/billing';

export type ModalType = 'report' | 'expense' | 'create_guide' | 'add_expense' | null;
export type ModalMode = 'view' | 'edit' | 'create';

export interface ModalState {
  type: ModalType;
  data?: BillingReport | Expense | null;
  mode?: ModalMode;
}

export const useBillingModal = () => {
  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  const openModal = (type: ModalType, data?: any, mode: ModalMode = 'view') => {
    setModalState({ type, data, mode });
  };

  const closeModal = () => {
    setModalState({ type: null });
  };

  const openAddExpenseModal = () => {
    setShowAddExpenseModal(true);
  };

  const closeAddExpenseModal = () => {
    setShowAddExpenseModal(false);
  };

  const handleViewReport = (report: BillingReport) => {
    openModal('report', report, 'view');
  };

  const handleViewExpense = (expense: Expense) => {
    openModal('expense', expense, 'view');
  };

  const handleCreateGuide = () => {
    openModal('create_guide', null, 'create');
  };

  return {
    modalState,
    showAddExpenseModal,
    openModal,
    closeModal,
    openAddExpenseModal,
    closeAddExpenseModal,
    handleViewReport,
    handleViewExpense,
    handleCreateGuide,
  };
};
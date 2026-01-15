import { FinanceRecord, PaymentMethod } from '../types';
import apiClient from '../utils/apiClient';

// --- Finances API ---
export const getFinances = async () => apiClient<FinanceRecord[]>('/finances');

export const createFinanceRecord = async (record: Omit<FinanceRecord, 'id'>) => apiClient<FinanceRecord>('/finances', {
  method: 'POST',
  body: JSON.stringify(record),
});

export const generateMonthlyInvoices = async () => apiClient<FinanceRecord[]>('/finances/generate-invoices', {
  method: 'POST',
});

export const markFinanceRecordPaid = async (id: string, method: PaymentMethod) => apiClient<FinanceRecord>(`/finances/${id}/mark-paid`, {
  method: 'POST',
  body: JSON.stringify({ method }),
});
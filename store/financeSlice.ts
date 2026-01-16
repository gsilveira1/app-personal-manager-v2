import { StateCreator } from 'zustand';
import { FinanceRecord, Plan, Product } from '../types';
import { AppState } from '../store';

export interface FinanceSlice {
  finances: FinanceRecord[];
  plans: Plan[];
  products: Product[];
  _setFinances: (records: FinanceRecord[]) => void;
  _addFinanceRecord: (record: FinanceRecord) => void;
  _addFinanceRecords: (records: FinanceRecord[]) => void;
  _updateFinanceRecord: (record: FinanceRecord) => void;
  _setPlans: (plans: Plan[]) => void;
  _addPlan: (plan: Plan) => void;
  _updatePlan: (plan: Plan) => void;
  _removePlan: (planId: string) => void;
  _setProducts: (products: Product[]) => void;
}

export const createFinanceSlice: StateCreator<
  AppState,
  [],
  [],
  FinanceSlice
> = (set) => ({
  finances: [],
  plans: [],
  products: [],
  _setFinances: (records) => set({ finances: records }),
  _addFinanceRecord: (record) => set((state) => ({ finances: [record, ...state.finances] })),
  _addFinanceRecords: (records) => set((state) => ({ finances: [...records, ...state.finances] })),
  _updateFinanceRecord: (record) => set((state) => ({
    finances: state.finances.map((f) => (f.id === record.id ? record : f)),
  })),
  _setPlans: (plans) => set({ plans }),
  _addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] })),
  _updatePlan: (plan) => set((state) => ({
    plans: state.plans.map((p) => (p.id === plan.id ? plan : p)),
  })),
  _removePlan: (planId) => set((state) => ({
    plans: state.plans.filter((p) => p.id !== planId),
  })),
  _setProducts: (products) => set({ products }),
});

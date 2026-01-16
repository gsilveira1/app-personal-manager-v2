import { StateCreator } from 'zustand';
import { Evaluation } from '../types';
import { AppState } from '../store';

export interface EvaluationSlice {
  evaluations: Evaluation[];
  _setEvaluations: (evaluations: Evaluation[]) => void;
  _addEvaluation: (evaluation: Evaluation) => void;
  _updateEvaluation: (evaluation: Evaluation) => void;
  _removeEvaluation: (evaluationId: string) => void;
}

export const createEvaluationSlice: StateCreator<
  AppState,
  [],
  [],
  EvaluationSlice
> = (set) => ({
  evaluations: [],
  _setEvaluations: (evaluations) => set({ evaluations }),
  _addEvaluation: (evaluation) => set((state) => ({ evaluations: [evaluation, ...state.evaluations] })),
  _updateEvaluation: (evaluation) => set((state) => ({
    evaluations: state.evaluations.map((e) => e.id === evaluation.id ? evaluation : e),
  })),
  _removeEvaluation: (evaluationId) => set((state) => ({
    evaluations: state.evaluations.filter((e) => e.id !== evaluationId),
  })),
});

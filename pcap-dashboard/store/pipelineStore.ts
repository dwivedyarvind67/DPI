import { create } from 'zustand';
import { Flow, PipelineStats, Rule } from '../lib/types';

interface PipelineState {
  stats: PipelineStats;
  flows: Flow[];
  rules: Rule[];
  
  // Actions
  updateStats: (newStats: Partial<PipelineStats>) => void;
  addFlows: (newFlows: Flow[]) => void;
  setRules: (rules: Rule[]) => void;
  addRule: (rule: Rule) => void;
  removeRule: (id: string) => void;
}

const MAX_FLOWS = 500; // Ring buffer cap

export const usePipelineStore = create<PipelineState>((set) => ({
  stats: {
    running: false,
    totalRead: 0,
    totalForwarded: 0,
    totalDropped: 0,
    workers: [],
    pps: 0,
  },
  flows: [],
  rules: [],
  
  updateStats: (newStats) => set((state) => ({
    stats: { ...state.stats, ...newStats }
  })),
  
  addFlows: (newFlows) => set((state) => {
    const combined = [...newFlows, ...state.flows];
    return {
      flows: combined.slice(0, MAX_FLOWS) // Keep only the latest MAX_FLOWS
    };
  }),
  
  setRules: (rules) => set({ rules }),
  
  addRule: (rule) => set((state) => ({
    rules: [...state.rules, rule]
  })),
  
  removeRule: (id) => set((state) => ({
    rules: state.rules.filter((r) => r.id !== id)
  })),
}));

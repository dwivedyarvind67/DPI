import { Rule } from "./types";

const DELAY = 500; // Mock network delay

// Mock Database
let mockRules: Rule[] = [
  { id: "1", field: "proto", op: "=", value: "TCP", action: "forward" },
  { id: "2", field: "dport", op: "=", value: "443", action: "forward" },
];



// Mock endpoints
export const api = {
  pipeline: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    start: async (config: { workerCount: number }): Promise<boolean> => {
      return new Promise((resolve) => setTimeout(() => resolve(true), DELAY));
    },
    stop: async (): Promise<boolean> => {
      return new Promise((resolve) => setTimeout(() => resolve(true), DELAY));
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    upload: async (file: File): Promise<boolean> => {
      return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
    },
  },
  rules: {
    get: async (): Promise<Rule[]> => {
      return new Promise((resolve) => setTimeout(() => resolve([...mockRules]), DELAY));
    },
    add: async (rule: Omit<Rule, "id">): Promise<Rule> => {
      return new Promise((resolve) => setTimeout(() => {
        const newRule = { ...rule, id: Math.random().toString(36).substr(2, 9) };
        mockRules.push(newRule);
        resolve(newRule);
      }, DELAY));
    },
    delete: async (id: string): Promise<boolean> => {
      return new Promise((resolve) => setTimeout(() => {
        mockRules = mockRules.filter((r) => r.id !== id);
        resolve(true);
      }, DELAY));
    },
  },
};

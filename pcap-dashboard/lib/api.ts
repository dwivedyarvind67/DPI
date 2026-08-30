import { Rule } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text as unknown as T; }
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// API surface (matches the Java WebServer routes exactly)
// ─────────────────────────────────────────────────────────────────────────────

export const api = {
  pipeline: {
    start: async (_config: { workerCount: number }): Promise<boolean> => {
      try {
        await post("/api/pipeline/start");
        return true;
      } catch {
        return false;
      }
    },
    stop: async (): Promise<boolean> => {
      try {
        await post("/api/pipeline/stop");
        return true;
      } catch {
        return false;
      }
    },
    // Upload is handled separately; the backend currently processes a pre-loaded PCAP.
    upload: async (_file: File): Promise<boolean> => {
      // TODO: add multipart upload endpoint to Java WebServer
      return true;
    },
  },

  rules: {
    get: async (): Promise<Rule[]> => {
      try {
        const res = await fetch(`${BASE_URL}/api/rules`);
        if (!res.ok) return [];
        const data = await res.json();
        // Map Java Rule record shape { id, type, value } → frontend Rule shape
        return data.map((r: { id: string; type: string; value: string }) => ({
          id: r.id,
          field: r.type,   // "ip" | "app" | "domain"
          op: "=",
          value: r.value,
          action: "drop",
        }));
      } catch {
        return [];
      }
    },

    add: async (rule: Omit<Rule, "id">): Promise<Rule> => {
      const body = {
        type: rule.field,   // "ip" | "app" | "domain"
        value: rule.value,
      };
      const r = await post<{ id: string; type: string; value: string }>("/api/rules", body);
      return { id: r.id, field: r.type, op: "=", value: r.value, action: "drop" };
    },

    delete: async (id: string): Promise<boolean> => {
      try {
        await del(`/api/rules/${id}`);
        return true;
      } catch {
        return false;
      }
    },
  },
};

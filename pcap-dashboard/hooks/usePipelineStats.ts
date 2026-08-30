"use client";

import { useEffect, useRef } from "react";
import { usePipelineStore } from "../store/pipelineStore";
import { Flow, WorkerStat } from "../lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

// Shape of the JSON payload streamed by the Java WebServer
interface TelemetryPayload {
  running: boolean;
  totalRead: number;
  totalForwarded: number;
  totalDropped: number;
  pps: number;
  workers: { id: number; processed: number; loadPct: number }[];
  flows: {
    id: string;
    src: string;
    sport: number;
    dst: string;
    dport: number;
    proto: "TCP" | "UDP" | "OTHER";
    action: "forward" | "drop";
    sni: string;
    app: string;
    timestamp: number;
  }[];
}

export function usePipelineStats() {
  const updateStats = usePipelineStore((state) => state.updateStats);
  const addFlows    = usePipelineStore((state) => state.addFlows);

  const wsRef     = useRef<WebSocket | null>(null);
  const retryRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected to DPI Engine WebSocket");
      };

      ws.onmessage = (event) => {
        try {
          const data: TelemetryPayload = JSON.parse(event.data as string);

          // ── update stats ──────────────────────────────────────────────────
          const workers: WorkerStat[] = data.workers.map((w) => ({
            id: w.id,
            processed: w.processed,
            queueDepth: 0,
            loadPct: w.loadPct,
          }));

          updateStats({
            running: data.running,
            totalRead: data.totalRead,
            totalForwarded: data.totalForwarded,
            totalDropped: data.totalDropped,
            pps: data.pps,
            workers,
          });

          // ── update flows ──────────────────────────────────────────────────
          if (data.flows && data.flows.length > 0) {
            const newFlows: Flow[] = data.flows.map((f) => ({
              id: f.id,
              src: f.src,
              sport: f.sport,
              dst: f.dst,
              dport: f.dport,
              proto: f.proto === "OTHER" ? "TCP" : f.proto,
              worker: 0, // worker info not per-flow in this version
              action: f.action,
              timestamp: f.timestamp,
            }));
            addFlows(newFlows);
          }
        } catch (err) {
          console.error("[WS] Parse error:", err);
        }
      };

      ws.onclose = () => {
        console.log("[WS] Disconnected — retrying in 3s…");
        if (!destroyed) {
          retryRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close(); // trigger onclose → retry
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [updateStats, addFlows]);
}

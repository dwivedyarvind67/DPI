"use client";

import { useEffect, useRef } from "react";
import { usePipelineStore } from "../store/pipelineStore";
import { Flow, WorkerStat } from "../lib/types";

// Generates a mock flow event
function generateMockFlow(): Flow {
  const ips = ["192.168.1.10", "10.0.0.5", "172.16.0.4", "8.8.8.8", "1.1.1.1"];
  const protos: ("TCP" | "UDP")[] = ["TCP", "TCP", "TCP", "UDP"];
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    src: ips[Math.floor(Math.random() * ips.length)],
    sport: Math.floor(Math.random() * 60000) + 1024,
    dst: ips[Math.floor(Math.random() * ips.length)],
    dport: [80, 443, 53, 22, 3306][Math.floor(Math.random() * 5)],
    proto: protos[Math.floor(Math.random() * protos.length)],
    worker: Math.floor(Math.random() * 4), // 4 mock workers
    action: Math.random() > 0.1 ? "forward" : "drop",
    timestamp: Date.now(),
  };
}

export function usePipelineStats() {
  const updateStats = usePipelineStore((state) => state.updateStats);
  const addFlows = usePipelineStore((state) => state.addFlows);
  
  const totalReadRef = useRef(0);
  const totalForwardedRef = useRef(0);
  const totalDroppedRef = useRef(0);

  useEffect(() => {
    // Mock WebSocket simulation
    let flowBatch: Flow[] = [];
    
    // 1. High frequency flow generation (e.g. 50 flows/sec)
    const flowInterval = setInterval(() => {
      flowBatch.push(generateMockFlow());
    }, 20);

    // 2. Throttled store update for flows (every 250ms) to prevent UI lag
    const batchInterval = setInterval(() => {
      if (flowBatch.length > 0) {
        addFlows([...flowBatch]);
        
        // Update stats based on generated flows
        const forwarded = flowBatch.filter(f => f.action === "forward").length;
        const dropped = flowBatch.length - forwarded;
        
        totalReadRef.current += flowBatch.length;
        totalForwardedRef.current += forwarded;
        totalDroppedRef.current += dropped;
        
        flowBatch = []; // Reset batch
      }
    }, 250);

    // 3. Stats updates (every 1s)
    const statsInterval = setInterval(() => {
      const pps = Math.floor(Math.random() * 500) + 1000; // Mock 1k-1.5k pps
      
      const workers: WorkerStat[] = Array.from({ length: 4 }).map((_, i) => ({
        id: i,
        processed: Math.floor(totalReadRef.current / 4) + Math.floor(Math.random() * 50),
        queueDepth: Math.floor(Math.random() * 20),
        loadPct: Math.floor(Math.random() * 80) + 10,
      }));

      updateStats({
        running: true,
        totalRead: totalReadRef.current,
        totalForwarded: totalForwardedRef.current,
        totalDropped: totalDroppedRef.current,
        pps,
        workers,
      });
    }, 1000);

    return () => {
      clearInterval(flowInterval);
      clearInterval(batchInterval);
      clearInterval(statsInterval);
    };
  }, [updateStats, addFlows]);
}

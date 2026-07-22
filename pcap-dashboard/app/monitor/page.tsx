"use client";

import { usePipelineStats } from "@/hooks/usePipelineStats";
import { PipelineDiagram } from "@/components/pipeline/PipelineDiagram";
import { WorkerLoadBars } from "@/components/pipeline/WorkerLoadBars";
import { ThroughputChart } from "@/components/pipeline/ThroughputChart";

export default function MonitorPage() {
  // Initialize mock WebSocket connection
  usePipelineStats();

  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Pipeline Monitor</h1>
          <p className="text-muted-foreground mt-1">Real-time telemetry from the DPI engine.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PipelineDiagram />
        <ThroughputChart />
        <WorkerLoadBars />
      </div>
    </div>
  );
}

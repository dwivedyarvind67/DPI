"use client";

import { usePipelineStats } from "@/hooks/usePipelineStats";
import { PipelineDiagram } from "@/components/pipeline/PipelineDiagram";
import { WorkerLoadBars } from "@/components/pipeline/WorkerLoadBars";
import { ThroughputChart } from "@/components/pipeline/ThroughputChart";

export default function MonitorPage() {
  // Initialize mock WebSocket connection
  usePipelineStats();

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col overflow-y-auto gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Live Pipeline Monitor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Real-time telemetry from the DPI engine.</p>
      </div>

      <div className="flex flex-col gap-5">
        <PipelineDiagram />
        <ThroughputChart />
        <WorkerLoadBars />
      </div>
    </div>
  );
}

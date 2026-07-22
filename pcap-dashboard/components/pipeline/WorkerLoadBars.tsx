"use client";

import { usePipelineStore } from "@/store/pipelineStore";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server } from "lucide-react";

export function WorkerLoadBars() {
  const workers = usePipelineStore((state) => state.stats.workers);

  if (!workers || workers.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Worker Load</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">No workers active.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Server className="w-4 h-4" />
          FastPath Worker Load
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {workers.map((w) => (
          <div key={w.id} className="flex flex-col space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">Worker {w.id}</span>
              <span className="text-muted-foreground">{w.loadPct}%</span>
            </div>
            <Progress value={w.loadPct} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Pkts: {w.processed.toLocaleString()}</span>
              <span>Queue: {w.queueDepth}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

"use client";

import { usePipelineStore } from "@/store/pipelineStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function RunLog() {
  const isRunning = usePipelineStore((state) => state.stats.running);
  const [logs, setLogs] = useState<string[]>([]);
  const prevRunning = useRef(false);

  useEffect(() => {
    const now = new Date().toLocaleTimeString();
    if (isRunning && !prevRunning.current) {
      setLogs((prev) => [`[${now}] DPI Engine Pipeline Started.`, ...prev]);
    } else if (!isRunning && prevRunning.current) {
      setLogs((prev) => [`[${now}] Pipeline stopped. Output PCAP ready.`, ...prev]);
    }
    prevRunning.current = isRunning;
  }, [isRunning]);

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
        <div>
          <CardTitle>System Logs</CardTitle>
          <CardDescription>Live output from the Java DPI engine</CardDescription>
        </div>
        <Button variant="outline" size="sm" disabled={isRunning || logs.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Download Output PCAP
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4 bg-muted/30">
          <div className="font-mono text-sm space-y-2">
            {logs.length === 0 ? (
              <div className="text-muted-foreground italic">No logs available. Start the pipeline to view output.</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-muted-foreground whitespace-pre-wrap">
                  {log}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

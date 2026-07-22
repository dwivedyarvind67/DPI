"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { api } from "@/lib/api";
import { usePipelineStore } from "@/store/pipelineStore";

export function WorkerCountSlider() {
  const [workers, setWorkers] = useState([4]);
  const [loading, setLoading] = useState(false);
  
  const isRunning = usePipelineStore((state) => state.stats.running);
  const updateStats = usePipelineStore((state) => state.updateStats);

  const handleToggle = async () => {
    setLoading(true);
    if (isRunning) {
      await api.pipeline.stop();
      updateStats({ running: false, pps: 0, workers: [] });
    } else {
      await api.pipeline.start({ workerCount: workers[0] });
      updateStats({ running: true });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engine Configuration</CardTitle>
        <CardDescription>Adjust FastPath worker threads before starting.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Worker Threads</span>
            <span className="text-sm text-muted-foreground font-mono bg-secondary px-2 py-1 rounded-md">{workers[0]}</span>
          </div>
          <Slider
            value={workers}
            onValueChange={(val) => setWorkers(val as number[])}
            max={16}
            min={1}
            step={1}
            disabled={isRunning}
            className="py-4"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={isRunning ? "destructive" : "default"}
          onClick={handleToggle}
          disabled={loading}
        >
          {loading ? (
             "Processing..."
          ) : isRunning ? (
            <><Square className="w-4 h-4 mr-2" /> Stop Pipeline</>
          ) : (
            <><Play className="w-4 h-4 mr-2" /> Start Pipeline</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

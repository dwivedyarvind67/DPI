"use client";

import { usePipelineStore } from "@/store/pipelineStore";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Database, Cpu, Network, ShieldCheck } from "lucide-react";

import { type LucideIcon } from "lucide-react";

const StageBox = ({ icon: Icon, title, value, active }: { icon: LucideIcon; title: string; value?: string; active: boolean }) => (
  <div className={`flex flex-col items-center justify-center gap-2 text-center w-28 h-24 rounded-lg border transition-colors duration-200 ${
    active ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
  }`}>
    <Icon className={`w-6 h-6 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
    <span className="text-xs font-medium text-foreground">{title}</span>
    {value !== undefined && <span className="text-[11px] text-muted-foreground">{value}</span>}
  </div>
);

export function PipelineDiagram() {
  const stats = usePipelineStore((state) => state.stats);

  return (
    <Card className="col-span-full">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-5">
          <StageBox 
            icon={Database} 
            title="PCAP Reader" 
            value={stats.running ? "Reading..." : "Idle"} 
            active={stats.running} 
          />
          <ArrowRight className={`hidden md:block w-4 h-4 ${stats.running ? 'text-primary' : 'text-border'}`} />
          <StageBox 
            icon={Network} 
            title="Load Balancers" 
            value="Hash 5-Tuple" 
            active={stats.running} 
          />
          <ArrowRight className={`hidden md:block w-4 h-4 ${stats.running ? 'text-primary' : 'text-border'}`} />
          <StageBox 
            icon={Cpu} 
            title="FastPath Workers" 
            value={`${stats.workers.length} Active`} 
            active={stats.running && stats.workers.length > 0} 
          />
          <ArrowRight className={`hidden md:block w-4 h-4 ${stats.running ? 'text-primary' : 'text-border'}`} />
          <StageBox 
            icon={ShieldCheck} 
            title="Writer" 
            value={`${stats.totalForwarded.toLocaleString()} Fwd`} 
            active={stats.running} 
          />
        </div>
      </CardContent>
    </Card>
  );
}

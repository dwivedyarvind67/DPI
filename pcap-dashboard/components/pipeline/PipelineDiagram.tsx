"use client";

import { usePipelineStore } from "@/store/pipelineStore";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Database, Cpu, Network, ShieldCheck } from "lucide-react";

import { type LucideIcon } from "lucide-react";

const StageBox = ({ icon: Icon, title, value, active }: { icon: LucideIcon; title: string; value?: string; active: boolean }) => (
  <Card className={`relative transition-all duration-500 ${active ? 'border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'border-border'}`}>
    <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center w-32 h-32">
      <Icon className={`w-8 h-8 ${active ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
      <span className="text-sm font-medium">{title}</span>
      {value !== undefined && <span className="text-xs text-muted-foreground">{value}</span>}
    </CardContent>
  </Card>
);

export function PipelineDiagram() {
  const stats = usePipelineStore((state) => state.stats);

  return (
    <Card className="col-span-full">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <StageBox 
            icon={Database} 
            title="PCAP Reader" 
            value={stats.running ? "Reading..." : "Idle"} 
            active={stats.running} 
          />
          <ArrowRight className={`hidden md:block w-6 h-6 ${stats.running ? 'text-primary' : 'text-muted'}`} />
          <StageBox 
            icon={Network} 
            title="Load Balancers" 
            value="Hash 5-Tuple" 
            active={stats.running} 
          />
          <ArrowRight className={`hidden md:block w-6 h-6 ${stats.running ? 'text-primary' : 'text-muted'}`} />
          <StageBox 
            icon={Cpu} 
            title="FastPath Workers" 
            value={`${stats.workers.length} Active`} 
            active={stats.running && stats.workers.length > 0} 
          />
          <ArrowRight className={`hidden md:block w-6 h-6 ${stats.running ? 'text-primary' : 'text-muted'}`} />
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

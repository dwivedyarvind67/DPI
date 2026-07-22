"use client";

import { usePipelineStore } from "@/store/pipelineStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, ShieldAlert, CheckCircle2 } from "lucide-react";

export function SummaryCards() {
  const stats = usePipelineStore((state) => state.stats);

  const formatNumber = (num: number) => new Intl.NumberFormat().format(num);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Packets Read</CardTitle>
          <Network className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalRead)}</div>
          <p className="text-xs text-muted-foreground mt-1">Processed from PCAP input</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Forwarded</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-500">{formatNumber(stats.totalForwarded)}</div>
          <p className="text-xs text-muted-foreground mt-1">Allowed by rule engine</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Dropped</CardTitle>
          <ShieldAlert className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatNumber(stats.totalDropped)}</div>
          <p className="text-xs text-muted-foreground mt-1">Blocked by rule engine</p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePipelineStore } from "@/store/pipelineStore";

export function DownloadButton() {
  const isRunning = usePipelineStore((state) => state.stats.running);

  const handleDownload = () => {
    // This will point to the real Java backend endpoint once connected
    // For now, we simulate a file download prompt
    const dummyData = "Simulated PCAP data from Next.js";
    const blob = new Blob([dummyData], { type: "application/vnd.tcpdump.pcap" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "filtered_output.pcap";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Button 
      onClick={handleDownload} 
      disabled={isRunning}
      size="sm"
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      {isRunning ? "Stop Pipeline to Download" : "Download PCAP"}
    </Button>
  );
}

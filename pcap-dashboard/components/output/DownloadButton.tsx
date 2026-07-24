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
      className="gap-2 shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all hover:shadow-[0_0_25px_rgba(var(--primary),0.5)]"
    >
      <Download className="w-4 h-4" />
      Download PCAP
    </Button>
  );
}

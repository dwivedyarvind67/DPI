import { SummaryCards } from "@/components/output/SummaryCards";
import { RunLog } from "@/components/output/RunLog";
import { DownloadButton } from "@/components/output/DownloadButton";

export default function OutputPage() {
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Output & Summaries</h1>
          <p className="text-muted-foreground mt-1">Review pipeline statistics and download filtered PCAP results.</p>
        </div>
        <DownloadButton />
      </div>

      <SummaryCards />
      <RunLog />
    </div>
  );
}

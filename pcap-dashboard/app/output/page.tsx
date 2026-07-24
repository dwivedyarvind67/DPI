import { SummaryCards } from "@/components/output/SummaryCards";
import { RunLog } from "@/components/output/RunLog";
import { DownloadButton } from "@/components/output/DownloadButton";

export default function OutputPage() {
  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Output & Summaries</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review pipeline statistics and download filtered PCAP results.</p>
        </div>
        <DownloadButton />
      </div>

      <SummaryCards />
      <RunLog />
    </div>
  );
}

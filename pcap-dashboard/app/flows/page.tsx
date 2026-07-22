import { FlowTable } from "@/components/flows/FlowTable";

export default function FlowsPage() {
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Traffic Flows</h1>
        <p className="text-muted-foreground mt-1">Live tracking of individual network connections.</p>
      </div>

      <FlowTable />
    </div>
  );
}

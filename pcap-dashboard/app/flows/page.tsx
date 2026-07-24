import { FlowTable } from "@/components/flows/FlowTable";

export default function FlowsPage() {
  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-6 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight">Traffic Flows</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Live tracking of individual network connections.</p>
      </div>

      <FlowTable />
    </div>
  );
}

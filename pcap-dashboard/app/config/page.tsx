import { UploadCard } from "@/components/config/UploadCard";
import { WorkerCountSlider } from "@/components/config/WorkerCountSlider";
import { RuleEditor } from "@/components/config/RuleEditor";

export default function ConfigPage() {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
        <p className="text-muted-foreground mt-1">Manage engine settings, rules, and input datasets.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="flex flex-col gap-6 col-span-full xl:col-span-1">
          <UploadCard />
          <WorkerCountSlider />
        </div>
        <RuleEditor />
      </div>
    </div>
  );
}

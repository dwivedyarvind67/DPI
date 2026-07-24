import { UploadCard } from "@/components/config/UploadCard";
import { WorkerCountSlider } from "@/components/config/WorkerCountSlider";
import { RuleEditor } from "@/components/config/RuleEditor";

export default function ConfigPage() {
  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Configuration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage engine settings, rules, and input datasets.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="flex flex-col gap-5 col-span-full xl:col-span-1">
          <UploadCard />
          <WorkerCountSlider />
        </div>
        <RuleEditor />
      </div>
    </div>
  );
}

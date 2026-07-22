"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Settings, List, FileDown, ShieldAlert } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const routes = [
    { name: "Monitor", path: "/monitor", icon: Activity },
    { name: "Config", path: "/config", icon: Settings },
    { name: "Flows", path: "/flows", icon: List },
    { name: "Output", path: "/output", icon: FileDown },
  ];

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <ShieldAlert className="w-6 h-6 text-primary mr-2" />
        <span className="font-bold text-lg tracking-tight">DPI Engine</span>
      </div>
      
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        {routes.map((route) => {
          const isActive = pathname.startsWith(route.path);
          const Icon = route.icon;
          
          return (
            <Link
              key={route.path}
              href={route.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {route.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          DPI Engine v2.0 • Status: Idle
        </div>
      </div>
    </div>
  );
}

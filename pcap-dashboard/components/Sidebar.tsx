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
    <div className="w-64 border-r border-border/50 bg-card/40 backdrop-blur-xl flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-10">
      <div className="h-16 flex items-center px-6 border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <ShieldAlert className="w-6 h-6 text-primary mr-3 drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
          DPI Engine
        </span>
      </div>
      
      <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
        {routes.map((route) => {
          const isActive = pathname.startsWith(route.path);
          const Icon = route.icon;
          
          return (
            <Link
              key={route.path}
              href={route.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive 
                  ? "bg-gradient-to-r from-primary/20 to-primary/5 text-primary shadow-[inset_4px_0_0_rgba(var(--primary),1)]" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:translate-x-1"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]' : ''}`} />
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

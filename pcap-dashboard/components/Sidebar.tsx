"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Settings, List, FileDown, ShieldAlert, BookOpen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Sidebar() {
  const pathname = usePathname();

  const routes = [
    { name: "Monitor", path: "/monitor", icon: Activity },
    { name: "Config", path: "/config", icon: Settings },
    { name: "Flows", path: "/flows", icon: List },
    { name: "Output", path: "/output", icon: FileDown },
    { name: "Blog", path: "/blog", icon: BookOpen },
  ];

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <ShieldAlert className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-[15px] tracking-tight text-foreground">
          DPI Engine
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 flex flex-col gap-0.5">
        {routes.map((route) => {
          const isActive = pathname.startsWith(route.path);
          const Icon = route.icon;

          return (
            <Link
              key={route.path}
              href={route.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {route.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-3 pt-2 border-t border-border space-y-2">
        <ThemeToggle />
        <div className="px-3 text-[11px] text-muted-foreground leading-tight">
          DPI Engine v2.0<br />Status: Idle
        </div>
      </div>
    </aside>
  );
}

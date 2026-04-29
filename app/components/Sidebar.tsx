"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Code2,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  const links = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Learning",
      href: "/learning",
      icon: GraduationCap,
    },
    {
      name: "League",
      href: "/league",
      icon: Gamepad2,
    },
    {
      name: "GitHub",
      href: "/github",
      icon: Code2,
    },
    {
      name: "Codex",
      href: "/codex",
      icon: Bot,
    },
  ];

  return (
    <>
      {isExpanded && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-20 bg-black/45 backdrop-blur-sm md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <aside
        className={`h-full border-r border-white/5 bg-card/20 backdrop-blur-xl flex flex-col py-6 px-3 shrink-0 shadow-2xl transition-all duration-300 ease-out ${
          isExpanded
            ? "w-72 items-start fixed inset-y-0 left-0 z-30 md:relative md:inset-auto"
            : "w-20 items-center relative z-10"
        }`}
      >
        <div
          className={`mb-8 flex w-full ${
            isExpanded
              ? "items-center justify-between gap-3 px-2"
              : "flex-col items-center gap-4"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <span
                className="text-white font-bold text-sm"
                style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}
              >
                LP
              </span>
            </div>

            {isExpanded && (
              <span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
                Łukasz
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-zinc-100"
          >
            {isExpanded ? (
              <ChevronLeft className="size-5" />
            ) : (
              <ChevronRight className="size-5" />
            )}
          </button>
        </div>

        <nav className="w-full space-y-3 flex-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.name}
                href={link.href}
                title={isExpanded ? undefined : link.name}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setIsExpanded(false);
                  }
                }}
                className={`flex items-center gap-4 w-full p-3 rounded-2xl transition-all duration-300 group relative ${
                  isExpanded ? "justify-start" : "justify-center"
                } ${
                  isActive
                    ? "bg-white/10 text-zinc-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                }`}
              >
                {isActive && isExpanded && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-lg bg-indigo-500" />
                )}

                <div className="relative">
                  {isActive && (
                    <div className="absolute inset-0 bg-indigo-500/40 blur-xl rounded-full" />
                  )}
                  <Icon
                    className={`relative z-10 flex-shrink-0 size-[22px] transition-transform duration-300 ${
                      isActive ? "text-indigo-400" : "group-hover:scale-110"
                    }`}
                  />
                </div>

                {isExpanded && (
                  <span className={`font-medium ${isActive ? "text-zinc-100" : ""}`}>
                    {link.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {isExpanded && (
          <div className="mt-auto px-2 text-xs font-medium text-zinc-600/80 uppercase tracking-widest text-center w-full">
            Dashboard &copy; {new Date().getFullYear()}
          </div>
        )}
      </aside>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Nauka",
      href: "/learning",
      icon: GraduationCap,
    },
  ];

  return (
    <aside className="w-16 md:w-64 h-full border-r border-white/5 bg-card/20 backdrop-blur-xl flex flex-col items-center md:items-start py-8 px-2 md:px-4 shrink-0 shadow-2xl relative z-10 transition-all duration-300">
      <div className="hidden md:flex items-center gap-3 px-2 mb-8">
        <div className="size-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
          <span className="text-white font-bold text-xs" style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}>LP</span>
        </div>
        <span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
          Łukasz
        </span>
      </div>
      
      {/* Mobile user icon placeholder */}
      <div className="flex md:hidden items-center justify-center mb-8">
        <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
          <span className="text-white font-bold text-sm" style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}>LP</span>
        </div>
      </div>

      <nav className="w-full space-y-3 flex-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center justify-center md:justify-start gap-4 w-full p-3 rounded-2xl transition-all duration-300 group relative ${
                isActive
                  ? "bg-white/10 text-zinc-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-lg bg-indigo-500 hidden md:block" />
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

              <span className={`hidden md:block font-medium ${isActive ? "text-zinc-100" : ""}`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto hidden md:block px-2 text-xs font-medium text-zinc-600/80 uppercase tracking-widest text-center w-full">
        Dashboard &copy; {new Date().getFullYear()}
      </div>
    </aside>
  );
}

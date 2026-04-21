"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function ClockWidget() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return <div className="h-full min-h-[6rem] bg-card rounded-3xl border border-border animate-pulse p-4"></div>;
  }

  return (
    <div className="h-full min-h-[6rem] bg-card rounded-3xl border border-border p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
      <div className="absolute -top-2 -right-2 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
        <Clock size={60} className="text-zinc-100" strokeWidth={1} />
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Obecny czas</p>
        <h2 className="text-2xl md:text-3xl font-bold tabular-nums tracking-tighter text-zinc-100 drop-shadow-sm">
          {format(time, "HH:mm:ss")}
        </h2>
      </div>
      <div className="mt-3 z-10 flex items-center justify-between">
        <p className="text-zinc-300 font-medium text-sm lg:text-base capitalize tracking-tight flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {format(time, "EEEE, d MMMM", { locale: pl })}
        </p>
        <p className="text-zinc-500 text-sm font-medium">
          {format(time, "yyyy", { locale: pl })}
        </p>
      </div>
    </div>
  );
}

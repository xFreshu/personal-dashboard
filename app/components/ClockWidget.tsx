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
    return <div className="h-full min-h-[12rem] bg-card rounded-3xl border border-border animate-pulse p-8"></div>;
  }

  return (
    <div className="h-full min-h-[12rem] bg-card rounded-3xl border border-border p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
      <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
        <Clock size={120} className="text-zinc-100" strokeWidth={1} />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Obecny czas</p>
        <h2 className="text-5xl md:text-6xl font-bold tabular-nums tracking-tighter text-zinc-100 drop-shadow-sm">
          {format(time, "HH:mm:ss")}
        </h2>
      </div>
      <div className="mt-6 z-10 flex items-center justify-between">
        <p className="text-zinc-300 font-medium text-lg lg:text-xl capitalize tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {format(time, "EEEE, d MMMM", { locale: pl })}
        </p>
        <p className="text-zinc-500 font-medium">
          {format(time, "yyyy", { locale: pl })}
        </p>
      </div>
    </div>
  );
}

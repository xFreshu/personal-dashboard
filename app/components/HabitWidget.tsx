"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Dumbbell, BookOpen, Pill } from "lucide-react";
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  isToday,
  isFuture,
  parseISO,
} from "date-fns";
import { pl } from "date-fns/locale";

type HabitKey = "trening" | "nauka" | "suplementacja";

interface HabitEntry {
  habit: string;
  date: string;
  completed: boolean;
}

const HABITS: {
  key: HabitKey;
  label: string;
  emoji: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  ring: string;
  glow: string;
}[] = [
  {
    key: "trening",
    label: "Trening",
    emoji: "🏋️",
    icon: <Dumbbell size={18} />,
    color: "text-amber-400",
    bg: "bg-amber-500",
    ring: "ring-amber-500/40",
    glow: "shadow-amber-500/20",
  },
  {
    key: "nauka",
    label: "Nauka",
    emoji: "📚",
    icon: <BookOpen size={18} />,
    color: "text-violet-400",
    bg: "bg-violet-500",
    ring: "ring-violet-500/40",
    glow: "shadow-violet-500/20",
  },
  {
    key: "suplementacja",
    label: "Suplementacja",
    emoji: "💊",
    icon: <Pill size={18} />,
    color: "text-emerald-400",
    bg: "bg-emerald-500",
    ring: "ring-emerald-500/40",
    glow: "shadow-emerald-500/20",
  },
];

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

export default function HabitWidget() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [completedMap, setCompletedMap] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/habits?year=${year}&month=${month}`);
      const data = await res.json();
      const set = new Set<string>();
      (data.habits as HabitEntry[]).forEach((h) => {
        const dateStr = h.date.split("T")[0];
        set.add(`${h.habit}::${dateStr}`);
      });
      setCompletedMap(set);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleToggle = async (habit: HabitKey, dateStr: string) => {
    const key = `${habit}::${dateStr}`;
    if (toggling === key) return;

    // Optymistyczna aktualizacja
    setToggling(key);
    setCompletedMap((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

    try {
      await fetch("/api/habits/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit, date: dateStr }),
      });
    } catch (e) {
      console.error(e);
      // Cofnij optimistic update przy błędzie
      fetchHabits();
    } finally {
      setToggling(null);
    }
  };

  const prevMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // Generuj komórki kalendarza dla danego miesiąca
  const buildDays = (habitKey: HabitKey) => {
    const daysInMonth = getDaysInMonth(currentDate);
    // Dzień tygodnia pierwszego dnia (ISO: Pn=1...Nd=7)
    let firstDow = getDay(startOfMonth(currentDate)); // 0=nd
    firstDow = firstDow === 0 ? 6 : firstDow - 1; // przesuń na ISO

    const cells: (number | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Uzupełnij do pełnych tygodni
    while (cells.length % 7 !== 0) cells.push(null);

    return cells.map((day, i) => {
      if (!day) return <div key={i} className="h-7 w-7" />;

      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dateObj = parseISO(dateStr);
      const isFutureDay = isFuture(dateObj) && !isToday(dateObj);
      const isTodayDay = isToday(dateObj);
      const isDone = completedMap.has(`${habitKey}::${dateStr}`);
      const habit = HABITS.find((h) => h.key === habitKey)!;
      const toggleKey = `${habitKey}::${dateStr}`;
      const isToggling = toggling === toggleKey;

      return (
        <button
          key={i}
          onClick={() => !isFutureDay && handleToggle(habitKey, dateStr)}
          disabled={isFutureDay || isToggling}
          title={isFutureDay ? "" : dateStr}
          className={`
            h-7 w-7 rounded-md text-xs font-medium transition-all duration-150 flex items-center justify-center
            ${isFutureDay
              ? "opacity-20 cursor-not-allowed text-zinc-600"
              : isDone
              ? `${habit.bg} text-white shadow-md ${habit.glow} scale-105 ring-1 ${habit.ring} cursor-pointer hover:scale-110`
              : `bg-white/5 text-zinc-500 hover:bg-white/10 cursor-pointer hover:text-zinc-300`
            }
            ${isTodayDay && !isDone ? "ring-1 ring-white/30 text-zinc-200" : ""}
            ${isToggling ? "opacity-60" : ""}
          `}
        >
          {day}
        </button>
      );
    });
  };

  const getStreak = (habitKey: HabitKey): number => {
    const daysInMonth = getDaysInMonth(currentDate);
    let streak = 0;
    const isCurrentMonth =
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
    const startDay = isCurrentMonth ? today.getDate() : daysInMonth;

    for (let d = startDay; d >= 1; d--) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (completedMap.has(`${habitKey}::${dateStr}`)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getMonthCount = (habitKey: HabitKey): number => {
    let count = 0;
    const daysInMonth = getDaysInMonth(currentDate);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (completedMap.has(`${habitKey}::${dateStr}`)) count++;
    }
    return count;
  };

  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();
  const daysInMonth = getDaysInMonth(currentDate);
  const passedDays = isCurrentMonth ? today.getDate() : daysInMonth;

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-card/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 lg:p-8 shadow-lg flex flex-col gap-6 relative overflow-hidden group">
      {/* BG decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-24 w-96 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-500/8 transition-colors" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <h3 className="text-zinc-100 font-semibold text-lg">Habit Tracker</h3>
          <p className="text-zinc-500 text-sm mt-0.5">Śledź swoje nawyki miesiąc po miesiącu</p>
        </div>
        {/* Nawigacja miesięcy */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-zinc-300 font-medium text-sm w-28 text-center capitalize">
            {format(currentDate, "LLLL yyyy", { locale: pl })}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Grid nawyków */}
      <div className={`z-10 grid grid-cols-1 xl:grid-cols-3 gap-5 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
        {HABITS.map((habit) => {
          const count = getMonthCount(habit.key);
          const streak = getStreak(habit.key);
          const pct = Math.round((count / passedDays) * 100) || 0;

          return (
            <div
              key={habit.key}
              className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/10 transition-colors"
            >
              {/* Nagłówek nawyku */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-white/5 ${habit.color}`}>
                    {habit.icon}
                  </div>
                  <div>
                    <p className="text-zinc-200 font-semibold text-sm">{habit.label}</p>
                    <p className="text-zinc-500 text-xs">
                      {count}/{passedDays} dni
                      {streak > 1 ? ` · 🔥 ${streak} z rzędu` : ""}
                    </p>
                  </div>
                </div>
                {/* Progress badge */}
                <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${habit.color} bg-white/5`}>
                  {pct}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${habit.bg} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Dni tygodnia */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-[10px] text-zinc-600 font-medium pb-1">
                    {d}
                  </div>
                ))}
                {buildDays(habit.key)}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-zinc-500 text-sm">Ładowanie...</div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import { Calendar, LogIn, LogOut, Clock } from "lucide-react";
import { addDays, addMonths, format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";

type CalendarEvent = {
  id: string;
  summary?: string | null;
  start: {
    date?: string | null;
    dateTime?: string | null;
  };
  end?: {
    date?: string | null;
    dateTime?: string | null;
  };
};

type CalendarResponse = {
  events?: CalendarEvent[];
};

type SessionWithAccessToken = Session & {
  accessToken?: string;
  error?: string;
};

function getEventStartDate(event: CalendarEvent) {
  const startValue = event.start.dateTime ?? event.start.date;
  return startValue ? new Date(startValue) : null;
}

function getEventEndDate(event: CalendarEvent) {
  const endValue = event.end?.dateTime ?? event.end?.date;
  return endValue ? new Date(endValue) : null;
}

function formatEventTimeRange(event: CalendarEvent) {
  const startDate = getEventStartDate(event);
  const endDate = getEventEndDate(event);

  if (!startDate) {
    return "Brak daty";
  }

  if (event.start.date) {
    if (!endDate) return "Cały dzień";

    const inclusiveEnd = addDays(endDate, -1);
    if (isSameDay(startDate, inclusiveEnd)) {
      return "Cały dzień";
    }

    return `${format(startDate, "d MMM", { locale: pl })} - ${format(inclusiveEnd, "d MMM", { locale: pl })}`;
  }

  if (!endDate) {
    return `Od ${format(startDate, "HH:mm")}`;
  }

  if (isSameDay(startDate, endDate)) {
    return `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`;
  }

  return `${format(startDate, "d MMM HH:mm", { locale: pl })} - ${format(endDate, "d MMM HH:mm", { locale: pl })}`;
}

function eventOccursOnDate(event: CalendarEvent, date: Date) {
  const startDate = getEventStartDate(event);
  const endDate = getEventEndDate(event);

  if (!startDate) return false;
  if (!endDate) return isSameDay(date, startDate);

  const inclusiveEnd = event.start.date ? addDays(endDate, -1) : endDate;
  return startOfDay(date) <= inclusiveEnd && endOfDay(date) >= startDate;
}

function MiniMonthCalendar({
  month,
  events,
}: {
  month: Date;
  events: CalendarEvent[];
}) {
  const firstDay = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const lastDay = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: firstDay, end: lastDay });
  const weekDays = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

  return (
    <div className="min-w-0 rounded-2xl border border-white/5 bg-white/[0.025] p-4 shadow-inner">
      <h4 className="mb-4 text-center font-medium capitalize text-zinc-100">
        {format(month, "MMMM yyyy", { locale: pl })}
      </h4>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((day) => (
          <div key={day} className="pb-2 text-xs font-medium text-zinc-500">
            {day}
          </div>
        ))}
        {calendarDays.map((date) => {
          const isCurrentMonth = isSameMonth(date, month);
          const isTodayDate = isToday(date);
          const dayEvents = events.filter((event) => eventOccursOnDate(event, date));
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={date.toISOString()}
              className={`
                group/day relative mx-auto flex size-8 cursor-default items-center justify-center rounded-full text-sm transition-all
                ${!isCurrentMonth ? "text-zinc-700" : "text-zinc-300"}
                ${isTodayDate ? "bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20" : ""}
                ${!isTodayDate && hasEvents ? "border border-blue-500/30" : ""}
                ${!isTodayDate && hasEvents && isCurrentMonth ? "bg-blue-500/10" : ""}
                ${!isTodayDate && !hasEvents && isCurrentMonth ? "hover:bg-white/5" : ""}
              `}
            >
              {format(date, "d")}
              {hasEvents && (
                <div className="pointer-events-none absolute left-1/2 bottom-[calc(100%+0.6rem)] z-40 hidden w-64 -translate-x-1/2 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 text-left text-xs font-normal text-zinc-200 shadow-2xl backdrop-blur group-hover/day:block">
                  <p className="mb-2 font-semibold capitalize text-zinc-100">
                    {format(date, "d MMMM yyyy", { locale: pl })}
                  </p>
                  <div className="space-y-2">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="border-l border-blue-500/50 pl-2">
                        <p className="line-clamp-2 font-medium text-zinc-100">
                          {event.summary || "(Brak tytułu)"}
                        </p>
                        <p className="mt-0.5 text-zinc-500">{formatEventTimeRange(event)}</p>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-zinc-500">+{dayEvents.length - 3} więcej</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CalendarWidget() {
  const { data: session, status } = useSession();
  const typedSession = session as SessionWithAccessToken | null;
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const loading = status === "authenticated" && events === null;

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/calendar");
        const data = (await res.json()) as CalendarResponse;
        const nextEvents = data.events ?? [];
        const sortedEvents = [...nextEvents].sort((a, b) => {
          const dateA = getEventStartDate(a)?.getTime() ?? 0;
          const dateB = getEventStartDate(b)?.getTime() ?? 0;
          return dateA - dateB;
        });

        if (!cancelled) {
          setEvents(sortedEvents.slice(0, 6));
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setEvents([]);
        }
      }
    };

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading") {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[16rem] bg-card/40 border border-white/5 rounded-3xl p-8 flex items-center justify-center shadow-lg">
        <div className="animate-pulse flex items-center gap-2 text-zinc-400">
           Wczytywanie...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg transition-all hover:border-white/10 group">
        <div className="h-16 w-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Calendar size={32} />
        </div>
        <h3 className="text-zinc-200 font-semibold text-xl mb-2">Kalendarz</h3>
        <p className="text-zinc-400 text-sm max-w-md mb-6">
          Zaloguj się przez Google, aby widzieć swoje nadchodzące spotkania i wydarzenia bezpośrednio na dashboardzie.
        </p>
        <button
          onClick={() => signIn("google")}
          className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
        >
          <LogIn size={18} />
          Zaloguj przez Google
        </button>
      </div>
    );
  }

  const today = new Date();
  const nextMonth = addMonths(today, 1);

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-card/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 lg:p-8 shadow-lg flex flex-col gap-6 relative overflow-hidden group">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>

      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-2xl">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-zinc-100 font-semibold text-lg">Twój Kalendarz</h3>
            <p className="text-zinc-400 text-sm">{typedSession?.user?.email}</p>
          </div>
        </div>
        
        <button
          onClick={() => signOut()}
          className="text-zinc-500 hover:text-zinc-300 p-2 rounded-full hover:bg-white/5 transition-all outline-none"
          title="Wyloguj"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="z-10 mt-2 grid grid-cols-1 2xl:grid-cols-[40rem_minmax(0,1fr)] gap-6">
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MiniMonthCalendar month={today} events={events ?? []} />
          <MiniMonthCalendar month={nextMonth} events={events ?? []} />
        </div>

        {/* Prawa kolumna: Wydarzenia */}
        <div className="min-w-0">
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               {[1, 2, 3, 4, 5, 6].map(i => (
                 <div key={i} className="h-28 bg-white/5 animate-pulse rounded-2xl w-full"></div>
               ))}
             </div>
          ) : (events ?? []).length === 0 ? (
            <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-zinc-400">Brak nadchodzących wydarzeń! 🎉</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(events ?? []).map((event) => {
                const startDate = getEventStartDate(event) ?? new Date();
                const fmtDate = format(startDate, "d MMM", { locale: pl });
                const fmtTime = event.start.dateTime ? format(startDate, "HH:mm") : "Cały";

                return (
                  <div key={event.id} className="bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07] transition-all rounded-2xl p-5 flex flex-col justify-between min-h-[7rem]">
                    <h4 className="text-zinc-100 font-medium line-clamp-2 mb-3" title={event.summary ?? undefined}>
                      {event.summary || "(Brak tytułu)"}
                    </h4>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-blue-400 text-sm bg-blue-500/10 px-3 py-1 rounded-full w-fit">
                        <Clock size={14} />
                        <span>{fmtTime}</span>
                      </div>
                      <span className="text-zinc-500 text-xs text-right capitalize">{fmtDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Calendar, LogIn, LogOut, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";

export default function CalendarWidget() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      fetch("/api/calendar")
        .then((res) => res.json())
        .then((data) => {
          if (data.events) {
            setEvents(data.events);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
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

  // Obliczenia dla mini-kalendarza
  const today = new Date();
  const firstDay = startOfWeek(startOfMonth(today), { weekStartsOn: 1 });
  const lastDay = endOfWeek(endOfMonth(today), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: firstDay, end: lastDay });
  const weekDays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

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
            <p className="text-zinc-400 text-sm">{session?.user?.email}</p>
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

      <div className="z-10 mt-2 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lewa kolumna: Mini Kalendarz */}
        <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col items-center shadow-inner">
          <h4 className="text-zinc-100 font-medium mb-4 capitalize">{format(today, 'MMMM yyyy', { locale: pl })}</h4>
          <div className="grid grid-cols-7 gap-1 w-full text-center">
            {weekDays.map(day => (
              <div key={day} className="text-xs text-zinc-500 font-medium pb-2">{day}</div>
            ))}
            {calendarDays.map((date, i) => {
              const isCurrentMonth = isSameMonth(date, today);
              const isTodayDate = isToday(date);
              
              // Sprawdzamy czy w tym dniu są jakieś wydarzenia (wizualne podświetlenie)
              const hasEvents = events.some(ev => {
                  const evDate = ev.start.dateTime ? new Date(ev.start.dateTime) : new Date(ev.start.date);
                  return isSameDay(date, evDate);
              });
              
              return (
                <div 
                  key={i} 
                  className={`
                    w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm transition-all
                    ${!isCurrentMonth ? 'text-zinc-700' : 'text-zinc-300'}
                    ${isTodayDate ? 'bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20' : ''}
                    ${!isTodayDate && hasEvents ? 'border border-blue-500/30' : ''}
                    ${!isTodayDate && hasEvents && isCurrentMonth ? 'bg-blue-500/10' : ''}
                    ${!isTodayDate && !hasEvents && isCurrentMonth ? 'hover:bg-white/5' : ''}
                  `}
                >
                  {format(date, 'd')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Prawa kolumna: Wydarzenia */}
        <div className="lg:col-span-2">
          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className="h-28 bg-white/5 animate-pulse rounded-2xl w-full"></div>
               ))}
             </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-zinc-400">Brak nadchodzących wydarzeń! 🎉</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((event) => {
                const startDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date);
                const fmtDate = format(startDate, "d MMM", { locale: pl });
                const fmtTime = event.start.dateTime ? format(startDate, "HH:mm") : "Cały";

                return (
                  <div key={event.id} className="bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07] transition-all rounded-2xl p-5 flex flex-col justify-between min-h-[7rem]">
                    <h4 className="text-zinc-100 font-medium line-clamp-2 mb-3" title={event.summary}>
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

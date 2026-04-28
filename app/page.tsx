import ClockWidget from "./components/ClockWidget";
import WeatherWidget from "./components/WeatherWidget";
import CalendarWidget from "./components/CalendarWidget";
import HabitWidget from "./components/HabitWidget";
import LolRankWidget from "./components/LolRankWidget";

export default function Home() {
  return (
    <main className="min-h-full bg-background p-6 md:p-8 lg:p-10">
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="col-span-1 md:col-span-1 lg:col-span-1">
            <ClockWidget />
          </div>
          <div className="col-span-1 md:col-span-1 lg:col-span-1">
            <WeatherWidget />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <LolRankWidget />
          </div>

          <CalendarWidget />
          <HabitWidget />
        </div>
      </div>
    </main>
  );
}

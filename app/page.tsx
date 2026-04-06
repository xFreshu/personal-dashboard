import ClockWidget from "./components/ClockWidget";
import WeatherWidget from "./components/WeatherWidget";
import CalendarWidget from "./components/CalendarWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-6 md:p-12 lg:p-20">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        
        {/* Header / Welcome Section */}
        <header className="space-y-3">
          <p className="text-zinc-400 font-medium tracking-wide uppercase text-sm">Internal Team Dashboard</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Cześć, <span className="text-white">Łukasz</span> 👋
          </h1>
          <p className="text-zinc-500 max-w-lg mt-2 text-lg">
            Oto Twoje podsumowanie na dziś. Sprawdź aktualności ze swojego zespołu.
          </p>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
             <ClockWidget />
          </div>
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
             <WeatherWidget />
          </div>
          
          <CalendarWidget />
        </div>
        
      </div>
    </main>
  );
}

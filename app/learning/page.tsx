import { GraduationCap, ArrowRight, BookOpen, Clock } from "lucide-react";

export default function LearningPage() {
  const categories = [
    { name: "Programowanie", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10" },
    { name: "Języki obce", icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { name: "Rozwój osobisty", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <main className="min-h-screen p-6 md:p-8 lg:p-10 w-full overflow-y-auto w-full">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <GraduationCap className="size-6" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
              Centrum Nauki
            </h1>
          </div>
          <p className="text-zinc-400 max-w-2xl mt-2 text-lg">
            Twoja przestrzeń do organizacji materiałów edukacyjnych, śledzenia postępów i robienia notatek.
          </p>
        </header>

        {/* Dashboard Grid placeholder for Learning */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className="group relative overflow-hidden rounded-3xl bg-card/40 backdrop-blur-md border border-white/5 p-6 shadow-lg hover:border-white/10 transition-all duration-500 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col h-full gap-6">
                <div className={`w-fit p-3 rounded-2xl ${category.bg} ${category.color} transition-transform duration-500 group-hover:scale-110 shadow-inner`}>
                  <category.icon className="size-6" />
                </div>
                
                <div>
                  <h3 className="font-semibold text-xl text-zinc-100 mb-2">{category.name}</h3>
                  <p className="text-sm text-zinc-500">
                    Rozwiń tę sekcję w przyszłości, aby przeglądać notatki i materiały.
                  </p>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors duration-300">
                  <span>Otwórz materiały</span>
                  <ArrowRight className="size-4 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

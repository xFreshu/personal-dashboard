import LeagueDashboard from "../components/LeagueDashboard";

export default function LeaguePage() {
  return (
    <main className="min-h-full bg-background p-6 md:p-8 lg:p-10">
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <LeagueDashboard />
      </div>
    </main>
  );
}

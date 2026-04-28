import CodexStatusPanel from "../components/CodexStatusPanel";
import CodexTokensWidget from "../components/CodexTokensWidget";

export default function CodexPage() {
  return (
    <main className="min-h-full bg-background p-6 md:p-8 lg:p-10">
      <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <CodexStatusPanel />
        <CodexTokensWidget />
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bot,
  Clock3,
  Cpu,
  Gauge,
} from "lucide-react";

type CodexTokensResponse =
  | {
      configured: false;
      missing: string[];
    }
  | {
      configured: true;
      error?: string;
      summary: {
        totalTokens: number;
        totalThreads: number;
        todayTokens: number;
        weekTokens: number;
        monthTokens: number;
        activeToday: number;
        updatedAt: number | null;
      };
      days: {
        day: string;
        tokens: number;
        threads: number;
      }[];
      models: {
        model: string;
        tokens: number;
        threads: number;
      }[];
      recentThreads: {
        id: string;
        title: string;
        tokens: number;
        model: string;
        updatedAt: number;
      }[];
    };

const numberFormat = new Intl.NumberFormat("pl-PL");
const compactNumberFormat = new Intl.NumberFormat("pl-PL", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const dayFormat = new Intl.DateTimeFormat("pl-PL", { weekday: "short" });
const relativeTimeFormat = new Intl.RelativeTimeFormat("pl-PL", {
  numeric: "auto",
});

function formatTokens(value: number) {
  if (value >= 100_000) return compactNumberFormat.format(value);
  return numberFormat.format(value);
}

function formatRelativeTime(value: number | null) {
  if (!value) return "brak aktywnosci";

  const diffMs = value - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormat.format(diffMinutes, "minute");
  }

  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormat.format(diffHours, "hour");
  }

  return relativeTimeFormat.format(diffDays, "day");
}

function formatDayLabel(day: string) {
  const label = dayFormat.format(new Date(`${day}T12:00:00`)).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Gauge;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        <Icon className="size-3.5 text-cyan-300" />
        <span>{label}</span>
      </div>
      <p className="text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

export default function CodexTokensWidget() {
  const [data, setData] = useState<CodexTokensResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchUsage = async () => {
      try {
        const response = await fetch("/api/codex/tokens", { cache: "no-store" });
        const payload = (await response.json()) as CodexTokensResponse;

        if (!cancelled) {
          setData(payload);
        }
      } catch {
        if (!cancelled) {
          setData({
            configured: true,
            error: "Nie udalo sie pobrac zuzycia tokenow Codexa.",
            summary: {
              totalTokens: 0,
              totalThreads: 0,
              todayTokens: 0,
              weekTokens: 0,
              monthTokens: 0,
              activeToday: 0,
              updatedAt: null,
            },
            days: [],
            models: [],
            recentThreads: [],
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUsage();
    const interval = setInterval(fetchUsage, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const maxDayTokens = useMemo(() => {
    if (!data?.configured) return 0;
    return Math.max(...data.days.map((day) => day.tokens), 1);
  }, [data]);

  if (loading) {
    return (
      <div className="h-full min-h-[22rem] rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="h-full animate-pulse rounded-2xl bg-white/[0.03]" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (!data.configured) {
    return (
      <div className="h-full min-h-[22rem] rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex h-full flex-col justify-center gap-3 text-center">
          <AlertCircle className="mx-auto size-8 text-amber-300" />
          <h2 className="text-lg font-semibold text-zinc-100">Brak bazy Codexa</h2>
          <p className="text-sm text-zinc-500">{data.missing.join(", ")}</p>
        </div>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="h-full min-h-[22rem] rounded-3xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group transition-all duration-300 hover:border-zinc-700">
      <div className="absolute -right-4 -top-4 p-4 opacity-[0.04] transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.08]">
        <Bot className="text-zinc-100" size={86} strokeWidth={1} />
      </div>

      <div className="relative z-10 flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Codex
            </p>
            <h2 className="text-2xl font-bold text-zinc-100">
              {formatTokens(summary.todayTokens)}
              <span className="ml-2 text-sm font-medium text-zinc-500">tokenow dzis</span>
            </h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-cyan-400/10 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200">
            <Clock3 className="size-3.5" />
            <span>{formatRelativeTime(summary.updatedAt)}</span>
          </div>
        </div>

        {data.error ? (
          <div className="rounded-2xl border border-rose-400/10 bg-rose-400/10 p-3 text-sm text-rose-200">
            {data.error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatTile
                icon={Activity}
                label="7 dni"
                value={formatTokens(summary.weekTokens)}
              />
              <StatTile
                icon={Gauge}
                label="30 dni"
                value={formatTokens(summary.monthTokens)}
              />
              <StatTile
                icon={Cpu}
                label="Watki"
                value={numberFormat.format(summary.totalThreads)}
              />
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Ostatnie 7 dni
                </p>
                <p className="text-xs text-zinc-500">
                  {formatTokens(summary.totalTokens)} lacznie
                </p>
              </div>
              <div className="flex h-24 items-end gap-2">
                {data.days.map((day) => {
                  const height = Math.max((day.tokens / maxDayTokens) * 100, day.tokens > 0 ? 8 : 3);

                  return (
                    <div key={day.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div className="flex h-16 w-full items-end">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500 to-emerald-300 shadow-[0_0_18px_rgba(34,211,238,0.16)]"
                          style={{ height: `${height}%` }}
                          title={`${formatTokens(day.tokens)} tokenow, watki: ${day.threads}`}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-500">
                        {formatDayLabel(day.day)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Modele
                </p>
                <div className="space-y-2">
                  {data.models.map((model) => (
                    <div key={model.model} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-zinc-300">{model.model}</span>
                      <span className="font-medium text-cyan-200">{formatTokens(model.tokens)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Ostatnie watki
                </p>
                <div className="space-y-2">
                  {data.recentThreads.slice(0, 3).map((thread) => (
                    <div key={thread.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-zinc-300">{thread.title}</span>
                      <span className="shrink-0 font-medium text-zinc-100">
                        {formatTokens(thread.tokens)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

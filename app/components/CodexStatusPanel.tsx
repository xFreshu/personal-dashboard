"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Clock3, CreditCard, Gauge, HardDrive, Shield } from "lucide-react";
import { Skeleton } from "./Skeleton";

type RateLimitWindow = {
  usedPercent: number;
  windowDurationMins: number | null;
  resetsAt: number | null;
};

type RateLimitSnapshot = {
  limitId: string | null;
  limitName: string | null;
  primary: RateLimitWindow | null;
  secondary: RateLimitWindow | null;
  credits: {
    hasCredits: boolean;
    unlimited: boolean;
    balance: string | null;
  } | null;
  planType: string | null;
  rateLimitReachedType: string | null;
};

type CodexStatusResponse =
  | {
      configured: false;
      missing: string[];
    }
  | {
      configured: true;
      status?: {
        account: null | {
          type: string;
          email?: string;
          planType?: string;
        };
        requiresOpenaiAuth: boolean | null;
        rateLimits: RateLimitSnapshot | null;
        rateLimitsByLimitId: Record<string, RateLimitSnapshot> | null;
        error: string | null;
        latestSession: null | {
          id: string;
          title: string;
          model: string | null;
          reasoningEffort: string | null;
          cwd: string;
          approvalMode: string;
          sandboxPolicy: string;
          updatedAt: number;
        };
      };
    };

const relativeTimeFormat = new Intl.RelativeTimeFormat("pl-PL", {
  numeric: "auto",
});
const timeFormat = new Intl.DateTimeFormat("pl-PL", {
  hour: "2-digit",
  minute: "2-digit",
});
const dateTimeFormat = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function leftPercent(window: RateLimitWindow | null | undefined) {
  if (!window) return null;
  return Math.max(0, Math.min(100, 100 - window.usedPercent));
}

function formatReset(timestamp: number | null | undefined) {
  if (!timestamp) return "brak resetu";

  const date = new Date(timestamp * 1000);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormat.format(diffMinutes, "minute");
  }

  if (Math.abs(diffHours) < 24) {
    return timeFormat.format(date);
  }

  return dateTimeFormat.format(date);
}

function parsePermissions(raw: string | undefined) {
  if (!raw) return "Custom";

  try {
    const parsed = JSON.parse(raw) as { type?: string };
    if (parsed.type === "workspace-write") return "workspace-write";
    if (parsed.type === "read-only") return "read-only";
    if (parsed.type === "danger-full-access") return "danger-full-access";
  } catch {
    return raw;
  }

  return raw;
}

function LimitRow({
  label,
  window,
}: {
  label: string;
  window: RateLimitWindow | null | undefined;
}) {
  const remaining = leftPercent(window);
  const barWidth = remaining ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-zinc-300">{label}</span>
        <span className="text-zinc-100">
          {remaining === null ? "brak danych" : `${remaining}% left`}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500">reset: {formatReset(window?.resetsAt)}</p>
    </div>
  );
}

export default function CodexStatusPanel() {
  const [data, setData] = useState<CodexStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/codex/tokens", { cache: "no-store" });
        const payload = (await response.json()) as CodexStatusResponse;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2 * 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const status = data?.configured ? data.status : null;
  const rateLimits = status?.rateLimitsByLimitId?.codex ?? status?.rateLimits ?? null;
  const accountLabel = useMemo(() => {
    if (!status?.account) return "brak konta";
    if (status.account.type === "chatgpt") {
      return `${status.account.email ?? "ChatGPT"} (${status.account.planType ?? "unknown"})`;
    }

    return status.account.type;
  }, [status]);

  if (loading) {
    return (
      <div className="min-h-[26rem] rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="h-8 w-56 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-48 rounded-full" />
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                <Skeleton className="mb-3 h-3 w-24 rounded-full" />
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="mt-2 h-3 w-20 rounded-full" />
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <Skeleton className="mb-5 h-4 w-32 rounded-full" />
              <div className="space-y-5">
                {[0, 1].map((item) => (
                  <div key={item} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <Skeleton className="h-4 w-20 rounded-full" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full" />
                    <Skeleton className="h-3 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <Skeleton className="mb-4 h-3 w-24 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="mt-2 h-4 w-2/3 rounded-full" />
              <div className="mt-5 border-t border-white/5 pt-4">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="mt-3 h-4 w-64 max-w-full rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm relative overflow-hidden">
      <div className="absolute -right-6 -top-6 p-4 opacity-[0.04]">
        <Bot className="text-zinc-100" size={116} strokeWidth={1} />
      </div>

      <div className="relative z-10 space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
              OpenAI Codex
            </p>
            <h1 className="text-2xl font-bold text-zinc-100">
              {status?.latestSession?.model ?? "gpt-5.5"}
              <span className="ml-2 text-sm font-medium text-zinc-500">
                {status?.latestSession?.reasoningEffort ?? "medium"}
              </span>
            </h1>
          </div>
          <div className="rounded-full border border-emerald-400/10 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
            {accountLabel}
          </div>
        </div>

        {status?.error && (
          <div className="rounded-2xl border border-amber-400/10 bg-amber-400/10 p-3 text-sm text-amber-100">
            {status.error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              <Shield className="size-3.5 text-cyan-300" />
              <span>Permissions</span>
            </div>
            <p className="text-sm font-semibold text-zinc-100">
              {parsePermissions(status?.latestSession?.sandboxPolicy)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{status?.latestSession?.approvalMode ?? "on-request"}</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              <CreditCard className="size-3.5 text-emerald-300" />
              <span>Credits</span>
            </div>
            <p className="text-sm font-semibold text-zinc-100">
              {rateLimits?.credits?.unlimited
                ? "unlimited"
                : rateLimits?.credits?.balance ?? "0"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {rateLimits?.credits?.hasCredits ? "aktywne kredyty" : "bez dodatkowych kredytow"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              <Gauge className="size-3.5 text-cyan-300" />
              <span>Rate plan</span>
            </div>
            <p className="text-sm font-semibold text-zinc-100">{rateLimits?.planType ?? "unknown"}</p>
            <p className="mt-1 text-xs text-zinc-500">{rateLimits?.limitId ?? "codex"}</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              <HardDrive className="size-3.5 text-emerald-300" />
              <span>Session</span>
            </div>
            <p className="truncate text-sm font-semibold text-zinc-100">
              {status?.latestSession?.id ?? "brak sesji"}
            </p>
            <p className="mt-1 truncate text-xs text-zinc-500">
              {status?.latestSession?.title ?? "Codex"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              <Clock3 className="size-4 text-cyan-300" />
              <span>Tak jak /status</span>
            </div>
            <div className="space-y-5">
              <LimitRow label="5h limit" window={rateLimits?.primary} />
              <LimitRow label="Weekly limit" window={rateLimits?.secondary} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Directory
            </p>
            <p className="break-words text-sm text-zinc-300">
              {status?.latestSession?.cwd ?? "~/Desktop/project-2026/personal-dashboard"}
            </p>
            <div className="mt-5 border-t border-white/5 pt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Usage page
              </p>
              <a
                href="https://chatgpt.com/codex/settings/usage"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-sm font-medium text-cyan-200 hover:text-cyan-100"
              >
                chatgpt.com/codex/settings/usage
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

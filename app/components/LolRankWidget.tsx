"use client";

import { useEffect, useState } from "react";
import {
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trophy,
} from "lucide-react";

type RankedQueue = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  winRate: number;
};

type AccountRankData = {
  profile: {
    gameName: string;
    tagLine: string;
    platform: string;
    summonerLevel?: number;
  };
  error: string | null;
  primaryQueue: RankedQueue | null;
  soloQueue: RankedQueue | null;
  flexQueue: RankedQueue | null;
  links: {
    overview: string;
    champions: string;
    live: string;
  };
};

type LolRankResponse =
  | {
      configured: false;
      missing: string[];
      error?: string;
    }
  | {
      configured: true;
      error?: string;
      accounts: AccountRankData[];
    };

function tierColor(tier?: string) {
  switch (tier) {
    case "IRON":
      return "text-zinc-400";
    case "BRONZE":
      return "text-amber-600";
    case "SILVER":
      return "text-slate-300";
    case "GOLD":
      return "text-yellow-400";
    case "PLATINUM":
      return "text-cyan-400";
    case "EMERALD":
      return "text-emerald-400";
    case "DIAMOND":
      return "text-blue-400";
    case "MASTER":
      return "text-fuchsia-400";
    case "GRANDMASTER":
      return "text-rose-400";
    case "CHALLENGER":
      return "text-orange-300";
    default:
      return "text-zinc-100";
  }
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-zinc-100"
    >
      <span>{label}</span>
      <ExternalLink className="size-3.5" />
    </a>
  );
}

function QueueLabel({
  label,
  queue,
}: {
  label: string;
  queue: RankedQueue | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-medium ${tierColor(queue?.tier)}`}>
        {queue ? `${queue.tier} ${queue.rank}` : "Unranked"}
      </span>
    </div>
  );
}

export default function LolRankWidget() {
  const [data, setData] = useState<LolRankResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchRank = async () => {
      try {
        const response = await fetch("/api/lol/rank", { cache: "no-store" });
        const payload = (await response.json()) as LolRankResponse;

        if (!cancelled) {
          setData(payload);
        }
      } catch {
        if (!cancelled) {
          setData({
            configured: true,
            error: "Nie udało się pobrać danych LoL.",
            accounts: [],
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRank();
    const interval = setInterval(fetchRank, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const accountCount =
    data && data.configured
      ? data.accounts.length
      : 0;

  useEffect(() => {
    if (accountCount <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % accountCount);
    }, 10_000);

    return () => clearInterval(interval);
  }, [accountCount]);

  useEffect(() => {
    if (accountCount === 0) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((current) => current % accountCount);
  }, [accountCount]);

  const showPrevious = () => {
    if (accountCount <= 1) return;
    setActiveIndex((current) => (current - 1 + accountCount) % accountCount);
  };

  const showNext = () => {
    if (accountCount <= 1) return;
    setActiveIndex((current) => (current + 1) % accountCount);
  };

  if (loading) {
    return (
      <div className="h-full min-h-[9.25rem] bg-card rounded-3xl border border-border animate-pulse p-4" />
    );
  }

  if (!data) {
    return null;
  }

  if (!data.configured) {
    return (
      <div className="h-full min-h-[9.25rem] bg-card rounded-3xl border border-border p-4 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
        <div className="absolute -top-4 -right-4 p-4 opacity-[0.04] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-500">
          <Trophy className="text-zinc-100" size={60} strokeWidth={1} />
        </div>
        <div className="relative z-10 flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">League Rank</p>
              <h3 className="text-zinc-100 font-semibold text-lg">Brak konfiguracji</h3>
            </div>
            <div className="rounded-full bg-fuchsia-500/10 px-2.5 py-1 text-[11px] font-medium text-fuchsia-300">
              Riot
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <p className="text-xs text-zinc-300">Brakujące zmienne</p>
            <p className="mt-2 text-xs text-zinc-500 break-words">{data.missing.join(", ")}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentAccount = data.accounts[activeIndex];

  if (!currentAccount) {
    return (
      <div className="h-full min-h-[9.25rem] bg-card rounded-3xl border border-border p-4 flex items-center justify-center text-zinc-500 shadow-sm">
        <p>Brak kont do wyświetlenia.</p>
      </div>
    );
  }

  const riotId = `${currentAccount.profile.gameName}#${currentAccount.profile.tagLine}`;
  const primaryQueue = currentAccount.primaryQueue;
  const summaryLabel = primaryQueue
    ? `${primaryQueue.leaguePoints} LP · ${primaryQueue.wins}W-${primaryQueue.losses}L`
    : "Brak aktywnej rangi";

  return (
    <div className="h-full min-h-[9.25rem] bg-card rounded-3xl border border-border p-4 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
      <div className="absolute -top-4 -right-4 p-4 opacity-[0.04] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-500">
        <Trophy className="text-zinc-100" size={60} strokeWidth={1} />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">League Rank</p>
              <h3 className="text-sm font-semibold text-zinc-100 truncate">{riotId}</h3>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="relative group/tooltip">
                <button
                  type="button"
                  aria-label="Pokaż szczegóły solo i flex"
                  className="flex size-8 items-center justify-center rounded-full text-zinc-400 transition-all hover:bg-white/10 hover:text-zinc-100"
                >
                  <CircleHelp size={15} />
                </button>
                <div className="pointer-events-none absolute right-0 top-9 z-20 w-44 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 text-left opacity-0 shadow-2xl transition-all duration-200 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:opacity-100 translate-y-1">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    Kolejki
                  </p>
                  <div className="space-y-2">
                    <QueueLabel label="Solo/Duo" queue={currentAccount.soloQueue} />
                    <QueueLabel label="Flex" queue={currentAccount.flexQueue} />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={showPrevious}
                disabled={accountCount <= 1}
                aria-label="Poprzednie konto"
                className="flex size-8 items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-zinc-100 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={showNext}
                disabled={accountCount <= 1}
                aria-label="Następne konto"
                className="flex size-8 items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-zinc-100 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-1 flex items-center justify-between gap-3 text-xs">
            <p className="text-zinc-500 truncate">
              {currentAccount.profile.platform}
              {currentAccount.profile.summonerLevel
                ? ` · lvl ${currentAccount.profile.summonerLevel}`
                : ""}
            </p>
            <p className="text-zinc-600 shrink-0">
              {activeIndex + 1}/{accountCount}
            </p>
          </div>

          {data.error && (
            <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200">
              {data.error}
            </div>
          )}

          {currentAccount.error ? (
            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200">
              {currentAccount.error}
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider">
                    {primaryQueue ? "Aktualna ranga" : "Status"}
                  </p>
                  <h4 className={`mt-1 text-[2rem] leading-none font-bold ${tierColor(primaryQueue?.tier)}`}>
                    {primaryQueue
                      ? `${primaryQueue.tier} ${primaryQueue.rank}`
                      : "Unranked"}
                  </h4>
                </div>
                {primaryQueue && (
                  <div className="pb-1 text-right">
                    <p className="text-base font-semibold text-zinc-100">
                      {primaryQueue.leaguePoints} LP
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{summaryLabel}</span>
              </div>

              {primaryQueue && (
                <div className="mt-1 text-[11px] text-zinc-600">
                  {primaryQueue.winRate}% win rate
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-600">
            Auto co 10s
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            <LinkButton href={currentAccount.links.overview} label="DPM" />
            <LinkButton href={currentAccount.links.live} label="Live" />
          </div>
        </div>
      </div>
    </div>
  );
}

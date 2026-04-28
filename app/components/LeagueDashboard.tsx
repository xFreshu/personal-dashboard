"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ExternalLink,
  Flame,
  Gamepad2,
  RefreshCw,
  Swords,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "./Skeleton";

type Match = {
  matchId: string;
  gameCreation: number;
  gameEndTimestamp: number | null;
  gameDuration: number;
  gameMode: string;
  queueId: number;
  queueName: string;
  championName: string;
  championIconUrl: string;
  position: string;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  csPerMinute: number;
  damage: number;
  gold: number;
  visionScore: number;
  win: boolean;
  laneOpponent: {
    riotId: string;
    dpmUrl: string | null;
    championName: string;
    championIconUrl: string;
    position: string;
  } | null;
  details: {
    championLevel: number;
    killParticipation: number;
    damageShare: number;
    goldShare: number;
    wardsPlaced: number;
    wardsKilled: number;
    controlWards: number;
    damageTaken: number;
    damageMitigated: number;
    objectiveDamage: number;
    turretDamage: number;
    healing: number;
    ccScore: number;
    largestMultiKill: string;
  };
  teams: Array<{
    teamId: number;
    name: string;
    win: boolean;
    kills: number;
    deaths: number;
    assists: number;
    gold: number;
    damage: number;
    objectives: {
      barons: number;
      dragons: number;
      grubs: number;
      heralds: number;
      inhibitors: number;
      towers: number;
    };
    participants: Array<{
      puuid: string;
      riotId: string;
      dpmUrl: string | null;
      teamId: number;
      championName: string;
      championIconUrl: string;
      position: string;
      kills: number;
      deaths: number;
      assists: number;
      kda: number;
      cs: number;
      csPerMinute: number;
      damage: number;
      gold: number;
      visionScore: number;
      win: boolean;
      isCurrentPlayer: boolean;
    }>;
  }>;
};

type AccountMatches = {
  accountIndex?: number;
  profile: {
    gameName: string;
    tagLine: string;
    platform: string;
  };
  error: string | null;
  links: {
    overview: string;
    champions: string;
    live: string;
    opgg: string;
  };
  summary: {
    games: number;
    wins: number;
    losses: number;
    winRate: number;
    avgKda: number;
    avgCsPerMinute: number;
    avgDamage: number;
    avgVision: number;
    favoriteChampion: string | null;
    mainPosition: string | null;
  };
  matches: Match[];
  pagination: {
    start: number;
    count: number;
    nextStart: number;
    hasMore: boolean;
  };
};

type LeagueMatchesResponse =
  | {
      configured: false;
      missing: string[];
    }
  | {
      configured: true;
      accounts: AccountMatches[];
    };

const MATCH_PAGE_SIZE = 8;

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pl-PL").format(value);
}

function kdaLabel(match: Match) {
  return `${match.kills}/${match.deaths}/${match.assists}`;
}

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function getMode(values: string[]) {
  if (values.length === 0) return null;

  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function summarizeLoadedMatches(matches: Match[], fallback: AccountMatches["summary"]) {
  if (matches.length === 0) return fallback;

  const wins = matches.filter((match) => match.win).length;

  return {
    games: matches.length,
    wins,
    losses: matches.length - wins,
    winRate: Math.round((wins / matches.length) * 100),
    avgKda: round(matches.reduce((sum, match) => sum + match.kda, 0) / matches.length, 2),
    avgCsPerMinute: round(
      matches.reduce((sum, match) => sum + match.csPerMinute, 0) / matches.length,
    ),
    avgDamage: Math.round(matches.reduce((sum, match) => sum + match.damage, 0) / matches.length),
    avgVision: round(matches.reduce((sum, match) => sum + match.visionScore, 0) / matches.length),
    favoriteChampion: getMode(matches.map((match) => match.championName)),
    mainPosition: getMode(matches.map((match) => match.position)),
  };
}

function ExternalButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-zinc-100"
    >
      {children}
      <ExternalLink className="size-3.5" />
    </a>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone = "text-zinc-100",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
        <Icon className="size-4 text-zinc-400" />
        <span>{label}</span>
      </div>
      <p className={`text-2xl font-semibold tracking-tight ${tone}`}>{value}</p>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function ObjectivePill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${tone}`}>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-current/70">{label}</p>
      <p className="mt-1 text-sm font-semibold text-current">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-5">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="mt-3 h-8 w-64 rounded-xl" />
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  );
}

export default function LeagueDashboard() {
  const [data, setData] = useState<LeagueMatchesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchMatches = useCallback(
    async ({
      accountIndex,
      start = 0,
      append = false,
    }: {
      accountIndex?: number;
      start?: number;
      append?: boolean;
    } = {}) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setRefreshing(true);
      }

      try {
        const params = new URLSearchParams({
          start: String(start),
          count: String(MATCH_PAGE_SIZE),
        });

        if (accountIndex !== undefined) {
          params.set("account", String(accountIndex));
        }

        const response = await fetch(`/api/lol/matches?${params.toString()}`, { cache: "no-store" });
        const payload = (await response.json()) as LeagueMatchesResponse;

        if (!append) {
          setData(payload);
          return;
        }

        setData((current) => {
          if (!current?.configured || !payload.configured) {
            return current;
          }

          const pageAccount = payload.accounts[0];
          if (!pageAccount) return current;

          return {
            configured: true,
            accounts: current.accounts.map((account, index) => {
              const targetIndex = pageAccount.accountIndex ?? accountIndex;
              if (index !== targetIndex) return account;

              const existingIds = new Set(account.matches.map((match) => match.matchId));
              const newMatches = pageAccount.matches.filter((match) => !existingIds.has(match.matchId));
              const matches = [...account.matches, ...newMatches];

              return {
                ...account,
                error: pageAccount.error,
                matches,
                summary: summarizeLoadedMatches(matches, pageAccount.summary),
                pagination: pageAccount.pagination,
              };
            }),
          };
        });
      } catch {
        if (!append) {
          setData({
            configured: true,
            accounts: [],
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function refreshIfMounted() {
      if (!cancelled) {
        await fetchMatches();
      }
    }

    refreshIfMounted();
    const interval = setInterval(refreshIfMounted, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchMatches]);

  const accountCount = data?.configured ? data.accounts.length : 0;
  const activeAccount = data?.configured ? data.accounts[activeIndex] : null;
  const activeSummary = activeAccount
    ? summarizeLoadedMatches(activeAccount.matches, activeAccount.summary)
    : null;

  useEffect(() => {
    if (accountCount === 0) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((current) => current % accountCount);
  }, [accountCount]);

  const bestMatch = useMemo(() => {
    if (!activeAccount) return null;
    return [...activeAccount.matches].sort((a, b) => b.kda - a.kda)[0] ?? null;
  }, [activeAccount]);

  const loadMoreMatches = useCallback(async () => {
    if (!activeAccount?.pagination.hasMore || loadingMore) return;

    await fetchMatches({
      accountIndex: activeIndex,
      start: activeAccount.pagination.nextStart,
      append: true,
    });
  }, [activeAccount, activeIndex, fetchMatches, loadingMore]);

  useEffect(() => {
    const node = loadMoreRef.current;

    if (
      !node ||
      typeof IntersectionObserver === "undefined" ||
      !activeAccount?.pagination.hasMore ||
      loadingMore
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMoreMatches();
        }
      },
      { rootMargin: "600px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [activeAccount?.pagination.hasMore, activeAccount?.pagination.nextStart, loadMoreMatches, loadingMore]);

  if (loading) {
    return <LoadingState />;
  }

  if (!data) {
    return null;
  }

  if (!data.configured) {
    return (
      <section className="rounded-3xl border border-border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">League of Legends</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">Brak konfiguracji Riot</h1>
        <p className="mt-3 text-sm text-zinc-500">
          Uzupełnij zmienne: {data.missing.join(", ")}.
        </p>
      </section>
    );
  }

  if (!activeAccount) {
    return (
      <section className="rounded-3xl border border-border bg-card p-5 text-zinc-500">
        Brak kont League do wyświetlenia.
      </section>
    );
  }

  const riotId = `${activeAccount.profile.gameName}#${activeAccount.profile.tagLine}`;
  const formTone = (activeSummary?.winRate ?? 0) >= 50 ? "text-emerald-300" : "text-rose-300";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              League of Legends
            </p>
            <h1 className="mt-2 truncate text-3xl font-semibold tracking-tight text-zinc-100">
              {riotId}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Historia ostatnich {activeSummary?.games ?? 0} gier · auto odświeżanie co 5 min
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void fetchMatches()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Odśwież
            </button>
            <ExternalButton href={activeAccount.links.overview}>DPM</ExternalButton>
            <ExternalButton href={activeAccount.links.champions}>Championy DPM</ExternalButton>
            <ExternalButton href={activeAccount.links.live}>Live DPM</ExternalButton>
            <ExternalButton href={activeAccount.links.opgg}>OP.GG</ExternalButton>
          </div>
        </div>

        {accountCount > 1 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {data.accounts.map((account, index) => (
              <button
                key={`${account.profile.gameName}-${account.profile.tagLine}-${account.profile.platform}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                  index === activeIndex
                    ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-200"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                }`}
              >
                {account.profile.gameName}#{account.profile.tagLine}
              </button>
            ))}
          </div>
        )}

        {activeAccount.error && (
          <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
              <div>
                <p className="font-semibold">Nie udało się pobrać świeżej historii.</p>
                <p className="mt-1 text-amber-100/75">{activeAccount.error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatTile
            icon={Trophy}
            label="Forma"
            value={`${activeSummary?.wins ?? 0}W-${activeSummary?.losses ?? 0}L`}
            tone={formTone}
          />
          <StatTile
            icon={Swords}
            label="Win rate"
            value={`${activeSummary?.winRate ?? 0}%`}
            tone={formTone}
          />
          <StatTile
            icon={Target}
            label="Śr. KDA"
            value={(activeSummary?.avgKda ?? 0).toFixed(2)}
          />
          <StatTile
            icon={BarChart3}
            label="CS/min"
            value={(activeSummary?.avgCsPerMinute ?? 0).toFixed(1)}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Match history
              </p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-100">Ostatnie gry</h2>
            </div>
            <Gamepad2 className="size-5 text-zinc-500" />
          </div>

          {activeAccount.matches.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-500">
              Brak meczów do pokazania.
            </div>
          ) : (
            <div className="space-y-3">
              {activeAccount.matches.map((match) => (
                <article
                  key={match.matchId}
                  className={`rounded-2xl border transition-colors ${
                    match.win
                      ? "border-emerald-400/15 bg-emerald-500/[0.06]"
                      : "border-rose-400/15 bg-rose-500/[0.06]"
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={expandedMatchId === match.matchId}
                    onClick={() =>
                      setExpandedMatchId((current) =>
                        current === match.matchId ? null : match.matchId,
                      )
                    }
                    className="grid w-full gap-4 p-4 text-left md:grid-cols-[minmax(10rem,1fr)_minmax(20rem,auto)_minmax(10rem,1fr)] md:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-2 w-2 rounded-full ${
                            match.win ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        <p className={`text-sm font-semibold ${match.win ? "text-emerald-200" : "text-rose-200"}`}>
                          {match.win ? "Wygrana" : "Porażka"}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {match.queueName} · {formatDuration(match.gameDuration)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">{formatDate(match.gameCreation)}</p>
                    </div>

                    <div className="min-w-0 md:justify-self-center md:w-full">
                      <div className="mx-auto grid max-w-md grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-3">
                        <img
                          src={match.championIconUrl}
                          alt=""
                          className="size-12 justify-self-center rounded-xl border border-white/10 object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0 text-center">
                          <h3 className="truncate text-lg font-semibold text-zinc-100">
                            {match.championName}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs">
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-zinc-300">
                              {match.position}
                            </span>
                            {match.laneOpponent ? (
                              <span className="rounded-full border border-rose-400/20 bg-rose-500/10 px-2 py-1 text-rose-200">
                                vs {match.laneOpponent.championName}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {match.laneOpponent ? (
                          <img
                            src={match.laneOpponent.championIconUrl}
                            alt=""
                            className="size-12 justify-self-center rounded-xl border border-rose-300/20 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="size-12" />
                        )}
                      </div>

                      <div className="mx-auto mt-3 grid max-w-xl gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                            KDA
                          </p>
                          <p className="mt-1 text-sm font-semibold text-zinc-100">
                            {kdaLabel(match)} ({match.kda.toFixed(2)})
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                            CS
                          </p>
                          <p className="mt-1 text-sm font-semibold text-zinc-100">
                            {match.cs} ({match.csPerMinute.toFixed(1)}/min)
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                            DMG
                          </p>
                          <p className="mt-1 text-sm font-semibold text-zinc-100">
                            {formatNumber(match.damage)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                            Vision
                          </p>
                          <p className="mt-1 text-sm font-semibold text-zinc-100">
                            {match.visionScore}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-left md:justify-self-end md:justify-end md:text-right">
                      <div>
                        <p className="text-xs text-zinc-500">Match ID</p>
                        <p className="mt-1 max-w-40 truncate text-xs font-medium text-zinc-300">
                          {match.matchId}
                        </p>
                      </div>
                      <ChevronDown
                        className={`size-4 shrink-0 text-zinc-500 transition-transform ${
                          expandedMatchId === match.matchId ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {expandedMatchId === match.matchId && (
                    <div className="border-t border-white/10 p-4 pt-5">
                      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                        <StatPill label="KP" value={`${match.details.killParticipation.toFixed(1)}%`} />
                        <StatPill label="DMG share" value={`${match.details.damageShare.toFixed(1)}%`} />
                        <StatPill label="Gold share" value={`${match.details.goldShare.toFixed(1)}%`} />
                        <StatPill label="Level" value={String(match.details.championLevel)} />
                        <StatPill label="Control" value={String(match.details.controlWards)} />
                        <StatPill label="Multi" value={match.details.largestMultiKill} />
                      </div>

                      {match.laneOpponent ? (
                        <div className="mt-4 rounded-2xl border border-indigo-400/15 bg-indigo-500/[0.07] p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-200/75">
                                Matchup na linii
                              </p>
                              <p className="mt-1 text-sm text-zinc-300">
                                {match.position}: {match.championName} vs {match.laneOpponent.championName}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                                <img
                                  src={match.championIconUrl}
                                  alt=""
                                  className="size-8 rounded-lg border border-white/10 object-cover"
                                  loading="lazy"
                                />
                                <span className="text-sm font-medium text-zinc-100">{match.championName}</span>
                              </div>
                              <span className="text-zinc-500">vs</span>
                              {match.laneOpponent.dpmUrl ? (
                                <a
                                  href={match.laneOpponent.dpmUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/20"
                                >
                                  <img
                                    src={match.laneOpponent.championIconUrl}
                                    alt=""
                                    className="size-8 rounded-lg border border-rose-300/20 object-cover"
                                    loading="lazy"
                                  />
                                  <span>{match.laneOpponent.championName}</span>
                                  <ExternalLink className="size-3.5" />
                                </a>
                              ) : (
                                <div className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-100">
                                  <img
                                    src={match.laneOpponent.championIconUrl}
                                    alt=""
                                    className="size-8 rounded-lg border border-rose-300/20 object-cover"
                                    loading="lazy"
                                  />
                                  <span>{match.laneOpponent.championName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        {match.teams.map((team) => (
                          <div
                            key={`${match.matchId}-${team.teamId}`}
                            className={`rounded-2xl border p-3 ${
                              team.name === "Twoja drużyna"
                                ? "border-emerald-400/15 bg-emerald-500/[0.05]"
                                : "border-rose-400/15 bg-rose-500/[0.05]"
                            }`}
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-zinc-100">{team.name}</p>
                                <p className="text-xs text-zinc-500">
                                  {team.kills}/{team.deaths}/{team.assists} · {formatNumber(team.gold)} gold
                                </p>
                              </div>
                              <p className={`text-xs font-semibold ${team.win ? "text-emerald-300" : "text-rose-300"}`}>
                                {team.win ? "Win" : "Loss"}
                              </p>
                            </div>

                            <div className="mb-3 grid grid-cols-2 gap-2 xl:grid-cols-3">
                              <ObjectivePill
                                label="Wieże"
                                value={team.objectives.towers}
                                tone="border-sky-400/20 bg-sky-500/10 text-sky-100"
                              />
                              <ObjectivePill
                                label="Smoki"
                                value={team.objectives.dragons}
                                tone="border-violet-400/20 bg-violet-500/10 text-violet-100"
                              />
                              <ObjectivePill
                                label="Barony"
                                value={team.objectives.barons}
                                tone="border-amber-400/20 bg-amber-500/10 text-amber-100"
                              />
                              <ObjectivePill
                                label="Larwy"
                                value={team.objectives.grubs}
                                tone="border-teal-400/20 bg-teal-500/10 text-teal-100"
                              />
                              <ObjectivePill
                                label="Herald"
                                value={team.objectives.heralds}
                                tone="border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100"
                              />
                              <ObjectivePill
                                label="Inhib"
                                value={team.objectives.inhibitors}
                                tone="border-zinc-400/20 bg-zinc-500/10 text-zinc-100"
                              />
                            </div>

                            <div className="space-y-2">
                              {team.participants.map((participant) => (
                                (() => {
                                  const enemyHref =
                                    team.name === "Rywal" && !participant.isCurrentPlayer
                                      ? participant.dpmUrl
                                      : null;
                                  const clickable = Boolean(enemyHref);
                                  const content = (
                                    <>
                                      <img
                                        src={participant.championIconUrl}
                                        alt=""
                                        className="size-9 rounded-lg border border-white/10 object-cover"
                                        loading="lazy"
                                      />
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="truncate text-xs font-medium text-zinc-100">
                                            {participant.riotId}
                                          </p>
                                          {clickable ? (
                                            <ExternalLink className="size-3 text-rose-200/70" />
                                          ) : null}
                                        </div>
                                        <p className="text-[11px] text-zinc-500">
                                          {participant.championName} · {participant.position}
                                        </p>
                                      </div>
                                      <div className="text-right text-[11px] text-zinc-400">
                                        <p className="font-medium text-zinc-200">
                                          KDA {participant.kills}/{participant.deaths}/{participant.assists} (
                                          {participant.kda.toFixed(2)})
                                        </p>
                                        <p>{formatNumber(participant.damage)} dmg</p>
                                      </div>
                                    </>
                                  );

                                  const className = `grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-2 transition-colors ${
                                    participant.isCurrentPlayer
                                      ? "bg-indigo-500/15 ring-1 ring-indigo-400/30"
                                      : clickable
                                        ? "bg-rose-500/[0.08] hover:bg-rose-500/[0.14]"
                                        : "bg-white/[0.03]"
                                  }`;

                                  if (clickable) {
                                    return (
                                      <a
                                        key={`${match.matchId}-${participant.puuid}`}
                                        href={enemyHref ?? undefined}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={className}
                                      >
                                        {content}
                                      </a>
                                    );
                                  }

                                  return (
                                    <div
                                      key={`${match.matchId}-${participant.puuid}`}
                                      className={className}
                                    >
                                      {content}
                                    </div>
                                  );
                                })()
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <StatPill label="Taken" value={formatNumber(match.details.damageTaken)} />
                        <StatPill label="Mitigated" value={formatNumber(match.details.damageMitigated)} />
                        <StatPill label="Objective dmg" value={formatNumber(match.details.objectiveDamage)} />
                        <StatPill label="CC score" value={String(match.details.ccScore)} />
                      </div>
                    </div>
                  )}
                </article>
              ))}

              <div ref={loadMoreRef} className="flex justify-center pt-2">
                {activeAccount.pagination.hasMore ? (
                  <button
                    type="button"
                    onClick={loadMoreMatches}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw className={`size-3.5 ${loadingMore ? "animate-spin" : ""}`} />
                    {loadingMore ? "Pobieram..." : "Pokaż kolejne"}
                  </button>
                ) : (
                  <p className="text-xs text-zinc-600">To już wszystkie pobrane mecze.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Flame className="size-5 text-orange-300" />
              <h2 className="text-lg font-semibold text-zinc-100">Szybki scouting</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Najczęstszy pick</p>
                <p className="mt-1 text-xl font-semibold text-zinc-100">
                  {activeSummary?.favoriteChampion ?? "Brak danych"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Główna pozycja</p>
                <p className="mt-1 text-xl font-semibold text-zinc-100">
                  {activeSummary?.mainPosition ?? "Brak danych"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Śr. obrażenia</p>
                <p className="mt-1 text-xl font-semibold text-zinc-100">
                  {formatNumber(activeSummary?.avgDamage ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Śr. vision score</p>
                <p className="mt-1 text-xl font-semibold text-zinc-100">
                  {(activeSummary?.avgVision ?? 0).toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          {bestMatch && (
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <Activity className="size-5 text-emerald-300" />
                <h2 className="text-lg font-semibold text-zinc-100">Najlepszy mecz</h2>
              </div>
              <p className="text-2xl font-semibold text-zinc-100">{bestMatch.championName}</p>
              <p className="mt-2 text-sm text-zinc-500">
                {kdaLabel(bestMatch)} · {bestMatch.kda.toFixed(2)} KDA · {bestMatch.queueName}
              </p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

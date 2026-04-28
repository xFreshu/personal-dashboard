"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Code2,
  GitCommitHorizontal,
  GitPullRequest,
  RadioTower,
  Star,
  Workflow,
} from "lucide-react";
import { Skeleton } from "./Skeleton";

type ContributionDay = {
  date: string;
  contributionCount: number;
  color: string;
};

type ContributionWeek = {
  days: ContributionDay[];
  monthKey: string;
};

type GitHubRepository = {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  pushedAt: string | null;
  stats: {
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
    openPullRequests: number;
  };
  latestCommits: {
    sha: string;
    shortSha: string;
    message: string;
    author: string | null;
    date: string | null;
    url: string;
  }[];
  openIssues: {
    id: number;
    number: number;
    title: string;
    url: string;
    updatedAt: string;
  }[];
  openPullRequests: {
    id: number;
    number: number;
    title: string;
    url: string;
    updatedAt: string;
    draft: boolean;
  }[];
  latestRelease: {
    id: number;
    name: string | null;
    tagName: string;
    url: string;
    publishedAt: string | null;
    prerelease: boolean;
  } | null;
  actions: {
    latestRuns: {
      id: number;
      name: string | null;
      url: string;
      status: string;
      conclusion: string | null;
      event: string;
      branch: string | null;
      createdAt: string;
      updatedAt: string;
    }[];
    failedCount: number;
  };
};

type GitHubWidgetResponse =
  | {
      configured: false;
      missing: string[];
    }
  | {
      configured: true;
      hasToken?: boolean;
      error?: string;
      profile?: {
        login: string;
        name: string | null;
        avatarUrl: string;
        url: string;
        bio: string | null;
        followers: number;
        following: number;
        publicRepos: number;
      };
      contributions?: {
        available: boolean;
        reason?: string;
        totals?: {
          contributions: number;
          commits: number;
          issues: number;
          pullRequests: number;
          reviews: number;
          repositories: number;
          restricted: number;
        };
        calendar?: ContributionDay[];
      };
      aggregate?: {
        publicRepos: number;
        stars: number;
        forks: number;
        openIssues: number;
        openPullRequests: number;
        failedWorkflowRuns: number;
      };
      events?: {
        id: string;
        type: string;
        repo: string;
        createdAt: string;
        label: string;
        detail: string;
        href: string;
      }[];
      repositories?: GitHubRepository[];
      errors?: string[];
    };

const numberFormat = new Intl.NumberFormat("pl-PL");
const relativeTimeFormat = new Intl.RelativeTimeFormat("pl-PL", {
  numeric: "auto",
});
const monthLabelFormat = new Intl.DateTimeFormat("pl-PL", { month: "short" });
const fullDateFormat = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatNumber(value: number) {
  return numberFormat.format(value);
}

function formatRelativeDate(dateValue?: string | null) {
  if (!dateValue) return "brak daty";

  const date = new Date(dateValue);
  const diffMs = date.getTime() - Date.now();
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

function statusColor(status?: string | null) {
  if (status === "success") return "bg-emerald-500";
  if (status === "failure" || status === "timed_out" || status === "cancelled") {
    return "bg-rose-500";
  }
  if (status === "in_progress" || status === "queued" || status === "waiting") {
    return "bg-sky-400";
  }
  return "bg-zinc-500";
}

function formatMonthLabel(dateValue: string) {
  const label = monthLabelFormat.format(new Date(dateValue)).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatContributionLabel(count: number) {
  if (count === 0) return "Brak commitów";
  if (count === 1) return "1 commit";
  if (count < 5) return `${count} commity`;
  return `${count} commitów`;
}

function contributionColor(count: number, maxCount: number) {
  if (count === 0) return "#27272a";
  const ratio = count / Math.max(maxCount, 1);
  if (ratio <= 0.25) return "#14532d";
  if (ratio <= 0.5) return "#15803d";
  if (ratio <= 0.75) return "#22c55e";
  return "#86efac";
}

function monthKey(dateValue: string) {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function StatPill({
  label,
  value,
  tone = "zinc",
}: {
  label: string;
  value: string | number;
  tone?: "zinc" | "emerald" | "rose" | "sky" | "amber";
}) {
  const tones = {
    zinc: "border-white/5 bg-white/[0.03] text-zinc-300",
    emerald: "border-emerald-500/15 bg-emerald-500/10 text-emerald-300",
    rose: "border-rose-500/15 bg-rose-500/10 text-rose-300",
    sky: "border-sky-500/15 bg-sky-500/10 text-sky-300",
    amber: "border-amber-500/15 bg-amber-500/10 text-amber-300",
  };

  return (
    <div className={`rounded-2xl border px-3 py-2 ${tones[tone]}`}>
      <p className="text-[11px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-zinc-500">
      {children}
    </div>
  );
}

export default function GitHubWidget() {
  const [data, setData] = useState<GitHubWidgetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRepoIndex, setActiveRepoIndex] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchGitHub = async () => {
      try {
        const response = await fetch("/api/github", { cache: "no-store" });
        const payload = (await response.json()) as GitHubWidgetResponse;

        if (!cancelled) {
          setData(payload);
        }
      } catch {
        if (!cancelled) {
          setData({
            configured: true,
            error: "Nie udało się pobrać danych GitHub.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchGitHub();
    const interval = setInterval(fetchGitHub, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const repositories = data?.configured ? data.repositories ?? [] : [];
  const activeRepo = repositories[activeRepoIndex] ?? repositories[0];

  useEffect(() => {
    if (repositories.length === 0) {
      setActiveRepoIndex(0);
      return;
    }

    setActiveRepoIndex((current) => current % repositories.length);
  }, [repositories.length]);

  const contributionDays = useMemo(() => {
    if (!data?.configured || !data.contributions?.available) return [];
    return data.contributions.calendar ?? [];
  }, [data]);

  const contributionWeeks = useMemo(() => {
    const weeks: ContributionWeek[] = [];

    for (let index = 0; index < contributionDays.length; index += 7) {
      const days = contributionDays.slice(index, index + 7);
      const firstDay = days[0];

      if (firstDay) {
        weeks.push({
          days,
          monthKey: monthKey(firstDay.date),
        });
      }
    }

    return weeks;
  }, [contributionDays]);

  const contributionMonthMarkers = useMemo(() => {
    const markers: {
      key: string;
      label: string;
      start: number;
      span: number;
      total: number;
    }[] = [];

    contributionWeeks.forEach((week, index) => {
      const firstDay = week.days[0];
      if (!firstDay) return;

      const lastMarker = markers[markers.length - 1];
      if (lastMarker?.key === week.monthKey) {
        lastMarker.span += 1;
        lastMarker.total += week.days.reduce((sum, day) => sum + day.contributionCount, 0);
        return;
      }

      markers.push({
        key: week.monthKey,
        label: formatMonthLabel(firstDay.date),
        start: index + 1,
        span: 1,
        total: week.days.reduce((sum, day) => sum + day.contributionCount, 0),
      });
    });

    return markers;
  }, [contributionWeeks]);

  const contributionMonthStarts = useMemo(
    () => new Set(contributionMonthMarkers.map((marker) => marker.start)),
    [contributionMonthMarkers],
  );

  const contributionStats = useMemo(() => {
    const activeDays = contributionDays.filter((day) => day.contributionCount > 0);
    const maxCount = Math.max(0, ...contributionDays.map((day) => day.contributionCount));
    const bestDay =
      contributionDays.find((day) => day.contributionCount === maxCount && maxCount > 0) ?? null;

    return {
      activeDays: activeDays.length,
      maxCount,
      bestDay,
    };
  }, [contributionDays]);

  if (loading) {
    return (
      <div className="h-full min-h-[28rem] rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex h-full flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-14 shrink-0 rounded-2xl" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-3 w-28 rounded-full" />
                <Skeleton className="h-5 w-44 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[29rem]">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2">
                  <Skeleton className="h-3 w-12 rounded-full" />
                  <Skeleton className="mt-2 h-4 w-10 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-36 rounded-full" />
                  <Skeleton className="h-7 w-56 rounded-lg" />
                  <Skeleton className="h-3 w-72 max-w-full rounded-full" />
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                  <Skeleton className="h-3 w-24 rounded-full" />
                  <Skeleton className="mt-2 h-4 w-28 rounded-full" />
                  <Skeleton className="mt-2 h-3 w-36 rounded-full" />
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-950/70 p-4">
                <Skeleton className="mb-3 h-4 w-full rounded-full" />
                <div className="grid grid-cols-[repeat(26,0.875rem)] gap-1 overflow-hidden">
                  {Array.from({ length: 104 }).map((_, index) => (
                    <Skeleton key={index} className="size-3.5 rounded-[4px]" />
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2">
                    <Skeleton className="h-3 w-16 rounded-full" />
                    <Skeleton className="mt-2 h-4 w-10 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(28rem,0.75fr)]">
              {[0, 1].map((section) => (
                <div key={section} className="rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                  <Skeleton className="mb-4 h-3 w-40 rounded-full" />
                  <div className="space-y-2">
                    {[0, 1, 2].map((line) => (
                      <Skeleton key={line} className="h-10 w-full rounded-2xl" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (!data.configured) {
    return (
      <div className="h-full min-h-[18rem] rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-zinc-500/10 p-3 text-zinc-300">
            <Code2 size={24} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">GitHub</p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-100">Brak konfiguracji</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Dodaj zmienne: {data.missing.join(", ")}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (data.error || !data.profile || !data.aggregate) {
    return (
      <div className="h-full min-h-[18rem] rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 text-rose-200">
          <AlertCircle size={20} />
          <p className="text-sm">{data.error ?? "Brak danych GitHub."}</p>
        </div>
      </div>
    );
  }

  const contributionTotals = data.contributions?.totals;
  const selectedContributionDay = hoveredDay ?? contributionStats.bestDay;

  return (
    <div className="h-full min-h-[28rem] rounded-3xl border border-border bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-5 shadow-sm transition-all duration-300 hover:border-zinc-700">
      <div className="flex h-full flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="size-14 shrink-0 rounded-2xl border border-white/10 bg-cover bg-center"
              style={{ backgroundImage: `url(${data.profile.avatarUrl})` }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-zinc-400" />
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  GitHub Pulse
                </p>
              </div>
              <a
                href={data.profile.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex max-w-full items-center gap-1.5 text-lg font-semibold text-zinc-100 hover:text-white"
              >
                <span className="truncate">{data.profile.name ?? data.profile.login}</span>
                <ArrowUpRight size={16} className="shrink-0 text-zinc-500" />
              </a>
              <p className="mt-0.5 truncate text-sm text-zinc-500">@{data.profile.login}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[29rem]">
            <StatPill label="Repos" value={formatNumber(data.aggregate.publicRepos)} />
            <StatPill label="Stars" value={formatNumber(data.aggregate.stars)} tone="amber" />
            <StatPill
              label="PR"
              value={formatNumber(data.aggregate.openPullRequests)}
              tone="sky"
            />
            <StatPill
              label="Failed CI"
              value={formatNumber(data.aggregate.failedWorkflowRuns)}
              tone={data.aggregate.failedWorkflowRuns > 0 ? "rose" : "emerald"}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-inner">
            <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Contribution graph
                </p>
                <h4 className="mt-1 text-xl font-semibold text-zinc-100">
                  {contributionTotals
                    ? `${formatNumber(contributionTotals.commits)} commitów / rok`
                    : "Wymaga tokena"}
                </h4>
                <p className="mt-1 text-xs text-zinc-500">
                  Roczny widok aktywności, podzielony granicami miesięcy.
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {selectedContributionDay ? "Wybrany dzień" : "Dzień"}
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">
                  {selectedContributionDay
                    ? formatContributionLabel(selectedContributionDay.contributionCount)
                    : "Brak danych"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {selectedContributionDay
                    ? fullDateFormat.format(new Date(selectedContributionDay.date))
                    : "Najedź na kratkę, żeby zobaczyć szczegóły."}
                </p>
              </div>
            </div>

            {contributionDays.length > 0 ? (
              <div
                className="overflow-x-auto rounded-2xl border border-white/5 bg-zinc-950/70 p-4 pb-3"
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div className="inline-grid min-w-max grid-cols-1 gap-y-2">
                  <div
                    className="grid h-5 gap-1 text-[11px] leading-5 text-zinc-500"
                    style={{
                      gridTemplateColumns: `repeat(${contributionWeeks.length}, 0.875rem)`,
                    }}
                  >
                    {contributionMonthMarkers.map((marker) => (
                      <span
                        key={marker.key}
                        className="truncate border-l border-white/10 pl-1"
                        style={{
                          gridColumn: `${marker.start} / span ${marker.span}`,
                        }}
                        title={`${marker.label}: ${formatNumber(marker.total)}`}
                      >
                        {marker.label}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-1">
                    {contributionWeeks.map((week, weekIndex) => {
                      const isMonthStart = contributionMonthStarts.has(weekIndex + 1);

                      return (
                        <div
                          key={`${week.monthKey}-${weekIndex}`}
                          className={`grid grid-rows-7 gap-1 ${
                            isMonthStart
                              ? "relative before:absolute before:-left-0.5 before:top-0 before:h-full before:w-px before:bg-white/10"
                              : ""
                          }`}
                        >
                          {week.days.map((day) => (
                            <button
                              key={day.date}
                              type="button"
                              aria-label={`${formatContributionLabel(day.contributionCount)} ${fullDateFormat.format(new Date(day.date))}`}
                              onMouseEnter={() => setHoveredDay(day)}
                              onFocus={() => setHoveredDay(day)}
                              onBlur={() => setHoveredDay(null)}
                              className="size-3.5 rounded-[4px] border border-black/30 outline-none transition-transform hover:scale-125 focus-visible:scale-125 focus-visible:ring-2 focus-visible:ring-emerald-300/70"
                              style={{
                                backgroundColor: contributionColor(
                                  day.contributionCount,
                                  contributionStats.maxCount,
                                ),
                              }}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-zinc-600">
                    <span>Mniej</span>
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const count = Math.ceil(contributionStats.maxCount * ratio);

                      return (
                        <span
                          key={ratio}
                          className="size-3.5 rounded-[4px] border border-black/30"
                          style={{
                            backgroundColor: contributionColor(
                              count,
                              contributionStats.maxCount,
                            ),
                          }}
                        />
                      );
                    })}
                    <span>Więcej</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyLine>
                {data.contributions?.reason ??
                  "Dodaj GITHUB_TOKEN, aby pokazać contribution calendar."}
              </EmptyLine>
            )}

            {contributionTotals && (
              <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-6">
                <StatPill label="Commits" value={formatNumber(contributionTotals.commits)} />
                <StatPill label="Aktywne dni" value={formatNumber(contributionStats.activeDays)} />
                <StatPill label="Najlepszy dzień" value={formatNumber(contributionStats.maxCount)} />
                <StatPill label="Issues" value={formatNumber(contributionTotals.issues)} />
                <StatPill label="PR" value={formatNumber(contributionTotals.pullRequests)} />
                <StatPill label="Reviews" value={formatNumber(contributionTotals.reviews)} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(28rem,0.75fr)]">
            <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-4">
              <div className="mb-3 flex items-center gap-2">
                <RadioTower size={16} className="text-zinc-500" />
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Ostatnia publiczna aktywność
                </p>
              </div>
              <div className="space-y-2">
                {(data.events ?? []).length > 0 ? (
                  (data.events ?? []).slice(0, 5).map((event) => (
                    <a
                      key={event.id}
                      href={event.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm transition-colors hover:bg-white/5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-zinc-200">
                          {event.detail}
                        </span>
                        <span className="text-xs text-zinc-500">{event.label}</span>
                      </span>
                      <span className="shrink-0 text-xs text-zinc-600">
                        {formatRelativeDate(event.createdAt)}
                      </span>
                    </a>
                  ))
                ) : (
                  <EmptyLine>Brak ostatnich publicznych eventów.</EmptyLine>
                )}
              </div>
            </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Wybrane repo
                </p>
                {activeRepo ? (
                  <a
                    href={activeRepo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex max-w-full items-center gap-1.5 text-lg font-semibold text-zinc-100 hover:text-white"
                  >
                    <span className="truncate">{activeRepo.fullName}</span>
                    <ArrowUpRight size={16} className="shrink-0 text-zinc-500" />
                  </a>
                ) : (
                  <h4 className="mt-1 text-lg font-semibold text-zinc-100">Brak repozytoriów</h4>
                )}
              </div>
              <Code2 size={22} className="shrink-0 text-zinc-600" />
            </div>

            {repositories.length > 1 && (
              <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
                {repositories.map((repo, index) => (
                  <button
                    key={repo.fullName}
                    type="button"
                    onClick={() => setActiveRepoIndex(index)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      activeRepoIndex === index
                        ? "bg-white text-zinc-950"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                    }`}
                  >
                    {repo.name}
                  </button>
                ))}
              </div>
            )}

            {activeRepo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <StatPill label="Stars" value={activeRepo.stats.stars} tone="amber" />
                  <StatPill label="Forks" value={activeRepo.stats.forks} />
                  <StatPill label="Watch" value={activeRepo.stats.watchers} />
                  <StatPill label="Issues" value={activeRepo.stats.openIssues} />
                  <StatPill label="PR" value={activeRepo.stats.openPullRequests} tone="sky" />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <GitCommitHorizontal size={15} />
                      Commity
                    </div>
                    <div className="space-y-2">
                      {activeRepo.latestCommits.length > 0 ? (
                        activeRepo.latestCommits.map((commit) => (
                          <a
                            key={commit.sha}
                            href={commit.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-2xl px-3 py-2 transition-colors hover:bg-white/5"
                          >
                            <p className="truncate text-sm font-medium text-zinc-200">
                              {commit.message}
                            </p>
                            <p className="mt-1 text-xs text-zinc-600">
                              {commit.shortSha} · {formatRelativeDate(commit.date)}
                            </p>
                          </a>
                        ))
                      ) : (
                        <EmptyLine>Brak commitów.</EmptyLine>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <Workflow size={15} />
                      GitHub Actions
                    </div>
                    <div className="space-y-2">
                      {activeRepo.actions.latestRuns.length > 0 ? (
                        activeRepo.actions.latestRuns.slice(0, 3).map((run) => {
                          const state = run.conclusion ?? run.status;
                          return (
                            <a
                              key={run.id}
                              href={run.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-white/5"
                            >
                              <span className={`size-2.5 shrink-0 rounded-full ${statusColor(state)}`} />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-zinc-200">
                                  {run.name ?? "Workflow"}
                                </span>
                                <span className="text-xs text-zinc-600">
                                  {state} · {formatRelativeDate(run.updatedAt)}
                                </span>
                              </span>
                            </a>
                          );
                        })
                      ) : (
                        <EmptyLine>Brak widocznych workflow runs.</EmptyLine>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <GitPullRequest size={15} />
                      Otwarte PR-y
                    </div>
                    <div className="space-y-2">
                      {activeRepo.openPullRequests.length > 0 ? (
                        activeRepo.openPullRequests.slice(0, 3).map((pullRequest) => (
                          <a
                            key={pullRequest.id}
                            href={pullRequest.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-2xl px-3 py-2 transition-colors hover:bg-white/5"
                          >
                            <p className="truncate text-sm font-medium text-zinc-200">
                              #{pullRequest.number} {pullRequest.title}
                            </p>
                            <p className="mt-1 text-xs text-zinc-600">
                              {pullRequest.draft ? "draft" : "ready"} ·{" "}
                              {formatRelativeDate(pullRequest.updatedAt)}
                            </p>
                          </a>
                        ))
                      ) : (
                        <EmptyLine>Brak otwartych PR-ów.</EmptyLine>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <Star size={15} />
                      Release
                    </div>
                    {activeRepo.latestRelease ? (
                      <a
                        href={activeRepo.latestRelease.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl px-3 py-2 transition-colors hover:bg-white/5"
                      >
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {activeRepo.latestRelease.name ?? activeRepo.latestRelease.tagName}
                        </p>
                        <p className="mt-1 text-xs text-zinc-600">
                          {activeRepo.latestRelease.tagName} ·{" "}
                          {formatRelativeDate(activeRepo.latestRelease.publishedAt)}
                        </p>
                      </a>
                    ) : (
                      <EmptyLine>Brak release’ów.</EmptyLine>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyLine>Ustaw `GITHUB_REPOS` albo dodaj publiczne repozytoria.</EmptyLine>
            )}
          </div>
        </div>
        </div>

        {data.errors && data.errors.length > 0 && (
          <div className="rounded-2xl border border-amber-500/15 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
            Część repozytoriów nie zwróciła danych: {data.errors.slice(0, 2).join("; ")}
          </div>
        )}
      </div>
    </div>
  );
}

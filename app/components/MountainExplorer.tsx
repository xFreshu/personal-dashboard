"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCheck,
  Footprints,
  MapPinned,
  Mountain,
  Route,
  Search,
  Trophy,
} from "lucide-react";
import {
  mountainCatalogSources,
  mountainRegions,
  type MountainDifficulty,
  type MountainRange,
} from "./mountainCatalog";

const STORAGE_KEY = "mountain-progress-v1";

type VisitState = Record<string, boolean>;
type VisitKind = "peak" | "route";

const difficultyMeta: Record<MountainDifficulty, string> = {
  lekka: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  srednia: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  trudna: "border-rose-400/20 bg-rose-400/10 text-rose-200",
};

function itemKey(kind: VisitKind, id: string) {
  return `${kind}:${id}`;
}

function getRangePeakProgress(range: MountainRange, visits: VisitState) {
  const total = range.peaks.length;
  const done = range.peaks.filter((peak) => visits[itemKey("peak", peak.id)]).length;

  return {
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

function getRangeRouteProgress(range: MountainRange, visits: VisitState) {
  const total = range.routes.length;
  const done = range.routes.filter((route) => visits[itemKey("route", route.id)]).length;

  return {
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

function matchesRange(range: MountainRange, query: string) {
  if (!query) return true;

  const haystack = [
    range.name,
    range.area,
    range.character,
    range.highestPeak,
    ...range.peaks.map((peak) => `${peak.name} ${peak.note}`),
    ...range.routes.map((route) => `${route.name} ${route.highlights.join(" ")}`),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export default function MountainExplorer() {
  const [activeRegionId, setActiveRegionId] = useState(mountainRegions[0].id);
  const [activeRangeId, setActiveRangeId] = useState(mountainRegions[0].ranges[0].id);
  const [visits, setVisits] = useState<VisitState>({});
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);

  const regions = mountainRegions;
  const allRanges = useMemo(() => regions.flatMap((region) => region.ranges), [regions]);
  const allPeaks = useMemo(() => allRanges.flatMap((range) => range.peaks), [allRanges]);
  const allRoutes = useMemo(() => allRanges.flatMap((range) => range.routes), [allRanges]);
  const crownPeaks = useMemo(() => allPeaks.filter((peak) => peak.crown), [allPeaks]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setVisits(JSON.parse(stored) as VisitState);
      }
    } catch (error) {
      console.error("Failed to load mountain progress", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
    } catch (error) {
      console.error("Failed to save mountain progress", error);
    }
  }, [hydrated, visits]);

  const activeRegion = useMemo(
    () => regions.find((region) => region.id === activeRegionId) ?? regions[0],
    [activeRegionId, regions],
  );

  const activeRange = useMemo(
    () => allRanges.find((range) => range.id === activeRangeId) ?? activeRegion.ranges[0],
    [activeRangeId, activeRegion.ranges, allRanges],
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredRanges = useMemo(
    () =>
      (activeRegion?.ranges ?? []).filter((range) => {
        const rangeProgress = getRangePeakProgress(range, visits);
        const routeProgress = getRangeRouteProgress(range, visits);
        const hasOpenItems =
          rangeProgress.done < rangeProgress.total || routeProgress.done < routeProgress.total;

        return matchesRange(range, normalizedQuery) && (!onlyOpen || hasOpenItems);
      }),
    [activeRegion.ranges, normalizedQuery, onlyOpen, visits],
  );

  const visitedPeakCount = allPeaks.filter((peak) => visits[itemKey("peak", peak.id)]).length;
  const visitedRouteCount = allRoutes.filter((route) => visits[itemKey("route", route.id)]).length;
  const crownVisitedCount = crownPeaks.filter((peak) => visits[itemKey("peak", peak.id)]).length;
  const activePeakProgress = getRangePeakProgress(activeRange, visits);
  const activeRouteProgress = getRangeRouteProgress(activeRange, visits);

  const toggleItem = (kind: VisitKind, id: string) => {
    const key = itemKey(kind, id);
    setVisits((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const setRangeVisited = (range: MountainRange, visited: boolean) => {
    setVisits((current) => {
      const next = { ...current };

      for (const peak of range.peaks) {
        next[itemKey("peak", peak.id)] = visited;
      }
      for (const route of range.routes) {
        next[itemKey("route", route.id)] = visited;
      }

      return next;
    });
  };

  return (
    <main className="min-h-full w-full bg-background p-6 md:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex max-w-4xl items-start gap-4">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
              <Mountain className="size-7" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-3xl font-bold text-transparent">
                Góry i szlaki Polski
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-400 md:text-base">
                Kuratorowany katalog najpopularniejszych polskich szczytów i tras: pełna Korona Gór Polski,
                znane pasma i klasyczne przejścia bez zalewu tysięcy punktów.
              </p>
              <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
                Najpopularniejsze w Polsce
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[28rem]">
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-2xl font-semibold text-zinc-100">{visitedPeakCount}/{allPeaks.length}</div>
              <div className="mt-1 text-xs text-zinc-500">szczytów</div>
            </div>
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-2xl font-semibold text-zinc-100">
                {crownVisitedCount}/{crownPeaks.length}
              </div>
              <div className="mt-1 text-xs text-zinc-500">Korona GP</div>
            </div>
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-2xl font-semibold text-zinc-100">{visitedRouteCount}/{allRoutes.length}</div>
              <div className="mt-1 text-xs text-zinc-500">tras</div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {regions.map((region) => {
            const isActive = region.id === activeRegion.id;
            const ranges = region.ranges.length;
            const peaks = region.ranges.reduce((sum, range) => sum + range.peaks.length, 0);

            return (
              <button
                key={region.id}
                type="button"
                onClick={() => {
                  setActiveRegionId(region.id);
                  setActiveRangeId(region.ranges[0].id);
                }}
                className={`rounded-3xl border p-5 text-left transition-all ${
                  isActive
                    ? "border-emerald-400/30 bg-white/[0.05]"
                    : "border-white/5 bg-card/40 hover:border-white/10 hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className={`rounded-2xl bg-gradient-to-br ${region.accent} p-3 text-zinc-950`}>
                    <MapPinned className="size-5" />
                  </div>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                    {ranges} pasm
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-zinc-100">{region.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-500">{region.description}</p>
                <div className="mt-4 text-xs text-zinc-500">{peaks} szczytów w katalogu</div>
              </button>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.15fr)]">
          <div className="rounded-[2rem] border border-white/5 bg-card/30 p-5 shadow-lg backdrop-blur-md">
            <div className="flex flex-col gap-4 md:flex-row xl:flex-col">
              <label className="relative flex-1">
                <span className="sr-only">Szukaj pasma, szczytu albo trasy</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Szukaj szczytu, pasma albo trasy"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950/40 pl-11 pr-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-400/40"
                />
              </label>
              <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/40 px-4 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={onlyOpen}
                  onChange={(event) => setOnlyOpen(event.target.checked)}
                  className="size-4 accent-emerald-400"
                />
                Tylko niezamknięte
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">Mapa pasm</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Belka pokazuje rzeczywisty postęp odhaczonych szczytów w paśmie.
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
                {filteredRanges.length}/{activeRegion.ranges.length}
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {filteredRanges.map((range) => {
                const progress = getRangePeakProgress(range, visits);
                const isActive = range.id === activeRange.id;
                const top = Math.max(0, ...range.peaks.map((peak) => peak.elevation));

                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setActiveRangeId(range.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition-all ${
                      isActive
                        ? "border-emerald-400/30 bg-emerald-400/10"
                        : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-zinc-100">{range.name}</div>
                        <div className="mt-1 text-xs text-zinc-500">{range.area}</div>
                      </div>
                      <div className="text-right text-xs text-zinc-500">
                        <div className="text-zinc-300">{top > 0 ? `${top} m` : "bd."}</div>
                        <div>{progress.done}/{progress.total}</div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${activeRegion.accent}`}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </button>
                );
              })}

              {filteredRanges.length === 0 && (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm text-zinc-500">
                  Nic nie pasuje do filtrów.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/5 bg-card/30 p-5 shadow-lg backdrop-blur-md lg:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-emerald-200">
                  <Mountain className="size-3.5" />
                  {activeRange.area}
                </div>
                <h2 className="text-3xl font-bold text-zinc-100">{activeRange.name}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{activeRange.character}</p>
              </div>

              <div className="grid min-w-64 grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="text-lg font-semibold text-zinc-100">{activePeakProgress.percent}%</div>
                  <div className="mt-1 text-xs text-zinc-500">szczyty w paśmie</div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="text-lg font-semibold text-zinc-100">{activeRouteProgress.percent}%</div>
                  <div className="mt-1 text-xs text-zinc-500">trasy w paśmie</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setRangeVisited(activeRange, true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-400/15"
              >
                <CheckCheck className="size-4" />
                Zaznacz pasmo
              </button>
              <button
                type="button"
                onClick={() => setRangeVisited(activeRange, false)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06]"
              >
                Wyczyść pasmo
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <section className="rounded-3xl border border-white/5 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-100">Szczyty</h3>
                    <p className="mt-1 text-sm text-zinc-500">Najbardziej rozpoznawalne cele w paśmie.</p>
                  </div>
                  <Trophy className="size-5 text-amber-300" />
                </div>

                <div className="space-y-2">
                  {activeRange.peaks.map((peak) => {
                    const checked = visits[itemKey("peak", peak.id)] ?? false;

                    return (
                      <button
                        key={peak.id}
                        type="button"
                        onClick={() => toggleItem("peak", peak.id)}
                        className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                          checked
                            ? "border-emerald-500/20 bg-emerald-500/10"
                            : "border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                            checked
                              ? "border-emerald-400 bg-emerald-400 text-zinc-950"
                              : "border-zinc-700 text-transparent"
                          }`}
                        >
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-zinc-100">{peak.name}</span>
                            {peak.elevation > 0 && (
                              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400">
                                {peak.elevation} m
                              </span>
                            )}
                            {peak.crown && (
                              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-200">
                                KGP
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-sm leading-6 text-zinc-500">{peak.note}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-white/5 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-100">Szlaki</h3>
                    <p className="mt-1 text-sm text-zinc-500">Popularne przejścia do odhaczenia.</p>
                  </div>
                  <Route className="size-5 text-cyan-300" />
                </div>

                <div className="space-y-2">
                  {activeRange.routes.map((route) => {
                    const checked = visits[itemKey("route", route.id)] ?? false;

                    return (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => toggleItem("route", route.id)}
                        className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                          checked
                            ? "border-cyan-500/20 bg-cyan-500/10"
                            : "border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                            checked
                              ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                              : "border-zinc-700 text-transparent"
                          }`}
                        >
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-sm font-medium leading-5 text-zinc-100">{route.name}</span>
                          <span className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[11px] text-zinc-400">
                              <Footprints className="size-3" />
                              {route.distanceKm ? `${route.distanceKm} km` : "bd."}
                            </span>
                            <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-zinc-400">
                              {route.time}
                            </span>
                            <span className={`rounded-full border px-2 py-1 text-[11px] ${difficultyMeta[route.difficulty]}`}>
                              {route.difficulty}
                            </span>
                          </span>
                          <span className="mt-2 block text-sm leading-6 text-zinc-500">
                            {route.highlights.join(" / ")}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-500">
              <span>Źródła i kierunek danych:</span>
              {mountainCatalogSources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-300 transition-colors hover:text-zinc-100"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

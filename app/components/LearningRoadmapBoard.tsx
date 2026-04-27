"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  FileText,
  FlaskConical,
  GraduationCap,
  Map,
  Network,
  type LucideIcon,
} from "lucide-react";
import {
  learningTracks,
  type LearningResourceKind,
  type LearningTrack,
} from "./learningRoadmaps";

const STORAGE_KEY = "learning-roadmap-progress-v1";

type ProgressState = Record<string, boolean>;

const resourceKindMeta: Record<
  LearningResourceKind,
  {
    label: string;
    icon: LucideIcon;
    className: string;
  }
> = {
  roadmap: {
    label: "Mapa",
    icon: Map,
    className: "border-indigo-400/20 bg-indigo-400/10 text-indigo-200",
  },
  docs: {
    label: "Docs",
    icon: BookOpen,
    className: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
  },
  lab: {
    label: "Lab",
    icon: FlaskConical,
    className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  },
  reference: {
    label: "Reference",
    icon: FileText,
    className: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  },
  architecture: {
    label: "Architektura",
    icon: Network,
    className: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200",
  },
};

function itemKey(trackId: string, milestoneId: string, topicId: string) {
  return `${trackId}:${milestoneId}:${topicId}`;
}

function getTrackProgress(track: LearningTrack, progress: ProgressState) {
  const total = track.milestones.reduce((sum, milestone) => sum + milestone.topics.length, 0);
  const done = track.milestones.reduce(
    (sum, milestone) =>
      sum +
      milestone.topics.filter((topic) => progress[itemKey(track.id, milestone.id, topic.id)]).length,
    0,
  );

  return {
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

function getMilestoneProgress(track: LearningTrack, milestoneId: string, progress: ProgressState) {
  const milestone = track.milestones.find((entry) => entry.id === milestoneId);
  if (!milestone) {
    return { done: 0, total: 0, percent: 0 };
  }

  const total = milestone.topics.length;
  const done = milestone.topics.filter((topic) => progress[itemKey(track.id, milestone.id, topic.id)]).length;

  return {
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

export default function LearningRoadmapBoard() {
  const [activeTrackId, setActiveTrackId] = useState(learningTracks[0].id);
  const [progress, setProgress] = useState<ProgressState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored) as ProgressState);
      }
    } catch (error) {
      console.error("Failed to load learning progress", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to save learning progress", error);
    }
  }, [hydrated, progress]);

  const activeTrack = useMemo(
    () => learningTracks.find((track) => track.id === activeTrackId) ?? learningTracks[0],
    [activeTrackId],
  );

  const activeTrackProgress = getTrackProgress(activeTrack, progress);

  const toggleTopic = (trackId: string, milestoneId: string, topicId: string) => {
    const key = itemKey(trackId, milestoneId, topicId);
    setProgress((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <main className="min-h-full w-full bg-background p-6 md:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-500/10 p-2.5 text-indigo-400">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-3xl font-bold text-transparent">
                Centrum Nauki
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-zinc-400 md:text-base">
                Cztery sciezki inspirowane roadmap.sh, rozpisane na milestone&apos;y i checklisty z lokalnym
                sledzeniem postepu.
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {learningTracks.map((track) => {
            const Icon = track.icon;
            const trackProgress = getTrackProgress(track, progress);
            const isActive = track.id === activeTrack.id;

            return (
              <button
                key={track.id}
                type="button"
                onClick={() => setActiveTrackId(track.id)}
                className={`text-left rounded-3xl border bg-card/40 p-5 shadow-lg transition-all duration-300 ${
                  isActive
                    ? `${track.border} bg-white/[0.05]`
                    : "border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`rounded-2xl bg-white/5 p-3 ${track.accent}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                    {trackProgress.percent}%
                  </div>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-zinc-100">{track.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-zinc-500">{track.description}</p>

                <div className="mt-5 space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${trackProgress.percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {trackProgress.done}/{trackProgress.total} tematow
                    </span>
                    <span>{track.milestones.length} milestone&apos;ow</span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        <section className={`rounded-[2rem] border ${activeTrack.border} bg-card/30 p-6 shadow-lg backdrop-blur-md lg:p-8`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className={`mb-4 inline-flex rounded-full bg-white/5 px-3 py-1 text-xs font-medium ${activeTrack.accent}`}>
                {activeTrack.shortLabel}
              </div>
              <h2 className="text-3xl font-bold text-zinc-100">{activeTrack.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400 md:text-base">{activeTrack.description}</p>
            </div>

            <div className="flex min-w-[18rem] flex-col gap-3 rounded-3xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Postep sciezki</span>
                <span className="font-medium text-zinc-100">{activeTrackProgress.percent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${activeTrackProgress.percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {activeTrackProgress.done}/{activeTrackProgress.total} przeczytane
                </span>
                <a
                  href={activeTrack.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-zinc-300 transition-colors hover:text-zinc-100"
                >
                  <span>{activeTrack.sourceLabel}</span>
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <section className="rounded-3xl border border-white/5 bg-white/[0.03] p-5 transition-colors hover:border-white/10 xl:col-span-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                    <Compass className="size-3.5" />
                    Radar wiedzy
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-100">Skad czerpac wiedze</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                    Kuratorowany miks: najpierw mapa, potem oficjalne docs, praktyczne laby i referencje do sprawdzania
                    konkretow.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.04] px-3 py-2 text-sm text-zinc-300">
                  {activeTrack.resources.length} zrodel
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                {activeTrack.resources.map((resource) => {
                  const meta = resourceKindMeta[resource.kind];
                  const ResourceIcon = meta.icon;

                  return (
                    <a
                      key={resource.id}
                      href={resource.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex min-h-48 flex-col rounded-2xl border border-white/5 bg-zinc-950/30 p-4 transition-all hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.className}`}
                        >
                          <ResourceIcon className="size-3.5" />
                          {meta.label}
                        </span>
                        <ArrowUpRight className="size-4 text-zinc-600 transition-colors group-hover:text-zinc-200" />
                      </div>

                      <div className="mt-4 flex flex-1 flex-col">
                        <h4 className="text-sm font-semibold leading-5 text-zinc-100">{resource.title}</h4>
                        <p className="mt-2 flex-1 text-sm leading-6 text-zinc-500">{resource.description}</p>
                        <div className="mt-4 text-xs font-medium text-zinc-400">{resource.source}</div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>

            {activeTrack.milestones.map((milestone, index) => {
              const milestoneProgress = getMilestoneProgress(activeTrack, milestone.id, progress);

              return (
                <section
                  key={milestone.id}
                  className="rounded-3xl border border-white/5 bg-white/[0.03] p-5 transition-colors hover:border-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-3 inline-flex rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                        Milestone {index + 1}
                      </div>
                      <h3 className="text-xl font-semibold text-zinc-100">{milestone.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">{milestone.summary}</p>
                    </div>
                    <div className="shrink-0 rounded-2xl border border-white/5 bg-white/[0.04] px-3 py-2 text-right">
                      <div className="text-lg font-semibold text-zinc-100">{milestoneProgress.percent}%</div>
                      <div className="text-[11px] text-zinc-500">
                        {milestoneProgress.done}/{milestoneProgress.total}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${milestoneProgress.percent}%` }}
                    />
                  </div>

                  <div className="mt-5 space-y-2">
                    {milestone.topics.map((topic) => {
                      const key = itemKey(activeTrack.id, milestone.id, topic.id);
                      const checked = progress[key] ?? false;

                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => toggleTopic(activeTrack.id, milestone.id, topic.id)}
                          className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                            checked
                              ? "border-emerald-500/20 bg-emerald-500/10"
                              : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                              checked
                                ? "border-emerald-400 bg-emerald-400 text-zinc-950"
                                : "border-zinc-700 bg-transparent text-transparent"
                            }`}
                          >
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                          <span className={`${checked ? "text-zinc-200" : "text-zinc-400"} text-sm leading-6`}>
                            {topic.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

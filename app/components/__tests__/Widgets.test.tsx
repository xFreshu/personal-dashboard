import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CalendarWidget from "../CalendarWidget";
import ClockWidget from "../ClockWidget";
import CodexStatusPanel from "../CodexStatusPanel";
import CodexTokensWidget from "../CodexTokensWidget";
import GitHubWidget from "../GitHubWidget";
import HabitWidget from "../HabitWidget";
import { Skeleton } from "../Skeleton";
import WeatherWidget from "../WeatherWidget";

const authState = vi.hoisted(() => ({
  session: null as unknown,
  status: "unauthenticated",
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: authState.session,
    status: authState.status,
  }),
  signIn: authState.signIn,
  signOut: authState.signOut,
  SessionProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-chart">{children}</div>
  ),
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Line: () => null,
  Tooltip: ({
    formatter,
    labelFormatter,
  }: {
    formatter?: (value: unknown) => [string, string];
    labelFormatter?: (label: string) => string;
  }) => (
    <div data-testid="chart-tooltip">
      {formatter?.([16])?.join(" ")}
      {labelFormatter?.("10:00")}
    </div>
  ),
  XAxis: () => null,
  YAxis: () => null,
}));

function mockFetch(payload: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => payload,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function mockFetchSequence(payloads: unknown[]) {
  const fetchMock = vi.fn();
  payloads.forEach((payload) => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => payload,
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function waitForEmptyContainer(container: HTMLElement) {
  await waitFor(() => {
    expect(container).toBeEmptyDOMElement();
  });
}

describe("dashboard widgets", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-04-28T10:11:12+02:00"));
    authState.session = null;
    authState.status = "unauthenticated";
    authState.signIn.mockReset();
    authState.signOut.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders the shared skeleton with pulse styling", () => {
    const { container } = render(<Skeleton className="h-4 w-4" />);

    expect(container.firstElementChild).toHaveClass("animate-pulse", "h-4", "w-4");
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the current clock time", async () => {
    const { unmount } = render(<ClockWidget />);

    expect(screen.getByText("10:11:12")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(1000);
    await waitFor(() => {
      expect(screen.getByText("10:11:13")).toBeInTheDocument();
    });
    unmount();
  });

  it("renders fetched weather data", async () => {
    mockFetch({
      current: {
        temperature_2m: 16.4,
        relative_humidity_2m: 60,
        wind_speed_10m: 12.3,
        weather_code: 0,
      },
      hourly: {
        time: ["2026-04-28T10:00", "2026-04-28T11:00"],
        temperature_2m: [16, 17],
      },
      daily: {
        temperature_2m_max: [22],
        temperature_2m_min: [9],
      },
    });

    render(<WeatherWidget />);

    expect(await screen.findByText("Bezchmurnie")).toBeInTheDocument();
    expect(screen.getByText("Żory, PL")).toBeInTheDocument();
    expect(screen.getByText("60% wilg.")).toBeInTheDocument();
    expect(screen.getByText("12 km/h")).toBeInTheDocument();
    expect(screen.getByTestId("responsive-chart")).toBeInTheDocument();
    expect(screen.getByTestId("chart-tooltip")).toHaveTextContent(
      "16°C TemperaturaGodzina 10:00",
    );
  });

  it("shows a weather error state when the request fails", async () => {
    mockFetch({}, false);

    render(<WeatherWidget />);

    expect(
      await screen.findByText("Wystąpił błąd przy pobieraniu pogody."),
    ).toBeInTheDocument();
  });

  it.each([
    [2, "Częściowe zachm."],
    [45, "Mglisto"],
    [51, "Mżawka"],
    [61, "Deszcz"],
    [71, "Śnieg"],
    [80, "Przelotny deszcz"],
    [95, "Burza"],
    [99, "Burza"],
    [10, "Pochmurno"],
  ])("maps weather code %s to %s", async (weatherCode, label) => {
    mockFetch({
      current: {
        temperature_2m: 4,
        relative_humidity_2m: 70,
        wind_speed_10m: 4,
        weather_code: weatherCode,
      },
      hourly: {
        time: [],
        temperature_2m: [],
      },
      daily: {
        temperature_2m_max: [5],
        temperature_2m_min: [1],
      },
    });

    render(<WeatherWidget />);

    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it("asks users to sign in before showing Google calendar events", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    authState.status = "unauthenticated";

    render(<CalendarWidget />);

    await user.click(screen.getByRole("button", { name: /Zaloguj przez Google/i }));

    expect(authState.signIn).toHaveBeenCalledWith("google");
  });

  it("renders sorted Google calendar events for an authenticated session", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    authState.status = "authenticated";
    authState.session = {
      user: { email: "lukasz@example.com" },
      accessToken: "token",
    };
    mockFetch({
      events: [
        {
          id: "later",
          summary: "Later sync",
          start: { dateTime: "2026-04-29T13:00:00+02:00" },
          end: { dateTime: "2026-04-29T14:00:00+02:00" },
        },
      {
        id: "soon",
        summary: "Morning standup",
          start: { dateTime: "2026-04-28T09:00:00+02:00" },
        end: { dateTime: "2026-04-28T09:30:00+02:00" },
      },
      {
        id: "all-day",
        summary: "Conference",
        start: { date: "2026-04-29" },
        end: { date: "2026-05-01" },
      },
      {
        id: "no-end",
        summary: "Open focus",
        start: { dateTime: "2026-04-30T15:00:00+02:00" },
      },
      {
        id: "cross-day",
        summary: "Travel",
        start: { dateTime: "2026-05-02T22:00:00+02:00" },
        end: { dateTime: "2026-05-03T01:00:00+02:00" },
      },
      {
        id: "no-date",
        summary: "No date",
        start: {},
      },
      ],
    });

    render(<CalendarWidget />);

    expect(await screen.findAllByText("Morning standup")).not.toHaveLength(0);
    expect(screen.getAllByText("Later sync")).not.toHaveLength(0);
    expect(screen.getAllByText("Conference")).not.toHaveLength(0);
    expect(screen.getAllByText("Open focus")).not.toHaveLength(0);
    expect(screen.getAllByText("Travel")).not.toHaveLength(0);
    expect(screen.getByText("No date")).toBeInTheDocument();

    await user.click(screen.getByTitle("Wyloguj"));
    expect(authState.signOut).toHaveBeenCalled();
  });

  it("renders calendar loading and empty fallback after fetch failure", async () => {
    authState.status = "loading";
    const { unmount } = render(<CalendarWidget />);

    expect(document.querySelectorAll("[aria-hidden='true']")).not.toHaveLength(0);

    unmount();
    authState.status = "authenticated";
    authState.session = {
      user: { email: "lukasz@example.com" },
      accessToken: "token",
    };
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("calendar down")));

    render(<CalendarWidget />);

    expect(await screen.findByText("Brak nadchodzących wydarzeń! 🎉")).toBeInTheDocument();
  });

  it("renders habit progress and toggles a day optimistically", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = mockFetchSequence([
      {
        habits: [
          {
            habit: "trening",
            date: "2026-04-28T00:00:00.000Z",
            completed: true,
          },
        ],
      },
      { completed: false },
    ]);

    render(<HabitWidget />);

    expect(await screen.findByText("Habit Tracker")).toBeInTheDocument();
    expect(screen.getByText("1/28 dni")).toBeInTheDocument();

    await user.click(screen.getAllByTitle("2026-04-28")[0]);

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/habits/toggle",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ habit: "trening", date: "2026-04-28" }),
      }),
    );
  });

  it("changes HabitWidget months from the header controls", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ habits: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<HabitWidget />);

    expect(await screen.findByText("Habit Tracker")).toBeInTheDocument();

    const [previousMonth, nextMonth] = screen.getAllByRole("button");
    await user.click(previousMonth);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/habits?year=2026&month=3");
    });

    await user.click(nextMonth);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/habits?year=2026&month=4");
    });
  });

  it("keeps HabitWidget usable when loading or toggling fails", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("load failed"))
      .mockResolvedValueOnce({ json: async () => ({ habits: [] }) })
      .mockRejectedValueOnce(new Error("toggle failed"))
      .mockResolvedValueOnce({ json: async () => ({ habits: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(<HabitWidget />);

    expect(await screen.findByText("Habit Tracker")).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith(new Error("load failed"));

    unmount();
    render(<HabitWidget />);
    expect(await screen.findByText("Habit Tracker")).toBeInTheDocument();

    await user.click(screen.getAllByTitle("2026-04-28")[0]);

    expect(consoleSpy).toHaveBeenCalledWith(new Error("toggle failed"));
    consoleSpy.mockRestore();
  });

  it("renders Codex token usage summary", async () => {
    mockFetch({
      configured: true,
      summary: {
        totalTokens: 150000,
        totalThreads: 12,
        todayTokens: 1234,
        weekTokens: 50000,
        monthTokens: 120000,
        activeToday: 2,
        updatedAt: new Date("2026-04-28T09:50:00+02:00").getTime(),
      },
      days: [
        { day: "2026-04-22", tokens: 0, threads: 0 },
        { day: "2026-04-23", tokens: 100, threads: 1 },
        { day: "2026-04-24", tokens: 200, threads: 1 },
        { day: "2026-04-25", tokens: 300, threads: 2 },
        { day: "2026-04-26", tokens: 400, threads: 2 },
        { day: "2026-04-27", tokens: 500, threads: 2 },
        { day: "2026-04-28", tokens: 600, threads: 3 },
      ],
      models: [{ model: "gpt-5.5", tokens: 120000, threads: 10 }],
      recentThreads: [
        {
          id: "thread-1",
          title: "Dashboard work",
          tokens: 1200,
          model: "gpt-5.5",
          updatedAt: Date.now(),
        },
      ],
    });

    render(<CodexTokensWidget />);

    expect(await screen.findByText("Codex")).toBeInTheDocument();
    expect(screen.getByText("1234")).toBeInTheDocument();
    expect(screen.getByText("Dashboard work")).toBeInTheDocument();
  });

  it("renders Codex token missing database and fetch error states", async () => {
    mockFetch({
      configured: false,
      missing: ["/tmp/state.sqlite"],
    });

    const { unmount } = render(<CodexTokensWidget />);

    expect(await screen.findByText("Brak bazy Codexa")).toBeInTheDocument();
    expect(screen.getByText("/tmp/state.sqlite")).toBeInTheDocument();

    unmount();
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    render(<CodexTokensWidget />);

    expect(
      await screen.findByText("Nie udalo sie pobrac zuzycia tokenow Codexa."),
    ).toBeInTheDocument();
  });

  it("renders Codex token day-relative time and null payload fallback", async () => {
    mockFetch({
      configured: true,
      summary: {
        totalTokens: 0,
        totalThreads: 0,
        todayTokens: 0,
        weekTokens: 0,
        monthTokens: 0,
        activeToday: 0,
        updatedAt: new Date("2026-04-25T10:11:12+02:00").getTime(),
      },
      days: [],
      models: [],
      recentThreads: [],
    });

    const { unmount, container } = render(<CodexTokensWidget />);

    expect(await screen.findByText("3 dni temu")).toBeInTheDocument();

    unmount();
    mockFetch(null);

    const result = render(<CodexTokensWidget />);

    await waitForEmptyContainer(result.container);
    expect(result.container).toBeEmptyDOMElement();
    expect(container).toBeDefined();
  });

  it("renders Codex status data", async () => {
    mockFetch({
      configured: true,
      status: {
        account: {
          type: "chatgpt",
          email: "codex@example.com",
          planType: "plus",
        },
        requiresOpenaiAuth: false,
        rateLimits: null,
        rateLimitsByLimitId: {
          codex: {
            limitId: "codex",
            limitName: "Codex",
            primary: {
              usedPercent: 25,
              windowDurationMins: 300,
              resetsAt: Math.floor(new Date("2026-04-28T11:00:00+02:00").getTime() / 1000),
            },
            secondary: null,
            credits: {
              hasCredits: true,
              unlimited: false,
              balance: "42",
            },
            planType: "plus",
            rateLimitReachedType: null,
          },
        },
        error: null,
        latestSession: {
          id: "session-1",
          title: "Skeleton task",
          model: "gpt-5.5",
          reasoningEffort: "medium",
          cwd: "/workspace",
          approvalMode: "on-request",
          sandboxPolicy: JSON.stringify({ type: "workspace-write" }),
          updatedAt: Date.now(),
        },
      },
    });

    render(<CodexStatusPanel />);

    expect(await screen.findByText("OpenAI Codex")).toBeInTheDocument();
    expect(screen.getByText("codex@example.com (plus)")).toBeInTheDocument();
    expect(screen.getByText("workspace-write")).toBeInTheDocument();
    expect(screen.getByText("75% left")).toBeInTheDocument();
  });

  it("renders Codex status fallback values after fetch errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<CodexStatusPanel />);

    expect(await screen.findByText("OpenAI Codex")).toBeInTheDocument();
    expect(screen.getByText("gpt-5.5")).toBeInTheDocument();
    expect(screen.getByText("brak konta")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getAllByText("brak danych")).not.toHaveLength(0);
  });

  it("renders Codex non-ChatGPT accounts and raw permission strings", async () => {
    mockFetch({
      configured: true,
      status: {
        account: { type: "apiKey" },
        requiresOpenaiAuth: false,
        rateLimits: {
          limitId: null,
          limitName: null,
          primary: null,
          secondary: null,
          credits: {
            hasCredits: false,
            unlimited: true,
            balance: null,
          },
          planType: null,
          rateLimitReachedType: null,
        },
        rateLimitsByLimitId: null,
        error: "Status warning",
        latestSession: {
          id: "session-2",
          title: "Raw policy",
          model: null,
          reasoningEffort: null,
          cwd: "/tmp",
          approvalMode: "never",
          sandboxPolicy: "raw-policy",
          updatedAt: Date.now(),
        },
      },
    });

    render(<CodexStatusPanel />);

    expect(await screen.findByText("apiKey")).toBeInTheDocument();
    expect(screen.getByText("Status warning")).toBeInTheDocument();
    expect(screen.getByText("raw-policy")).toBeInTheDocument();
    expect(screen.getByText("unlimited")).toBeInTheDocument();
  });

  it("renders long Codex reset times and parsed danger permissions", async () => {
    mockFetch({
      configured: true,
      status: {
        account: { type: "amazonBedrock" },
        requiresOpenaiAuth: false,
        rateLimits: {
          limitId: "bedrock",
          limitName: "Bedrock",
          primary: {
            usedPercent: 0,
            windowDurationMins: 300,
            resetsAt: Math.floor(new Date("2026-05-02T10:00:00+02:00").getTime() / 1000),
          },
          secondary: {
            usedPercent: 120,
            windowDurationMins: null,
            resetsAt: null,
          },
          credits: {
            hasCredits: false,
            unlimited: false,
            balance: null,
          },
          planType: "custom",
          rateLimitReachedType: null,
        },
        rateLimitsByLimitId: null,
        error: null,
        latestSession: {
          id: "session-3",
          title: "Danger policy",
          model: "gpt-5.4",
          reasoningEffort: "high",
          cwd: "/tmp",
          approvalMode: "never",
          sandboxPolicy: JSON.stringify({ type: "danger-full-access" }),
          updatedAt: Date.now(),
        },
      },
    });

    render(<CodexStatusPanel />);

    expect(await screen.findByText("amazonBedrock")).toBeInTheDocument();
    expect(screen.getByText("danger-full-access")).toBeInTheDocument();
    expect(screen.getByText("100% left")).toBeInTheDocument();
    expect(screen.getByText("0% left")).toBeInTheDocument();
    expect(screen.getByText(/reset: 2 maj/)).toBeInTheDocument();
  });

  it("renders a complete GitHub dashboard response", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const contributionCalendar = Array.from({ length: 14 }, (_, index) => ({
      date: `2026-04-${String(13 + index).padStart(2, "0")}`,
      contributionCount: index === 2 ? 1 : index === 9 ? 5 : index === 12 ? 2 : 0,
      color: "#000",
    }));
    mockFetch({
      configured: true,
      hasToken: true,
      profile: {
        login: "lukasz",
        name: "Lukasz",
        avatarUrl: "https://example.com/avatar.png",
        url: "https://github.com/lukasz",
        bio: null,
        followers: 10,
        following: 2,
        publicRepos: 3,
      },
      contributions: {
        available: true,
        totals: {
          contributions: 7,
          commits: 5,
          issues: 1,
          pullRequests: 1,
          reviews: 0,
          repositories: 1,
          restricted: 0,
        },
        calendar: contributionCalendar,
      },
      aggregate: {
        publicRepos: 3,
        stars: 9,
        forks: 1,
        openIssues: 1,
        openPullRequests: 1,
        failedWorkflowRuns: 1,
      },
      events: [
        {
          id: "event-1",
          type: "PushEvent",
          repo: "lukasz/personal-dashboard",
          createdAt: "2026-04-28T08:00:00.000Z",
          label: "Push",
          detail: "2 commity w personal-dashboard",
          href: "https://github.com/lukasz/personal-dashboard",
        },
        {
          id: "event-2",
          type: "WatchEvent",
          repo: "lukasz/personal-dashboard",
          createdAt: "2026-04-28T05:00:00.000Z",
          label: "Star",
          detail: "Star w personal-dashboard",
          href: "https://github.com/lukasz/personal-dashboard",
        },
      ],
      repositories: [
        {
          name: "personal-dashboard",
          fullName: "lukasz/personal-dashboard",
          description: "Dashboard",
          url: "https://github.com/lukasz/personal-dashboard",
          language: "TypeScript",
          pushedAt: "2026-04-28T08:00:00.000Z",
          stats: {
            stars: 9,
            forks: 1,
            watchers: 2,
            openIssues: 1,
            openPullRequests: 1,
          },
          latestCommits: [
            {
              sha: "abcdef123",
              shortSha: "abcdef1",
              message: "Add tests",
              author: "Lukasz",
              date: "2026-04-28T08:00:00.000Z",
              url: "https://github.com/commit",
            },
          ],
          openIssues: [],
          openPullRequests: [
            {
              id: 1,
              number: 4,
              title: "Improve dashboard",
              url: "https://github.com/pr/4",
              updatedAt: "2026-04-28T08:00:00.000Z",
              draft: false,
            },
          ],
          latestRelease: {
            id: 2,
            name: "v1",
            tagName: "v1.0.0",
            url: "https://github.com/releases/v1",
            publishedAt: "2026-04-27T08:00:00.000Z",
            prerelease: false,
          },
          actions: {
            latestRuns: [
              {
                id: 3,
                name: "CI",
                url: "https://github.com/actions/3",
                status: "completed",
                conclusion: "failure",
                event: "push",
                branch: "main",
                createdAt: "2026-04-28T08:00:00.000Z",
                updatedAt: "2026-04-28T08:10:00.000Z",
              },
              {
                id: 4,
                name: "Deploy",
                url: "https://github.com/actions/4",
                status: "in_progress",
                conclusion: null,
                event: "push",
                branch: "main",
                createdAt: "2026-04-28T08:00:00.000Z",
                updatedAt: "2026-04-28T08:30:00.000Z",
              },
              {
                id: 5,
                name: null,
                url: "https://github.com/actions/5",
                status: "mystery",
                conclusion: null,
                event: "workflow_dispatch",
                branch: "main",
                createdAt: "2026-04-28T08:00:00.000Z",
                updatedAt: null,
              },
            ],
            failedCount: 1,
          },
        },
        {
          name: "second",
          fullName: "lukasz/second",
          description: null,
          url: "https://github.com/lukasz/second",
          language: null,
          pushedAt: null,
          stats: {
            stars: 0,
            forks: 0,
            watchers: 0,
            openIssues: 0,
            openPullRequests: 0,
          },
          latestCommits: [],
          openIssues: [],
          openPullRequests: [],
          latestRelease: null,
          actions: {
            latestRuns: [],
            failedCount: 0,
          },
        },
      ],
      errors: ["repo: rate limit"],
    });

    render(<GitHubWidget />);

    expect((await screen.findByText("Lukasz")).closest("a")).toHaveAttribute(
      "href",
      "https://github.com/lukasz",
    );
    expect(screen.getByText("@lukasz")).toBeInTheDocument();
    expect(screen.getByText("2 commity w personal-dashboard")).toBeInTheDocument();
    expect(screen.getByText("Star w personal-dashboard")).toBeInTheDocument();
    expect(screen.getByText(/godziny temu/)).toBeInTheDocument();
    expect(screen.getByText("Add tests")).toBeInTheDocument();
    expect(screen.getByText("#4 Improve dashboard")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
    expect(screen.getByText("Deploy")).toBeInTheDocument();
    expect(screen.getByText("Workflow")).toBeInTheDocument();
    expect(screen.getByText(/Część repozytoriów/)).toBeInTheDocument();

    const bestDay = screen.getByRole("button", { name: /5 commitów/i });
    await user.hover(bestDay);
    expect(screen.getByText("5 commitów")).toBeInTheDocument();

    fireEvent.focus(bestDay);
    fireEvent.blur(bestDay);
    fireEvent.mouseLeave(bestDay.closest(".overflow-x-auto")!);

    await user.click(screen.getByRole("button", { name: "second" }));
    expect(screen.getByText("lukasz/second")).toBeInTheDocument();
    expect(screen.getByText("Brak commitów.")).toBeInTheDocument();
    expect(screen.getByText("Brak widocznych workflow runs.")).toBeInTheDocument();
    expect(screen.getByText("Brak release’ów.")).toBeInTheDocument();
  });

  it("renders GitHub missing configuration and error states", async () => {
    mockFetch({
      configured: false,
      missing: ["GITHUB_USERNAME"],
    });

    const { unmount } = render(<GitHubWidget />);

    expect(await screen.findByText("Brak konfiguracji")).toBeInTheDocument();
    expect(screen.getByText(/GITHUB_USERNAME/)).toBeInTheDocument();

    unmount();
    mockFetch({
      configured: true,
      error: "Nie udało się pobrać danych GitHub.",
    });

    render(<GitHubWidget />);

    expect(
      await screen.findByText("Nie udało się pobrać danych GitHub."),
    ).toBeInTheDocument();
  });

  it("renders the GitHub network failure fallback", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<GitHubWidget />);

    expect(
      await screen.findByText("Nie udało się pobrać danych GitHub."),
    ).toBeInTheDocument();
  });

  it("renders GitHub empty activity and repository fallbacks", async () => {
    mockFetch({
      configured: true,
      profile: {
        login: "lukasz",
        name: null,
        avatarUrl: "https://example.com/avatar.png",
        url: "https://github.com/lukasz",
        bio: null,
        followers: 0,
        following: 0,
        publicRepos: 0,
      },
      contributions: {
        available: false,
        reason: "Token missing",
      },
      aggregate: {
        publicRepos: 0,
        stars: 0,
        forks: 0,
        openIssues: 0,
        openPullRequests: 0,
        failedWorkflowRuns: 0,
      },
      events: [],
      repositories: [],
    });

    render(<GitHubWidget />);

    expect(await screen.findByText("@lukasz")).toBeInTheDocument();
    expect(screen.getByText("Token missing")).toBeInTheDocument();
    expect(screen.getByText("Brak ostatnich publicznych eventów.")).toBeInTheDocument();
    expect(screen.getByText("Brak repozytoriów")).toBeInTheDocument();
    expect(screen.getByText("Ustaw `GITHUB_REPOS` albo dodaj publiczne repozytoria.")).toBeInTheDocument();
  });
});

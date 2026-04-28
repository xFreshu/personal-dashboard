import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const prismaMock = vi.hoisted(() => ({
  habit: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
  },
}));

const nextAuthMock = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  nextAuth: vi.fn(() => vi.fn()),
  googleProvider: vi.fn((config: unknown) => ({ id: "google", config })),
}));

const googleMock = vi.hoisted(() => {
  const setCredentials = vi.fn();
  const list = vi.fn();
  const OAuth2 = vi.fn(function OAuth2Mock() {
    return { setCredentials };
  });
  const calendar = vi.fn(() => ({ events: { list } }));

  return { OAuth2, calendar, list, setCredentials };
});

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("next-auth", () => ({
  default: nextAuthMock.nextAuth,
}));

vi.mock("next-auth/next", () => ({
  getServerSession: nextAuthMock.getServerSession,
}));

vi.mock("next-auth/providers/google", () => ({
  default: nextAuthMock.googleProvider,
}));

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: googleMock.OAuth2,
    },
    calendar: googleMock.calendar,
  },
}));

function request(url: string, init?: RequestInit) {
  return new Request(url, init) as NextRequest;
}

const originalEnv = process.env;

describe("API routes", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.stubGlobal("fetch", vi.fn());
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("returns habits for a requested month", async () => {
    const { GET } = await import("../habits/route");
    const habitDate = new Date("2026-04-28T00:00:00.000Z");
    prismaMock.habit.findMany.mockResolvedValue([
      { habit: "trening", date: habitDate, completed: true },
    ]);

    const response = await GET(
      request("http://localhost/api/habits?year=2026&month=4"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      habits: [{ habit: "trening", date: habitDate.toISOString(), completed: true }],
    });
    expect(prismaMock.habit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: {
            gte: new Date(2026, 3, 1),
            lte: new Date(2026, 4, 0),
          },
        }),
      }),
    );
  });

  it("returns a 500 when habits lookup fails", async () => {
    const { GET } = await import("../habits/route");
    prismaMock.habit.findMany.mockRejectedValue(new Error("db down"));

    const response = await GET(request("http://localhost/api/habits"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Błąd pobierania danych" });
  });

  it("toggles habits on and off", async () => {
    const { POST } = await import("../habits/toggle/route");
    prismaMock.habit.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 1,
      habit: "trening",
    });
    prismaMock.habit.create.mockResolvedValue({});
    prismaMock.habit.delete.mockResolvedValue({});

    const enableResponse = await POST(
      request("http://localhost/api/habits/toggle", {
        method: "POST",
        body: JSON.stringify({ habit: "trening", date: "2026-04-28" }),
      }),
    );
    const disableResponse = await POST(
      request("http://localhost/api/habits/toggle", {
        method: "POST",
        body: JSON.stringify({ habit: "trening", date: "2026-04-28" }),
      }),
    );

    expect(await enableResponse.json()).toEqual({ completed: true });
    expect(await disableResponse.json()).toEqual({ completed: false });
    expect(prismaMock.habit.create).toHaveBeenCalled();
    expect(prismaMock.habit.delete).toHaveBeenCalled();
  });

  it("validates required habit toggle fields", async () => {
    const { POST } = await import("../habits/toggle/route");

    const response = await POST(
      request("http://localhost/api/habits/toggle", {
        method: "POST",
        body: JSON.stringify({ habit: "trening" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Brak wymaganych pól" });
  });

  it("returns a 500 when habit toggle persistence fails", async () => {
    const { POST } = await import("../habits/toggle/route");
    prismaMock.habit.findUnique.mockRejectedValue(new Error("db down"));

    const response = await POST(
      request("http://localhost/api/habits/toggle", {
        method: "POST",
        body: JSON.stringify({ habit: "trening", date: "2026-04-28" }),
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Błąd zapisu danych" });
  });

  it("exposes NextAuth callbacks for first login, refresh and sessions", async () => {
    const { authOptions, GET, POST } = await import("../auth/[...nextauth]/route");

    expect(GET).toBe(POST);
    expect(nextAuthMock.googleProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        authorization: expect.objectContaining({
          params: expect.objectContaining({
            scope: expect.stringContaining("calendar.readonly"),
          }),
        }),
      }),
    );

    const firstLogin = await authOptions.callbacks?.jwt?.({
      token: { name: "Lukasz" },
      account: {
        access_token: "first-token",
        expires_at: 1_800_000_000,
        refresh_token: "refresh-token",
      },
      user: { id: "user-1" },
    } as never);

    expect(firstLogin).toMatchObject({
      accessToken: "first-token",
      refreshToken: "refresh-token",
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "new-token",
        expires_in: 3600,
      }),
    } as Response);

    const refreshed = await authOptions.callbacks?.jwt?.({
      token: {
        accessToken: "old-token",
        accessTokenExpires: 0,
        refreshToken: "refresh-token",
      },
      account: null,
      user: undefined,
    } as never);

    expect(refreshed).toMatchObject({
      accessToken: "new-token",
      refreshToken: "refresh-token",
    });

    const stillValid = await authOptions.callbacks?.jwt?.({
      token: {
        accessToken: "valid-token",
        accessTokenExpires: Date.now() + 5 * 60_000,
      },
      account: null,
      user: undefined,
    } as never);

    expect(stillValid).toMatchObject({ accessToken: "valid-token" });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "invalid_grant" }),
    } as Response);

    const refreshError = await authOptions.callbacks?.jwt?.({
      token: {
        accessToken: "old-token",
        accessTokenExpires: 0,
        refreshToken: "bad-refresh-token",
      },
      account: null,
      user: undefined,
    } as never);

    expect(refreshError).toMatchObject({ error: "RefreshAccessTokenError" });

    const session = await authOptions.callbacks?.session?.({
      session: { user: { email: "lukasz@example.com" }, expires: "" },
      token: {
        accessToken: "session-token",
        accessTokenExpires: Date.now() + 1000,
        error: "RefreshAccessTokenError",
      },
    } as never);

    expect(session).toMatchObject({
      accessToken: "session-token",
      error: "RefreshAccessTokenError",
    });
  });

  it("returns calendar events for an authenticated Google session", async () => {
    const { GET } = await import("../calendar/route");
    nextAuthMock.getServerSession.mockResolvedValue({
      accessToken: "google-token",
    });
    googleMock.list.mockResolvedValue({
      data: {
        items: [{ id: "event-1", summary: "Planning" }],
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      events: [{ id: "event-1", summary: "Planning" }],
    });
    expect(googleMock.setCredentials).toHaveBeenCalledWith({
      access_token: "google-token",
    });
    expect(googleMock.list).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: "primary",
        maxResults: 6,
      }),
    );
  });

  it("rejects unauthenticated calendar requests", async () => {
    const { GET } = await import("../calendar/route");
    nextAuthMock.getServerSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns a 500 when Google Calendar fails", async () => {
    const { GET } = await import("../calendar/route");
    nextAuthMock.getServerSession.mockResolvedValue({
      accessToken: "google-token",
    });
    googleMock.list.mockRejectedValue(new Error("calendar down"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to fetch calendar" });
  });

  it("returns LoL rank data for configured accounts", async () => {
    const { GET } = await import("../lol/rank/route");
    process.env.RIOT_API_KEY = "riot-key";
    process.env.LOL_ACCOUNTS = "TestPlayer|EUW|EUW;Broken|TAG|UNKNOWN";
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ puuid: "puuid-1" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "summoner-1", summonerLevel: 123, profileIconId: 7 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            queueType: "RANKED_SOLO_5x5",
            tier: "DIAMOND",
            rank: "II",
            leaguePoints: 80,
            wins: 12,
            losses: 8,
          },
        ],
      } as Response);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.configured).toBe(true);
    expect(body.accounts[0].primaryQueue).toMatchObject({
      tier: "DIAMOND",
      rank: "II",
      winRate: 60,
    });
    expect(body.accounts[1]).toMatchObject({
      error: "Unsupported platform UNKNOWN.",
      primaryQueue: null,
    });
  });

  it("reports missing LoL configuration", async () => {
    const { GET } = await import("../lol/rank/route");
    delete process.env.RIOT_API_KEY;
    delete process.env.LOL_ACCOUNTS;

    const response = await GET();

    expect(await response.json()).toEqual({
      configured: false,
      missing: ["RIOT_API_KEY", "LOL_ACCOUNTS"],
    });
  });

  it("returns a per-account error when ranked lookup fails", async () => {
    const { GET } = await import("../lol/rank/route");
    process.env.RIOT_API_KEY = "riot-key";
    process.env.LOL_ACCOUNTS = "TestPlayer|EUW|EUW";
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ puuid: "puuid-1" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "summoner-1", summonerLevel: 123, profileIconId: 7 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      } as Response);

    const response = await GET();
    const body = await response.json();

    expect(body.accounts[0]).toMatchObject({
      error: "Ranked lookup failed (503).",
      primaryQueue: null,
    });
  });

  it("ignores malformed LoL account entries and handles lookup failures", async () => {
    const { GET } = await import("../lol/rank/route");
    process.env.RIOT_API_KEY = "riot-key";
    process.env.LOL_ACCOUNTS = "broken;MissingSummoner|EUW|EUW;MissingAccount|EUW|EUW";
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ puuid: "puuid-1" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

    const response = await GET();
    const body = await response.json();

    expect(body.accounts).toHaveLength(2);
    expect(body.accounts[0]).toMatchObject({
      error: "Summoner lookup failed (404).",
    });
    expect(body.accounts[1]).toMatchObject({
      error: "Riot account lookup failed (404).",
    });
  });

  it("returns a route-level LoL error when fetching throws", async () => {
    const { GET } = await import("../lol/rank/route");
    process.env.RIOT_API_KEY = "riot-key";
    process.env.LOL_ACCOUNTS = "TestPlayer|EUW|EUW";
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      configured: true,
      error: "Unexpected error while fetching League of Legends data.",
      accounts: [],
    });
  });

  it("returns a GitHub dashboard from REST data without a token", async () => {
    const { GET } = await import("../github/route");
    process.env.GITHUB_USERNAME = "lukasz";
    delete process.env.GITHUB_TOKEN;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);

      if (url.endsWith("/users/lukasz")) {
        return jsonResponse({
          login: "lukasz",
          name: "Lukasz",
          avatar_url: "https://example.com/avatar.png",
          html_url: "https://github.com/lukasz",
          bio: "Builder",
          followers: 10,
          following: 3,
          public_repos: 2,
        });
      }

      if (url.includes("/users/lukasz/repos")) {
        return jsonResponse([
          {
            full_name: "lukasz/personal-dashboard",
            name: "personal-dashboard",
            description: "Dashboard",
            html_url: "https://github.com/lukasz/personal-dashboard",
            stargazers_count: 5,
            forks_count: 1,
            watchers_count: 2,
            open_issues_count: 1,
            language: "TypeScript",
            pushed_at: "2026-04-28T08:00:00Z",
            updated_at: "2026-04-28T08:00:00Z",
            archived: false,
            fork: false,
          },
        ]);
      }

      if (url.includes("/users/lukasz/events")) {
        return jsonResponse([
          {
            id: "event-1",
            type: "PushEvent",
            created_at: "2026-04-28T08:00:00Z",
            repo: { name: "lukasz/personal-dashboard" },
            payload: { commits: [{ sha: "abc", message: "Test", url: "" }] },
          },
        ]);
      }

      if (url.endsWith("/repos/lukasz/personal-dashboard")) {
        return jsonResponse({
          full_name: "lukasz/personal-dashboard",
          name: "personal-dashboard",
          description: "Dashboard",
          html_url: "https://github.com/lukasz/personal-dashboard",
          stargazers_count: 5,
          forks_count: 1,
          watchers_count: 2,
          open_issues_count: 2,
          language: "TypeScript",
          pushed_at: "2026-04-28T08:00:00Z",
          updated_at: "2026-04-28T08:00:00Z",
          archived: false,
          fork: false,
        });
      }

      if (url.includes("/commits")) {
        return jsonResponse([
          {
            sha: "abcdef123",
            html_url: "https://github.com/commit",
            commit: {
              message: "Add dashboard\n\nbody",
              author: { name: "Lukasz", date: "2026-04-28T08:00:00Z" },
            },
          },
        ]);
      }

      if (url.includes("/issues")) {
        return jsonResponse([
          {
            id: 1,
            number: 7,
            title: "Open issue",
            html_url: "https://github.com/issues/7",
            updated_at: "2026-04-28T08:00:00Z",
          },
          {
            id: 2,
            number: 8,
            title: "PR issue",
            html_url: "https://github.com/issues/8",
            updated_at: "2026-04-28T08:00:00Z",
            pull_request: {},
          },
        ]);
      }

      if (url.includes("/pulls")) {
        return jsonResponse([
          {
            id: 3,
            number: 9,
            title: "Open PR",
            html_url: "https://github.com/pulls/9",
            updated_at: "2026-04-28T08:00:00Z",
            draft: true,
          },
        ]);
      }

      if (url.includes("/releases")) {
        return jsonResponse([
          {
            id: 4,
            name: "v1",
            tag_name: "v1.0.0",
            html_url: "https://github.com/releases/v1",
            published_at: "2026-04-27T08:00:00Z",
            prerelease: false,
          },
        ]);
      }

      if (url.includes("/actions/runs")) {
        return jsonResponse({
          workflow_runs: [
            {
              id: 5,
              name: "CI",
              html_url: "https://github.com/actions/5",
              status: "completed",
              conclusion: "failure",
              event: "push",
              head_branch: "main",
              created_at: "2026-04-28T08:00:00Z",
              updated_at: "2026-04-28T08:10:00Z",
            },
          ],
        });
      }

      return jsonResponse({}, false, 404);
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      configured: true,
      hasToken: false,
      profile: {
        login: "lukasz",
        publicRepos: 2,
      },
      contributions: {
        available: false,
      },
      aggregate: {
        publicRepos: 1,
        stars: 5,
        failedWorkflowRuns: 1,
      },
    });
    expect(body.repositories[0]).toMatchObject({
      fullName: "lukasz/personal-dashboard",
      latestCommits: [{ shortSha: "abcdef1", message: "Add dashboard" }],
      openPullRequests: [{ draft: true }],
      latestRelease: { tagName: "v1.0.0" },
    });
    expect(body.events[0]).toMatchObject({
      label: "Push",
      detail: "1 commit w personal-dashboard",
    });
  });

  it("uses GitHub token, configured repos and GraphQL contributions", async () => {
    const { GET } = await import("../github/route");
    process.env.GITHUB_USERNAME = "lukasz";
    process.env.GITHUB_TOKEN = "github-token";
    process.env.GITHUB_REPOS = "custom,other/repo";
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);

      if (url === "https://api.github.com/graphql") {
        expect(init).toMatchObject({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer github-token",
          }),
        });
        return jsonResponse({
          data: {
            user: {
              login: "lukasz",
              name: "Lukasz",
              avatarUrl: "https://example.com/avatar.png",
              url: "https://github.com/lukasz",
              followers: { totalCount: 10 },
              repositories: { totalCount: 2 },
              issues: { totalCount: 3 },
              pullRequests: { totalCount: 4 },
              contributionsCollection: {
                totalCommitContributions: 5,
                totalIssueContributions: 3,
                totalPullRequestContributions: 4,
                totalPullRequestReviewContributions: 2,
                totalRepositoryContributions: 1,
                restrictedContributionsCount: 0,
                contributionCalendar: {
                  totalContributions: 14,
                  weeks: [
                    {
                      contributionDays: [
                        { date: "2026-04-28", contributionCount: 5, color: "#22c55e" },
                      ],
                    },
                  ],
                },
              },
            },
            rateLimit: {
              remaining: 4999,
              resetAt: "2026-04-28T12:00:00Z",
            },
          },
        });
      }

      if (url.endsWith("/users/lukasz")) {
        return jsonResponse({
          login: "lukasz",
          name: "Lukasz",
          avatar_url: "https://example.com/avatar.png",
          html_url: "https://github.com/lukasz",
          bio: null,
          followers: 10,
          following: 3,
          public_repos: 2,
        });
      }

      if (url.includes("/users/lukasz/repos")) {
        return jsonResponse([
          {
            full_name: "lukasz/ignored",
            name: "ignored",
            stargazers_count: 1,
            forks_count: 1,
            pushed_at: null,
            updated_at: "2026-04-26T08:00:00Z",
            archived: false,
            fork: false,
          },
        ]);
      }

      if (url.includes("/users/lukasz/events")) {
        return jsonResponse([
          {
            id: "pr",
            type: "PullRequestEvent",
            created_at: "2026-04-28T08:00:00Z",
            repo: { name: "other/repo" },
            payload: {
              action: "opened",
              pull_request: { number: 10, html_url: "https://github.com/pr/10" },
            },
          },
          {
            id: "issue",
            type: "IssuesEvent",
            created_at: "2026-04-28T08:00:00Z",
            repo: { name: "other/repo" },
            payload: {
              action: "closed",
              issue: { number: 11, html_url: "https://github.com/issues/11" },
            },
          },
          {
            id: "star",
            type: "WatchEvent",
            created_at: "2026-04-28T08:00:00Z",
            repo: { name: "other/repo" },
            payload: {},
          },
          {
            id: "create",
            type: "CreateEvent",
            created_at: "2026-04-28T08:00:00Z",
            repo: { name: "other/repo" },
            payload: { ref_type: "branch", ref: "main" },
          },
          {
            id: "release",
            type: "ReleaseEvent",
            created_at: "2026-04-28T08:00:00Z",
            repo: { name: "other/repo" },
            payload: {
              release: {
                tag_name: "v2.0.0",
                html_url: "https://github.com/releases/v2",
              },
            },
          },
          {
            id: "fork",
            type: "ForkEvent",
            created_at: "2026-04-28T08:00:00Z",
            repo: { name: "other/repo" },
            payload: {},
          },
        ]);
      }

      if (url.endsWith("/repos/lukasz/custom")) {
        return jsonResponse({ message: "missing" }, false, 404);
      }

      if (url.endsWith("/repos/other/repo")) {
        return jsonResponse({
          full_name: "other/repo",
          name: "repo",
          description: null,
          html_url: "https://github.com/other/repo",
          stargazers_count: 0,
          forks_count: 0,
          watchers_count: 0,
          open_issues_count: 0,
          language: null,
          pushed_at: null,
          updated_at: "2026-04-28T08:00:00Z",
          archived: false,
          fork: false,
        });
      }

      if (url.includes("/repos/other/repo/commits")) return jsonResponse([]);
      if (url.includes("/repos/other/repo/issues")) return jsonResponse([]);
      if (url.includes("/repos/other/repo/pulls")) return jsonResponse([]);
      if (url.includes("/repos/other/repo/releases")) return jsonResponse([]);
      if (url.includes("/repos/other/repo/actions/runs")) {
        return jsonResponse({ workflow_runs: [] });
      }

      return jsonResponse({}, false, 404);
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.hasToken).toBe(true);
    expect(body.contributions).toMatchObject({
      available: true,
      totals: {
        contributions: 14,
        commits: 5,
      },
      calendar: [{ date: "2026-04-28", contributionCount: 5, color: "#22c55e" }],
    });
    expect(body.repositories).toHaveLength(1);
    expect(body.errors[0]).toContain("lukasz/custom");
    expect(body.events.map((event: { label: string }) => event.label)).toEqual([
      "Pull request",
      "Issue",
      "Star",
      "Create",
      "Release",
      "Fork",
    ]);
  });

  it("captures GitHub GraphQL errors in the contribution payload", async () => {
    const { GET } = await import("../github/route");
    process.env.GITHUB_USERNAME = "lukasz";
    process.env.GITHUB_TOKEN = "github-token";
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);

      if (url === "https://api.github.com/graphql") {
        return jsonResponse({
          errors: [{ message: "GraphQL rate limited" }],
        });
      }

      if (url.endsWith("/users/lukasz")) {
        return jsonResponse({
          login: "lukasz",
          name: null,
          avatar_url: "https://example.com/avatar.png",
          html_url: "https://github.com/lukasz",
          bio: null,
          followers: 0,
          following: 0,
          public_repos: 2,
        });
      }

      if (url.includes("/users/lukasz/repos")) {
        return jsonResponse([
          {
            full_name: "lukasz/newer",
            name: "newer",
            stargazers_count: 1,
            forks_count: 0,
            pushed_at: null,
            updated_at: "2026-04-28T08:00:00Z",
            archived: false,
            fork: false,
          },
          {
            full_name: "lukasz/older",
            name: "older",
            stargazers_count: 2,
            forks_count: 0,
            pushed_at: null,
            updated_at: "2026-04-27T08:00:00Z",
            archived: false,
            fork: false,
          },
        ]);
      }

      if (url.includes("/users/lukasz/events")) return jsonResponse([]);

      if (url.endsWith("/repos/lukasz/newer") || url.endsWith("/repos/lukasz/older")) {
        const name = url.endsWith("/newer") ? "newer" : "older";
        return jsonResponse({
          full_name: `lukasz/${name}`,
          name,
          description: null,
          html_url: `https://github.com/lukasz/${name}`,
          stargazers_count: 0,
          forks_count: 0,
          watchers_count: 0,
          open_issues_count: 0,
          language: null,
          pushed_at: null,
          updated_at: "2026-04-28T08:00:00Z",
          archived: false,
          fork: false,
        });
      }

      if (url.includes("/commits")) return jsonResponse([]);
      if (url.includes("/issues")) return jsonResponse([]);
      if (url.includes("/pulls")) return jsonResponse([]);
      if (url.includes("/releases")) return jsonResponse([]);
      if (url.includes("/actions/runs")) return jsonResponse({ workflow_runs: [] });

      return jsonResponse({}, false, 404);
    });

    const response = await GET();
    const body = await response.json();

    expect(body.contributions).toMatchObject({
      available: false,
      reason: "GraphQL rate limited",
    });
    expect(body.repositories.map((repo: { fullName: string }) => repo.fullName)).toEqual([
      "lukasz/newer",
      "lukasz/older",
    ]);
  });

  it("reports missing GitHub GraphQL user and invalid repository names", async () => {
    const { GET } = await import("../github/route");
    process.env.GITHUB_USERNAME = "lukasz";
    process.env.GITHUB_TOKEN = "github-token";
    process.env.GITHUB_REPOSITORIES = "bad/";
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);

      if (url === "https://api.github.com/graphql") {
        return jsonResponse({ data: { user: null } });
      }

      if (url.endsWith("/users/lukasz")) {
        return jsonResponse({
          login: "lukasz",
          name: null,
          avatar_url: "https://example.com/avatar.png",
          html_url: "https://github.com/lukasz",
          bio: null,
          followers: 0,
          following: 0,
          public_repos: 0,
        });
      }

      if (url.includes("/users/lukasz/repos")) return jsonResponse([]);
      if (url.includes("/users/lukasz/events")) return jsonResponse([]);

      return jsonResponse({}, false, 404);
    });

    const response = await GET();
    const body = await response.json();

    expect(body.contributions).toMatchObject({
      available: false,
      reason: "Nie znaleziono użytkownika GitHub.",
    });
    expect(body.errors[0]).toBe("bad/: Invalid repository: bad/");
  });

  it("reports missing GitHub username", async () => {
    const { GET } = await import("../github/route");
    delete process.env.GITHUB_USERNAME;

    const response = await GET();

    expect(await response.json()).toEqual({
      configured: false,
      missing: ["GITHUB_USERNAME"],
    });
  });

  it("returns a configured GitHub error when REST fails", async () => {
    const { GET } = await import("../github/route");
    process.env.GITHUB_USERNAME = "lukasz";
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      configured: true,
      error: "GitHub REST /users/lukasz failed with 500",
    });
  });
});

function jsonResponse(payload: unknown, ok = true, status = ok ? 200 : 500) {
  return Promise.resolve({
    ok,
    status,
    json: async () => payload,
  } as Response);
}

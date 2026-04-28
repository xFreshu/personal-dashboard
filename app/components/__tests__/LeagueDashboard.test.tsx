import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LeagueDashboard from "../LeagueDashboard";

const account = {
  profile: {
    gameName: "TestPlayer",
    tagLine: "EUW",
    platform: "EUW1",
  },
  error: null,
  links: {
    overview: "https://dpm.lol/TestPlayer-EUW",
    champions: "https://dpm.lol/TestPlayer-EUW/champions",
    live: "https://dpm.lol/TestPlayer-EUW/live",
    opgg: "https://op.gg/lol/summoners/euw/TestPlayer-EUW",
  },
  summary: {
    games: 2,
    wins: 1,
    losses: 1,
    winRate: 50,
    avgKda: 5.63,
    avgCsPerMinute: 4.4,
    avgDamage: 17000,
    avgVision: 31,
    favoriteChampion: "Ahri",
    mainPosition: "Mid",
  },
  pagination: {
    start: 0,
    count: 8,
    nextStart: 2,
    hasMore: true,
  },
  matches: [
    {
      matchId: "EUW1_1",
      gameCreation: 1_776_000_000_000,
      gameEndTimestamp: null,
      gameDuration: 1800,
      gameMode: "CLASSIC",
      queueId: 420,
      queueName: "Solo/Duo",
      championName: "Ahri",
      championIconUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/Ahri_0.jpg",
      position: "Mid",
      kills: 8,
      deaths: 2,
      assists: 10,
      kda: 9,
      cs: 200,
      csPerMinute: 6.7,
      damage: 22000,
      gold: 13000,
      visionScore: 24,
      win: true,
      laneOpponent: {
        riotId: "EnemyMid#EUW",
        dpmUrl: "https://dpm.lol/EnemyMid-EUW",
        championName: "Zed",
        championIconUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/Zed_0.jpg",
        position: "Mid",
      },
      details: {
        championLevel: 16,
        killParticipation: 75,
        damageShare: 40,
        goldShare: 35,
        wardsPlaced: 9,
        wardsKilled: 2,
        controlWards: 1,
        damageTaken: 14000,
        damageMitigated: 5000,
        objectiveDamage: 1200,
        turretDamage: 800,
        healing: 1200,
        ccScore: 18,
        largestMultiKill: "Double",
      },
      teams: [
        {
          teamId: 100,
          name: "Twoja drużyna",
          win: true,
          kills: 24,
          deaths: 15,
          assists: 42,
          gold: 62000,
          damage: 55000,
          objectives: {
            barons: 1,
            dragons: 3,
            grubs: 4,
            heralds: 1,
            inhibitors: 2,
            towers: 8,
          },
          participants: [
            {
              puuid: "puuid-1",
              riotId: "TestPlayer#EUW",
              dpmUrl: "https://dpm.lol/TestPlayer-EUW",
              teamId: 100,
              championName: "Ahri",
              championIconUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/Ahri_0.jpg",
              position: "Mid",
              kills: 8,
              deaths: 2,
              assists: 10,
              kda: 9,
              cs: 200,
              csPerMinute: 6.7,
              damage: 22000,
              gold: 13000,
              visionScore: 24,
              win: true,
              isCurrentPlayer: true,
            },
          ],
        },
        {
          teamId: 200,
          name: "Rywal",
          win: false,
          kills: 15,
          deaths: 24,
          assists: 20,
          gold: 50000,
          damage: 41000,
          objectives: {
            barons: 0,
            dragons: 1,
            grubs: 2,
            heralds: 0,
            inhibitors: 0,
            towers: 3,
          },
          participants: [
            {
              puuid: "puuid-2",
              riotId: "Enemy#EUW",
              dpmUrl: "https://dpm.lol/Enemy-EUW",
              teamId: 200,
              championName: "Lux",
              championIconUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/Lux_0.jpg",
              position: "Support",
              kills: 1,
              deaths: 8,
              assists: 7,
              kda: 1,
              cs: 30,
              csPerMinute: 1,
              damage: 12000,
              gold: 8000,
              visionScore: 30,
              win: false,
              isCurrentPlayer: false,
            },
          ],
        },
      ],
    },
    {
      matchId: "EUW1_2",
      gameCreation: 1_775_990_000_000,
      gameEndTimestamp: null,
      gameDuration: 1200,
      gameMode: "CLASSIC",
      queueId: 440,
      queueName: "Flex",
      championName: "Lux",
      championIconUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/Lux_0.jpg",
      position: "Support",
      kills: 1,
      deaths: 4,
      assists: 8,
      kda: 2.25,
      cs: 40,
      csPerMinute: 2,
      damage: 12000,
      gold: 8000,
      visionScore: 38,
      win: false,
      laneOpponent: null,
      details: {
        championLevel: 12,
        killParticipation: 60,
        damageShare: 20,
        goldShare: 18,
        wardsPlaced: 24,
        wardsKilled: 7,
        controlWards: 5,
        damageTaken: 9000,
        damageMitigated: 2000,
        objectiveDamage: 400,
        turretDamage: 100,
        healing: 3000,
        ccScore: 25,
        largestMultiKill: "Brak",
      },
      teams: [],
    },
  ],
};

describe("LeagueDashboard", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          configured: true,
          accounts: [account],
        }),
      }),
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders match history summary and external links", async () => {
    const { container } = render(<LeagueDashboard />);

    expect(await screen.findByRole("heading", { name: "TestPlayer#EUW" })).toBeInTheDocument();
    expect(screen.getByText("1W-1L")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getAllByText("Ahri").length).toBeGreaterThan(0);
    expect(screen.getByText("Lux")).toBeInTheDocument();
    expect(screen.getByText("Najlepszy mecz")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /OP.GG/i })).toHaveAttribute(
      "href",
      "https://op.gg/lol/summoners/euw/TestPlayer-EUW",
    );
  });

  it("expands match details with team champions and advanced stats", async () => {
    const user = userEvent.setup();
    render(<LeagueDashboard />);

    expect(await screen.findByRole("heading", { name: "TestPlayer#EUW" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /EUW1_1/i }));

    expect(screen.getByText("Twoja drużyna")).toBeInTheDocument();
    expect(screen.getByText("Rywal")).toBeInTheDocument();
    expect(screen.getAllByText("TestPlayer#EUW").length).toBeGreaterThan(0);
    expect(screen.getByText("KP")).toBeInTheDocument();
    expect(screen.getByText("75.0%")).toBeInTheDocument();
    expect(screen.getByText("Objective dmg")).toBeInTheDocument();
    expect(screen.getByText("Matchup na linii")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Zed/i })).toHaveAttribute(
      "href",
      "https://dpm.lol/EnemyMid-EUW",
    );
  });

  it("loads the next match page from the load more control", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({
          configured: true,
          accounts: [account],
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          configured: true,
          accounts: [
            {
              ...account,
              accountIndex: 0,
              summary: {
                ...account.summary,
                games: 1,
                wins: 1,
                losses: 0,
              },
              pagination: {
                start: 2,
                count: 8,
                nextStart: 3,
                hasMore: false,
              },
              matches: [
                {
                  ...account.matches[0],
                  matchId: "EUW1_3",
                  championName: "Diana",
                  championIconUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/Diana_0.jpg",
                },
              ],
            },
          ],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<LeagueDashboard />);

    expect(await screen.findByRole("heading", { name: "TestPlayer#EUW" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Pokaż kolejne/i }));

    expect(await screen.findByText("Diana")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/lol/matches?start=2&count=8&account=0",
      { cache: "no-store" },
    );
  });

  it("switches between configured accounts", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          configured: true,
          accounts: [
            account,
            {
              ...account,
              profile: {
                gameName: "Second",
                tagLine: "EUW",
                platform: "EUW1",
              },
              summary: {
                ...account.summary,
                favoriteChampion: "Diana",
              },
              matches: [],
            },
          ],
        }),
      }),
    );

    render(<LeagueDashboard />);

    expect(await screen.findByRole("heading", { name: "TestPlayer#EUW" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Second#EUW" }));

    expect(screen.getByRole("heading", { name: "Second#EUW" })).toBeInTheDocument();
    expect(screen.getByText("Diana")).toBeInTheDocument();
    expect(screen.getByText("Brak meczów do pokazania.")).toBeInTheDocument();
  });

  it("shows missing configuration details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          configured: false,
          missing: ["RIOT_API_KEY", "LOL_ACCOUNTS"],
        }),
      }),
    );

    render(<LeagueDashboard />);

    expect(await screen.findByText("Brak konfiguracji Riot")).toBeInTheDocument();
    expect(screen.getByText(/RIOT_API_KEY, LOL_ACCOUNTS/)).toBeInTheDocument();
  });

  it("shows match history fetch errors instead of looking like a normal empty state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          configured: true,
          accounts: [
            {
              ...account,
              error: "Riot rate limit przy pobieraniu szczegółów meczu (429).",
              summary: {
                ...account.summary,
                games: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
              },
              matches: [],
            },
          ],
        }),
      }),
    );

    render(<LeagueDashboard />);

    expect(await screen.findByText("Nie udało się pobrać świeżej historii.")).toBeInTheDocument();
    expect(
      screen.getByText("Riot rate limit przy pobieraniu szczegółów meczu (429)."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Odśwież/i })).toBeInTheDocument();
  });

  it("renders empty fallback when fetching fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<LeagueDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Brak kont League do wyświetlenia.")).toBeInTheDocument();
    });
  });
});

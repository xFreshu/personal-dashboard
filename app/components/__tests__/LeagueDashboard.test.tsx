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
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.includes("/api/lol/player-ranks")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              configured: true,
              ranks: {
                "puuid-1": {
                  queueType: "RANKED_SOLO_5x5",
                  tier: "GOLD",
                  rank: "II",
                  leaguePoints: 34,
                },
                "puuid-2": {
                  queueType: "RANKED_FLEX_SR",
                  tier: "SILVER",
                  rank: "I",
                  leaguePoints: 12,
                },
              },
            }),
          });
        }

        if (url.includes("/api/lol/live-game")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              configured: true,
              status: "inactive",
            }),
          });
        }

        if (url.includes("/api/lol/rank")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              configured: true,
              accounts: [
                {
                  profile: {
                    gameName: "TestPlayer",
                    tagLine: "EUW",
                    platform: "EUW1",
                  },
                  error: null,
                  primaryQueue: {
                    queueType: "RANKED_SOLO_5x5",
                    tier: "DIAMOND",
                    rank: "IV",
                    leaguePoints: 22,
                    wins: 10,
                    losses: 8,
                    winRate: 56,
                  },
                  soloQueue: null,
                  flexQueue: null,
                  liveGame: {
                    status: "inactive",
                  },
                },
              ],
            }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: async () => ({
            configured: true,
            accounts: [account],
          }),
        });
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
    expect(screen.getAllByText("DIAMOND IV · 22 LP").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ahri").length).toBeGreaterThan(0);
    expect(screen.getByText("Lux")).toBeInTheDocument();
    expect(screen.getByText("Best game")).toBeInTheDocument();
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

    expect(screen.getByText("Your Team")).toBeInTheDocument();
    expect(screen.getByText("Enemy Team")).toBeInTheDocument();
    expect(screen.getAllByText("TestPlayer#EUW").length).toBeGreaterThan(0);
    expect(screen.getByText("KP")).toBeInTheDocument();
    expect(screen.getByText("75.0%")).toBeInTheDocument();
    expect(screen.getByText("Objective dmg")).toBeInTheDocument();
    expect(screen.getByText("Lane matchup")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Zed/i })).toHaveAttribute(
      "href",
      "https://dpm.lol/EnemyMid-EUW",
    );
    expect(await screen.findByText("GOLD II · 34 LP")).toBeInTheDocument();
  });

  it("loads the next match page from the load more control", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/lol/rank")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            configured: true,
            accounts: [
              {
                profile: account.profile,
                error: null,
                primaryQueue: null,
                soloQueue: null,
                flexQueue: null,
                liveGame: {
                  status: "inactive",
                },
              },
            ],
          }),
        });
      }

      if (url.includes("start=2&count=8&account=0")) {
        return Promise.resolve({
          ok: true,
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
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          configured: true,
          accounts: [account],
        }),
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<LeagueDashboard />);

    expect(await screen.findByRole("heading", { name: "TestPlayer#EUW" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Show more/i }));

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
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.includes("/api/lol/rank")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              configured: true,
              accounts: [
                {
                  profile: account.profile,
                  error: null,
                  primaryQueue: null,
                  soloQueue: null,
                  flexQueue: null,
                  liveGame: {
                    status: "inactive",
                  },
                },
                {
                  profile: {
                    gameName: "Second",
                    tagLine: "EUW",
                    platform: "EUW1",
                  },
                  error: null,
                  primaryQueue: null,
                  soloQueue: null,
                  flexQueue: null,
                  liveGame: {
                    status: "inactive",
                  },
                },
              ],
            }),
          });
        }

        return Promise.resolve({
          ok: true,
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
        });
      }),
    );

    render(<LeagueDashboard />);

    expect(await screen.findByRole("heading", { name: "TestPlayer#EUW" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Second#EUW/i }));

    expect(screen.getByRole("heading", { name: "Second#EUW" })).toBeInTheDocument();
    expect(screen.getByText("Diana")).toBeInTheDocument();
    expect(screen.getByText("No matches to display.")).toBeInTheDocument();
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

    expect(await screen.findByText("Riot configuration missing")).toBeInTheDocument();
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

    expect(await screen.findByText("Could not fetch fresh match history.")).toBeInTheDocument();
    expect(
      screen.getByText("Riot rate limit przy pobieraniu szczegółów meczu (429)."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Refresh/i })).toBeInTheDocument();
  });

  it("renders empty fallback when fetching fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<LeagueDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No League accounts available.")).toBeInTheDocument();
    });
  });

  it("renders live scouting when the active account is in game", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.includes("/api/lol/live-game")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              configured: true,
              status: "active",
              gameId: 123,
              gameMode: "CLASSIC",
              gameType: "MATCHED_GAME",
              gameStartTime: Date.now() - 180_000,
              queueId: 420,
              queueName: "Solo Queue",
              participantCount: 10,
              links: {
                overview: "https://dpm.lol/TestPlayer-EUW",
                champions: "https://dpm.lol/TestPlayer-EUW/champions",
                live: "https://dpm.lol/TestPlayer-EUW/live",
              },
              teams: [
                {
                  teamId: 100,
                  label: "Your Team",
                  analysis: {
                    highestRank: "DIAMOND IV · 22 LP",
                    knownRanks: 4,
                    unrankedCount: 1,
                    frontlineCount: 2,
                    backlineCount: 3,
                    composition: ["2x Mage", "2x Fighter"],
                  },
                  participants: [
                    {
                      summonerId: "summoner-1",
                      summonerName: "TestPlayer",
                      championId: 103,
                      championName: "Ahri",
                      championIconUrl:
                        "https://ddragon.leagueoflegends.com/cdn/15.8.1/img/champion/Ahri.png",
                      championTags: ["Mage", "Assassin"],
                      spell1Id: 4,
                      spell2Id: 14,
                      teamId: 100,
                      bot: false,
                      isCurrentPlayer: true,
                      rank: {
                        queueType: "RANKED_SOLO_5x5",
                        tier: "DIAMOND",
                        rank: "IV",
                        leaguePoints: 22,
                      },
                      rankLabel: "DIAMOND IV · 22 LP",
                      rankScore: 2422,
                    },
                  ],
                },
                {
                  teamId: 200,
                  label: "Enemy Team",
                  analysis: {
                    highestRank: "EMERALD II · 44 LP",
                    knownRanks: 5,
                    unrankedCount: 0,
                    frontlineCount: 1,
                    backlineCount: 4,
                    composition: ["3x Mage"],
                  },
                  participants: [
                    {
                      summonerId: "summoner-2",
                      summonerName: "EnemyMid",
                      championId: 238,
                      championName: "Zed",
                      championIconUrl:
                        "https://ddragon.leagueoflegends.com/cdn/15.8.1/img/champion/Zed.png",
                      championTags: ["Assassin"],
                      spell1Id: 4,
                      spell2Id: 12,
                      teamId: 200,
                      bot: false,
                      isCurrentPlayer: false,
                      rank: {
                        queueType: "RANKED_SOLO_5x5",
                        tier: "EMERALD",
                        rank: "II",
                        leaguePoints: 44,
                      },
                      rankLabel: "EMERALD II · 44 LP",
                      rankScore: 2244,
                    },
                  ],
                },
              ],
            }),
          });
        }

        if (url.includes("/api/lol/rank")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              configured: true,
              accounts: [
                {
                  profile: account.profile,
                  error: null,
                  primaryQueue: {
                    queueType: "RANKED_SOLO_5x5",
                    tier: "DIAMOND",
                    rank: "IV",
                    leaguePoints: 22,
                    wins: 10,
                    losses: 8,
                    winRate: 56,
                  },
                  soloQueue: null,
                  flexQueue: null,
                  liveGame: {
                    status: "active",
                    gameId: 123,
                    gameMode: "CLASSIC",
                    gameType: "MATCHED_GAME",
                    gameStartTime: Date.now() - 180_000,
                    queueId: 420,
                    participantCount: 10,
                  },
                },
              ],
            }),
          });
        }

        if (url.includes("/api/lol/player-ranks")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              configured: true,
              ranks: {},
            }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: async () => ({
            configured: true,
            accounts: [account],
          }),
        });
      }),
    );

    render(<LeagueDashboard />);

    expect(await screen.findByText("Live scouting")).toBeInTheDocument();
    expect(screen.getByText("In game right now")).toBeInTheDocument();
    expect(await screen.findByText("Your Team")).toBeInTheDocument();
    expect(screen.getByText("Enemy Team")).toBeInTheDocument();
    expect(screen.getByText("Highest rank: DIAMOND IV · 22 LP")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open Live DPM/i })).toHaveAttribute(
      "href",
      "https://dpm.lol/TestPlayer-EUW/live",
    );
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LolRankWidget from "../LolRankWidget";

describe("LolRankWidget", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          configured: true,
          accounts: [
            {
              profile: {
                gameName: "TestPlayer",
                tagLine: "EUW",
                platform: "EUW1",
                summonerLevel: 123,
              },
              error: null,
              primaryQueue: {
                queueType: "RANKED_SOLO_5x5",
                tier: "DIAMOND",
                rank: "II",
                leaguePoints: 80,
                wins: 12,
                losses: 8,
                winRate: 60,
              },
              soloQueue: {
                queueType: "RANKED_SOLO_5x5",
                tier: "DIAMOND",
                rank: "II",
                leaguePoints: 80,
                wins: 12,
                losses: 8,
                winRate: 60,
              },
              flexQueue: null,
              links: {
                overview: "https://dpm.lol/TestPlayer-EUW",
                champions: "https://dpm.lol/TestPlayer-EUW/champions",
                live: "https://dpm.lol/TestPlayer-EUW/live",
              },
            },
          ],
        }),
      }),
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders fetched account rank data and DPM links", async () => {
    render(<LolRankWidget />);

    await waitFor(() => {
      expect(screen.getByText("TestPlayer#EUW")).toBeInTheDocument();
    });

    expect(screen.getAllByText("DIAMOND II")).toHaveLength(2);
    expect(screen.getByText("80 LP · 12W-8L")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /DPM/i })).toHaveAttribute(
      "href",
      "https://dpm.lol/TestPlayer-EUW",
    );
  });

  it("shows missing Riot configuration details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          configured: false,
          missing: ["RIOT_API_KEY", "LOL_ACCOUNTS"],
        }),
      }),
    );

    render(<LolRankWidget />);

    expect(await screen.findByText("Brak konfiguracji")).toBeInTheDocument();
    expect(screen.getByText("RIOT_API_KEY, LOL_ACCOUNTS")).toBeInTheDocument();
  });

  it("renders empty configured account state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          configured: true,
          accounts: [],
        }),
      }),
    );

    render(<LolRankWidget />);

    expect(await screen.findByText("Brak kont do wyświetlenia.")).toBeInTheDocument();
  });

  it("renders nothing for a null rank payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => null,
      }),
    );

    const { container } = render(<LolRankWidget />);

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it("switches between multiple accounts", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          configured: true,
          accounts: [
            {
              profile: {
                gameName: "First",
                tagLine: "EUW",
                platform: "EUW1",
              },
              error: null,
              primaryQueue: null,
              soloQueue: null,
              flexQueue: null,
              links: {
                overview: "https://dpm.lol/First-EUW",
                champions: "https://dpm.lol/First-EUW/champions",
                live: "https://dpm.lol/First-EUW/live",
              },
            },
            {
              profile: {
                gameName: "Second",
                tagLine: "EUW",
                platform: "EUW1",
              },
              error: "Riot account lookup failed (404).",
              primaryQueue: null,
              soloQueue: null,
              flexQueue: null,
              links: {
                overview: "https://dpm.lol/Second-EUW",
                champions: "https://dpm.lol/Second-EUW/champions",
                live: "https://dpm.lol/Second-EUW/live",
              },
            },
          ],
        }),
      }),
    );

    render(<LolRankWidget />);

    expect(await screen.findByText("First#EUW")).toBeInTheDocument();
    expect(screen.getAllByText("Unranked")).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Następne konto" }));

    expect(screen.getByText("Second#EUW")).toBeInTheDocument();
    expect(screen.getByText("Riot account lookup failed (404).")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Poprzednie konto" }));

    expect(screen.getByText("First#EUW")).toBeInTheDocument();
  });

  it("rotates accounts automatically and shows a fetch error fallback", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          configured: true,
          accounts: [
            {
              profile: {
                gameName: "AutoFirst",
                tagLine: "EUW",
                platform: "EUW1",
              },
              error: null,
              primaryQueue: null,
              soloQueue: null,
              flexQueue: null,
              links: {
                overview: "https://dpm.lol/AutoFirst-EUW",
                champions: "https://dpm.lol/AutoFirst-EUW/champions",
                live: "https://dpm.lol/AutoFirst-EUW/live",
              },
            },
            {
              profile: {
                gameName: "AutoSecond",
                tagLine: "EUW",
                platform: "EUW1",
              },
              error: null,
              primaryQueue: null,
              soloQueue: null,
              flexQueue: null,
              links: {
                overview: "https://dpm.lol/AutoSecond-EUW",
                champions: "https://dpm.lol/AutoSecond-EUW/champions",
                live: "https://dpm.lol/AutoSecond-EUW/live",
              },
            },
          ],
        }),
      }),
    );

    const { unmount } = render(<LolRankWidget />);

    expect(await screen.findByText("AutoFirst#EUW")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(10_000);

    await waitFor(() => {
      expect(screen.getByText("AutoSecond#EUW")).toBeInTheDocument();
    });

    unmount();
    vi.useRealTimers();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<LolRankWidget />);

    expect(await screen.findByText("Brak kont do wyświetlenia.")).toBeInTheDocument();
  });

  it.each([
    "IRON",
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "EMERALD",
    "MASTER",
    "GRANDMASTER",
    "CHALLENGER",
  ])("renders %s tier styling branch", async (tier) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          configured: true,
          accounts: [
            {
              profile: {
                gameName: tier,
                tagLine: "EUW",
                platform: "EUW1",
              },
              error: null,
              primaryQueue: {
                queueType: "RANKED_SOLO_5x5",
                tier,
                rank: "I",
                leaguePoints: 1,
                wins: 1,
                losses: 1,
                winRate: 50,
              },
              soloQueue: null,
              flexQueue: null,
              links: {
                overview: `https://dpm.lol/${tier}-EUW`,
                champions: `https://dpm.lol/${tier}-EUW/champions`,
                live: `https://dpm.lol/${tier}-EUW/live`,
              },
            },
          ],
        }),
      }),
    );

    render(<LolRankWidget />);

    expect(await screen.findByText(`${tier} I`)).toBeInTheDocument();
  });
});

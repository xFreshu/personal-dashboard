import { render, screen, waitFor } from "@testing-library/react";
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
});

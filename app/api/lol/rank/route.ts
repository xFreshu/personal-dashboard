import { NextResponse } from "next/server";
import {
  createRiotHeaders,
  getDpmLinks,
  getRegionalRoute,
  parseLolAccounts,
  type LolAccountConfig,
} from "@/lib/lol";

export const dynamic = "force-dynamic";

type RiotLeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

type RiotCurrentGame = {
  gameId: number;
  gameMode: string;
  gameType: string;
  gameStartTime: number;
  queueId: number;
  participants: unknown[];
};

type RankedQueue = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  winRate: number;
};

type RankedLookupResult =
  | { ok: true; entries: RiotLeagueEntry[] }
  | { ok: false; error: string };

type LiveGameStatus =
  | {
      status: "active";
      gameId: number;
      gameMode: string;
      gameType: string;
      gameStartTime: number;
      queueId: number;
      participantCount: number;
    }
  | {
      status: "inactive";
    }
  | {
      status: "unknown";
      error: string;
    };

function normalizeQueue(entry: RiotLeagueEntry): RankedQueue {
  const totalGames = entry.wins + entry.losses;

  return {
    queueType: entry.queueType,
    tier: entry.tier,
    rank: entry.rank,
    leaguePoints: entry.leaguePoints,
    wins: entry.wins,
    losses: entry.losses,
    winRate: totalGames > 0 ? Math.round((entry.wins / totalGames) * 100) : 0,
  };
}

async function fetchRankEntriesByPuuid(platform: string, puuid: string, apiKey: string): Promise<RankedLookupResult> {
  const response = await fetch(
    `https://${platform.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(
      puuid,
    )}`,
    {
      headers: createRiotHeaders(apiKey),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      error: `Ranked lookup failed (${response.status}).`,
    };
  }

  return {
    ok: true,
    entries: (await response.json()) as RiotLeagueEntry[],
  };
}

async function fetchRankEntriesBySummonerId(
  platform: string,
  summonerId: string,
  apiKey: string,
): Promise<RankedLookupResult> {
  const response = await fetch(
    `https://${platform.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(
      summonerId,
    )}`,
    {
      headers: createRiotHeaders(apiKey),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      error: `Ranked lookup failed (${response.status}).`,
    };
  }

  return {
    ok: true,
    entries: (await response.json()) as RiotLeagueEntry[],
  };
}

async function fetchLiveGame(
  accountConfig: LolAccountConfig,
  summonerId: string,
  apiKey: string,
): Promise<LiveGameStatus> {
  try {
    const liveGameResponse = await fetch(
      `https://${accountConfig.platform.toLowerCase()}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(
        summonerId,
      )}`,
      {
        headers: createRiotHeaders(apiKey),
        cache: "no-store",
      },
    );

    if (liveGameResponse.status === 404) {
      return { status: "inactive" };
    }

    if (!liveGameResponse.ok) {
      return {
        status: "unknown",
        error: `Live game lookup failed (${liveGameResponse.status}).`,
      };
    }

    const liveGame = (await liveGameResponse.json()) as RiotCurrentGame;

    return {
      status: "active",
      gameId: liveGame.gameId,
      gameMode: liveGame.gameMode,
      gameType: liveGame.gameType,
      gameStartTime: liveGame.gameStartTime,
      queueId: liveGame.queueId,
      participantCount: liveGame.participants.length,
    };
  } catch {
    return {
      status: "unknown",
      error: "Live game lookup failed.",
    };
  }
}

async function fetchRankForAccount(accountConfig: LolAccountConfig, apiKey: string) {
  const regionalRoute = getRegionalRoute(accountConfig.platform);

  if (!regionalRoute) {
    return {
      profile: accountConfig,
      error: `Unsupported platform ${accountConfig.platform}.`,
      primaryQueue: null,
      soloQueue: null,
      flexQueue: null,
      liveGame: {
        status: "unknown",
        error: `Unsupported platform ${accountConfig.platform}.`,
      },
      links: getDpmLinks(accountConfig.gameName, accountConfig.tagLine),
    };
  }

  const dpmLinks = getDpmLinks(accountConfig.gameName, accountConfig.tagLine);

  const accountResponse = await fetch(
    `https://${regionalRoute.toLowerCase()}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
      accountConfig.gameName,
    )}/${encodeURIComponent(accountConfig.tagLine)}`,
    {
      headers: createRiotHeaders(apiKey),
      cache: "no-store",
    },
  );

  if (!accountResponse.ok) {
    return {
      profile: accountConfig,
      error: `Riot account lookup failed (${accountResponse.status}).`,
      primaryQueue: null,
      soloQueue: null,
      flexQueue: null,
      liveGame: { status: "unknown", error: `Riot account lookup failed (${accountResponse.status}).` },
      links: dpmLinks,
    };
  }

  const riotAccount = (await accountResponse.json()) as { puuid: string };

  const summonerResponse = await fetch(
    `https://${accountConfig.platform.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${riotAccount.puuid}`,
    {
      headers: createRiotHeaders(apiKey),
      cache: "no-store",
    },
  );

  if (!summonerResponse.ok) {
    return {
      profile: accountConfig,
      error: `Summoner lookup failed (${summonerResponse.status}).`,
      primaryQueue: null,
      soloQueue: null,
      flexQueue: null,
      liveGame: { status: "unknown", error: `Summoner lookup failed (${summonerResponse.status}).` },
      links: dpmLinks,
    };
  }

  const summoner = (await summonerResponse.json()) as {
    id: string;
    summonerLevel: number;
    profileIconId: number;
  };

  const rankLookupByPuuid = await fetchRankEntriesByPuuid(accountConfig.platform, riotAccount.puuid, apiKey);
  const rankLookup =
    rankLookupByPuuid.ok
      ? rankLookupByPuuid
      : await fetchRankEntriesBySummonerId(accountConfig.platform, summoner.id, apiKey);

  if (!rankLookup.ok) {
    return {
      profile: {
        ...accountConfig,
        summonerLevel: summoner.summonerLevel,
        profileIconId: summoner.profileIconId,
      },
      error: rankLookup.error,
      primaryQueue: null,
      soloQueue: null,
      flexQueue: null,
      liveGame: { status: "unknown", error: rankLookup.error },
      links: dpmLinks,
    };
  }

  const entries = rankLookup.entries;
  const soloQueue = entries.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
  const flexQueue = entries.find((entry) => entry.queueType === "RANKED_FLEX_SR");
  const primaryQueue = soloQueue ?? flexQueue ?? null;
  const liveGame = await fetchLiveGame(accountConfig, summoner.id, apiKey);

  return {
    profile: {
      ...accountConfig,
      summonerLevel: summoner.summonerLevel,
      profileIconId: summoner.profileIconId,
    },
    error: null,
    primaryQueue: primaryQueue ? normalizeQueue(primaryQueue) : null,
    soloQueue: soloQueue ? normalizeQueue(soloQueue) : null,
    flexQueue: flexQueue ? normalizeQueue(flexQueue) : null,
    liveGame,
    links: dpmLinks,
  };
}

export async function GET() {
  const apiKey = process.env.RIOT_API_KEY;
  const accounts = parseLolAccounts(process.env.LOL_ACCOUNTS);

  const missing = [
    !apiKey && "RIOT_API_KEY",
    accounts.length === 0 && "LOL_ACCOUNTS",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return NextResponse.json({
      configured: false,
      missing,
    });
  }

  try {
    const accountResults = await Promise.all(
      accounts.map((account) => fetchRankForAccount(account, apiKey!)),
    );

    return NextResponse.json({
      configured: true,
      accounts: accountResults,
    });
  } catch (error) {
    console.error("LoL rank route error:", error);

    return NextResponse.json(
      {
        configured: true,
        error: "Unexpected error while fetching League of Legends data.",
        accounts: [],
      },
      { status: 500 },
    );
  }
}

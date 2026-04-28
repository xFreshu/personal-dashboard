import { NextResponse } from "next/server";

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

type LolAccountConfig = {
  gameName: string;
  tagLine: string;
  platform: string;
};

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

const PLATFORM_TO_REGION: Record<string, string> = {
  BR1: "AMERICAS",
  EUN1: "EUROPE",
  EUW1: "EUROPE",
  JP1: "ASIA",
  KR: "ASIA",
  LA1: "AMERICAS",
  LA2: "AMERICAS",
  NA1: "AMERICAS",
  OC1: "SEA",
  PH2: "SEA",
  RU: "EUROPE",
  SG2: "SEA",
  TH2: "SEA",
  TR1: "EUROPE",
  TW2: "SEA",
  VN2: "SEA",
};

const PLATFORM_ALIASES: Record<string, string> = {
  BR: "BR1",
  EUNE: "EUN1",
  EUW: "EUW1",
  JP: "JP1",
  KR: "KR",
  LAN: "LA1",
  LAS: "LA2",
  NA: "NA1",
  OCE: "OC1",
  PH: "PH2",
  RU: "RU",
  SG: "SG2",
  TH: "TH2",
  TR: "TR1",
  TW: "TW2",
  VN: "VN2",
};

function createRiotHeaders(apiKey: string) {
  return {
    "X-Riot-Token": apiKey,
  };
}

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

function getDpmUrl(gameName: string, tagLine: string) {
  return `https://dpm.lol/${encodeURIComponent(`${gameName}-${tagLine}`)}`;
}

function normalizePlatform(value: string) {
  const normalized = value.trim().toUpperCase();
  return PLATFORM_ALIASES[normalized] ?? normalized;
}

function getDpmLinks(gameName: string, tagLine: string) {
  const overview = getDpmUrl(gameName, tagLine);

  return {
    overview,
    champions: `${overview}/champions`,
    live: `${overview}/live`,
  };
}

function parseAccounts(input: string | undefined) {
  if (!input) return [];

  return input
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [gameName, tagLine, rawPlatform] = entry.split("|").map((part) => part.trim());

      if (!gameName || !tagLine || !rawPlatform) {
        return null;
      }

      return {
        gameName,
        tagLine,
        platform: normalizePlatform(rawPlatform),
      } satisfies LolAccountConfig;
    })
    .filter((entry): entry is LolAccountConfig => entry !== null);
}

async function fetchLiveGame(
  accountConfig: LolAccountConfig,
  puuid: string,
  apiKey: string,
): Promise<LiveGameStatus> {
  try {
    const liveGameResponse = await fetch(
      `https://${accountConfig.platform.toLowerCase()}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(
        puuid,
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
  const regionalRoute = PLATFORM_TO_REGION[accountConfig.platform];

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

  const leagueResponse = await fetch(
    `https://${accountConfig.platform.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${riotAccount.puuid}`,
    {
      headers: createRiotHeaders(apiKey),
      cache: "no-store",
    },
  );

  if (!leagueResponse.ok) {
    return {
      profile: {
        ...accountConfig,
        summonerLevel: summoner.summonerLevel,
        profileIconId: summoner.profileIconId,
      },
      error: `Ranked lookup failed (${leagueResponse.status}).`,
      primaryQueue: null,
      soloQueue: null,
      flexQueue: null,
      liveGame: { status: "unknown", error: `Ranked lookup failed (${leagueResponse.status}).` },
      links: dpmLinks,
    };
  }

  const entries = (await leagueResponse.json()) as RiotLeagueEntry[];
  const soloQueue = entries.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
  const flexQueue = entries.find((entry) => entry.queueType === "RANKED_FLEX_SR");
  const primaryQueue = soloQueue ?? flexQueue ?? null;
  const liveGame = await fetchLiveGame(accountConfig, riotAccount.puuid, apiKey);

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
  const accounts = parseAccounts(process.env.LOL_ACCOUNTS);

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

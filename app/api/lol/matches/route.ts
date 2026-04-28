import { NextResponse } from "next/server";
import {
  createRiotHeaders,
  getDpmLinks,
  getDpmUrl,
  getOpggUrl,
  getRegionalRoute,
  parseLolAccounts,
  type LolAccountConfig,
} from "@/lib/lol";

export const dynamic = "force-dynamic";

const MATCH_COUNT = 8;
const MAX_MATCH_COUNT = 10;
const ACCOUNT_CACHE_TTL_MS = 2 * 60 * 1000;

type RiotAccount = {
  puuid: string;
};

type RiotMatchParticipant = {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  summonerName?: string;
  teamId: number;
  championName: string;
  champLevel: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  damageSelfMitigated: number;
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  detectorWardsPlaced: number;
  visionWardsBoughtInGame: number;
  totalHeal: number;
  timeCCingOthers: number;
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  individualPosition: string;
  teamPosition: string;
};

type RiotTeam = {
  teamId: number;
  win: boolean;
  objectives?: {
    baron?: { kills: number };
    champion?: { kills: number };
    dragon?: { kills: number };
    horde?: { kills: number };
    inhibitor?: { kills: number };
    riftHerald?: { kills: number };
    tower?: { kills: number };
  };
};

type RiotMatch = {
  metadata: {
    matchId: string;
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp?: number;
    gameMode: string;
    queueId: number;
    participants: RiotMatchParticipant[];
    teams?: RiotTeam[];
  };
};

type MatchSummary = {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKda: number;
  avgCsPerMinute: number;
  avgDamage: number;
  avgVision: number;
  favoriteChampion: string | null;
  mainPosition: string | null;
};

type AccountMatchesResult = {
  profile: LolAccountConfig;
  error: string | null;
  links: ReturnType<typeof getDpmLinks> & {
    opgg: string;
  };
  summary: MatchSummary;
  matches: NonNullable<ReturnType<typeof normalizeMatch>>[];
  pagination: {
    start: number;
    count: number;
    nextStart: number;
    hasMore: boolean;
  };
};

const accountCache = new Map<
  string,
  {
    expiresAt: number;
    data: AccountMatchesResult;
  }
>();

function getAccountCacheKey(accountConfig: LolAccountConfig, start: number, count: number) {
  return `${accountConfig.platform}:${accountConfig.gameName}:${accountConfig.tagLine}:${start}:${count}`;
}

function getQueueName(queueId: number) {
  const queues: Record<number, string> = {
    400: "Draft",
    420: "Solo/Duo",
    430: "Blind",
    440: "Flex",
    450: "ARAM",
    700: "Clash",
    900: "URF",
    1020: "One for All",
    1700: "Arena",
  };

  return queues[queueId] ?? `Queue ${queueId}`;
}

function getPositionName(participant: RiotMatchParticipant, queueId: number) {
  if (queueId === 1700) {
    return "Arena";
  }

  const position = participant.teamPosition || participant.individualPosition;
  const positions: Record<string, string> = {
    TOP: "Top",
    JUNGLE: "Jungle",
    MIDDLE: "Mid",
    BOTTOM: "Bot",
    UTILITY: "Support",
  };

  return positions[position] ?? (position && position !== "Invalid" ? position : "Fill");
}

function getChampionIconUrl(championName: string) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${encodeURIComponent(
    championName,
  )}_0.jpg`;
}

function getRiotId(participant: RiotMatchParticipant) {
  if (participant.riotIdGameName && participant.riotIdTagline) {
    return `${participant.riotIdGameName}#${participant.riotIdTagline}`;
  }

  return participant.summonerName || "Ukryty gracz";
}

function getParticipantDpmUrl(participant: RiotMatchParticipant) {
  if (!participant.riotIdGameName || !participant.riotIdTagline) {
    return null;
  }

  return getDpmUrl(participant.riotIdGameName, participant.riotIdTagline);
}

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function getKda(participant: RiotMatchParticipant) {
  return round((participant.kills + participant.assists) / Math.max(participant.deaths, 1), 2);
}

function getLargestMultiKill(participant: RiotMatchParticipant) {
  if (participant.pentaKills > 0) return "Penta";
  if (participant.quadraKills > 0) return "Quadra";
  if (participant.tripleKills > 0) return "Triple";
  if (participant.doubleKills > 0) return "Double";
  return "Brak";
}

function getChampionMode(values: string[]) {
  if (values.length === 0) return null;

  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function normalizeMatch(match: RiotMatch, puuid: string) {
  const participant = match.info.participants.find((entry) => entry.puuid === puuid);

  if (!participant) return null;

  const durationMinutes = Math.max(match.info.gameDuration / 60, 1);
  const cs = participant.totalMinionsKilled + participant.neutralMinionsKilled;
  const currentTeamId = participant.teamId;
  const currentPosition = getPositionName(participant, match.info.queueId);
  const teamIds = Array.from(
    new Set(match.info.participants.map((entry) => entry.teamId).filter(Boolean)),
  );

  const normalizedParticipants = match.info.participants.map((entry) => {
    const participantCs = entry.totalMinionsKilled + entry.neutralMinionsKilled;

    return {
      puuid: entry.puuid,
      riotId: getRiotId(entry),
      dpmUrl: getParticipantDpmUrl(entry),
      teamId: entry.teamId,
      championName: entry.championName,
      championIconUrl: getChampionIconUrl(entry.championName),
      position: getPositionName(entry, match.info.queueId),
      kills: entry.kills,
      deaths: entry.deaths,
      assists: entry.assists,
      kda: getKda(entry),
      cs: participantCs,
      csPerMinute: round(participantCs / durationMinutes),
      damage: entry.totalDamageDealtToChampions,
      gold: entry.goldEarned,
      visionScore: entry.visionScore,
      win: entry.win,
      isCurrentPlayer: entry.puuid === puuid,
    };
  });

  const teams = teamIds.map((teamId) => {
    const teamParticipants = normalizedParticipants.filter((entry) => entry.teamId === teamId);
    const teamMeta = match.info.teams?.find((entry) => entry.teamId === teamId);

    return {
      teamId,
      name: teamId === currentTeamId ? "Twoja drużyna" : "Rywal",
      win: teamMeta?.win ?? teamParticipants.some((entry) => entry.win),
      kills: teamParticipants.reduce((sum, entry) => sum + entry.kills, 0),
      deaths: teamParticipants.reduce((sum, entry) => sum + entry.deaths, 0),
      assists: teamParticipants.reduce((sum, entry) => sum + entry.assists, 0),
      gold: teamParticipants.reduce((sum, entry) => sum + entry.gold, 0),
      damage: teamParticipants.reduce((sum, entry) => sum + entry.damage, 0),
      objectives: {
        barons: teamMeta?.objectives?.baron?.kills ?? 0,
        dragons: teamMeta?.objectives?.dragon?.kills ?? 0,
        grubs: teamMeta?.objectives?.horde?.kills ?? 0,
        heralds: teamMeta?.objectives?.riftHerald?.kills ?? 0,
        inhibitors: teamMeta?.objectives?.inhibitor?.kills ?? 0,
        towers: teamMeta?.objectives?.tower?.kills ?? 0,
      },
      participants: teamParticipants,
    };
  });

  const laneOpponent =
    currentPosition === "Arena" || currentPosition === "Fill"
      ? null
      : normalizedParticipants.find(
          (entry) => entry.teamId !== currentTeamId && entry.position === currentPosition,
        ) ?? null;

  const playerTeam = teams.find((team) => team.teamId === currentTeamId);
  const teamKills = Math.max(playerTeam?.kills ?? 0, 1);
  const teamDamage = Math.max(playerTeam?.damage ?? 0, 1);
  const teamGold = Math.max(playerTeam?.gold ?? 0, 1);

  return {
    matchId: match.metadata.matchId,
    gameCreation: match.info.gameCreation,
    gameEndTimestamp: match.info.gameEndTimestamp ?? null,
    gameDuration: match.info.gameDuration,
    gameMode: match.info.gameMode,
    queueId: match.info.queueId,
    queueName: getQueueName(match.info.queueId),
    championName: participant.championName,
    championIconUrl: getChampionIconUrl(participant.championName),
    position: currentPosition,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    kda: getKda(participant),
    cs,
    csPerMinute: round(cs / durationMinutes),
    damage: participant.totalDamageDealtToChampions,
    gold: participant.goldEarned,
    visionScore: participant.visionScore,
    win: participant.win,
    laneOpponent: laneOpponent
      ? {
          riotId: laneOpponent.riotId,
          dpmUrl: laneOpponent.dpmUrl,
          championName: laneOpponent.championName,
          championIconUrl: laneOpponent.championIconUrl,
          position: laneOpponent.position,
        }
      : null,
    details: {
      championLevel: participant.champLevel,
      killParticipation: round(((participant.kills + participant.assists) / teamKills) * 100),
      damageShare: round((participant.totalDamageDealtToChampions / teamDamage) * 100),
      goldShare: round((participant.goldEarned / teamGold) * 100),
      wardsPlaced: participant.wardsPlaced,
      wardsKilled: participant.wardsKilled,
      controlWards: participant.detectorWardsPlaced || participant.visionWardsBoughtInGame || 0,
      damageTaken: participant.totalDamageTaken,
      damageMitigated: participant.damageSelfMitigated,
      objectiveDamage: participant.damageDealtToObjectives,
      turretDamage: participant.damageDealtToTurrets,
      healing: participant.totalHeal,
      ccScore: participant.timeCCingOthers,
      largestMultiKill: getLargestMultiKill(participant),
    },
    teams,
  };
}

function summarizeMatches(matches: NonNullable<ReturnType<typeof normalizeMatch>>[]): MatchSummary {
  const games = matches.length;
  const wins = matches.filter((match) => match.win).length;
  const losses = games - wins;

  if (games === 0) {
    return {
      games: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgKda: 0,
      avgCsPerMinute: 0,
      avgDamage: 0,
      avgVision: 0,
      favoriteChampion: null,
      mainPosition: null,
    };
  }

  return {
    games,
    wins,
    losses,
    winRate: Math.round((wins / games) * 100),
    avgKda: round(matches.reduce((sum, match) => sum + match.kda, 0) / games, 2),
    avgCsPerMinute: round(matches.reduce((sum, match) => sum + match.csPerMinute, 0) / games),
    avgDamage: Math.round(matches.reduce((sum, match) => sum + match.damage, 0) / games),
    avgVision: round(matches.reduce((sum, match) => sum + match.visionScore, 0) / games),
    favoriteChampion: getChampionMode(matches.map((match) => match.championName)),
    mainPosition: getChampionMode(matches.map((match) => match.position)),
  };
}

async function fetchRiotAccount(accountConfig: LolAccountConfig, regionalRoute: string, apiKey: string) {
  const response = await fetch(
    `https://${regionalRoute.toLowerCase()}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
      accountConfig.gameName,
    )}/${encodeURIComponent(accountConfig.tagLine)}`,
    {
      headers: createRiotHeaders(apiKey),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "Riot rate limit przy pobieraniu konta (429)."
        : `Riot account lookup failed (${response.status}).`,
    );
  }

  return (await response.json()) as RiotAccount;
}

async function fetchMatchIds(
  regionalRoute: string,
  puuid: string,
  apiKey: string,
  start: number,
  count: number,
) {
  const params = new URLSearchParams({
    start: String(start),
    count: String(count),
  });

  const response = await fetch(
    `https://${regionalRoute.toLowerCase()}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(
      puuid,
    )}/ids?${params.toString()}`,
    {
      headers: createRiotHeaders(apiKey),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "Riot rate limit przy pobieraniu listy meczów (429)."
        : `Match list lookup failed (${response.status}).`,
    );
  }

  return (await response.json()) as string[];
}

async function fetchMatch(regionalRoute: string, matchId: string, apiKey: string) {
  const response = await fetch(
    `https://${regionalRoute.toLowerCase()}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(
      matchId,
    )}`,
    {
      headers: createRiotHeaders(apiKey),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "Riot rate limit przy pobieraniu szczegółów meczu (429)."
        : `Match details lookup failed (${response.status}).`,
    );
  }

  return (await response.json()) as RiotMatch;
}

async function fetchMatchesForAccount(
  accountConfig: LolAccountConfig,
  apiKey: string,
  start: number,
  count: number,
) {
  const regionalRoute = getRegionalRoute(accountConfig.platform);
  const dpm = getDpmLinks(accountConfig.gameName, accountConfig.tagLine);
  const links = {
    ...dpm,
    opgg: getOpggUrl(accountConfig),
  };

  if (!regionalRoute) {
    return {
      profile: accountConfig,
      error: `Unsupported platform ${accountConfig.platform}.`,
      links,
      summary: summarizeMatches([]),
      matches: [],
      pagination: {
        start,
        count,
        nextStart: start,
        hasMore: false,
      },
    };
  }

  try {
    const riotAccount = await fetchRiotAccount(accountConfig, regionalRoute, apiKey);
    const matchIds = await fetchMatchIds(regionalRoute, riotAccount.puuid, apiKey, start, count);
    const matchPayloads = [];

    for (const matchId of matchIds) {
      matchPayloads.push(await fetchMatch(regionalRoute, matchId, apiKey));
    }

    const matches = matchPayloads
      .map((match) => (match ? normalizeMatch(match, riotAccount.puuid) : null))
      .filter((match): match is NonNullable<ReturnType<typeof normalizeMatch>> => match !== null);

    return {
      profile: {
        ...accountConfig,
      },
      error: null,
      links,
      summary: summarizeMatches(matches),
      matches,
      pagination: {
        start,
        count,
        nextStart: start + matchIds.length,
        hasMore: matchIds.length === count,
      },
    };
  } catch (error) {
    return {
      profile: accountConfig,
      error: error instanceof Error ? error.message : "Unexpected match history error.",
      links,
      summary: summarizeMatches([]),
      matches: [],
      pagination: {
        start,
        count,
        nextStart: start,
        hasMore: false,
      },
    };
  }
}

function parseInteger(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function GET(request?: Request) {
  const apiKey = process.env.RIOT_API_KEY;
  const accounts = parseLolAccounts(process.env.LOL_ACCOUNTS);
  const url = request ? new URL(request.url) : null;
  const start = parseInteger(url?.searchParams.get("start") ?? null, 0);
  const count = Math.min(parseInteger(url?.searchParams.get("count") ?? null, MATCH_COUNT), MAX_MATCH_COUNT);
  const requestedAccountIndex = url?.searchParams.get("account");

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

  const accountResults = [];
  const selectedAccounts =
    requestedAccountIndex === null || requestedAccountIndex === undefined
      ? accounts.map((account, index) => ({ account, index }))
      : accounts
          .map((account, index) => ({ account, index }))
          .filter(({ index }) => index === Number.parseInt(requestedAccountIndex, 10));

  for (const { account, index } of selectedAccounts) {
    const cacheKey = getAccountCacheKey(account, start, count);
    const cached = accountCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      accountResults.push({
        ...cached.data,
        accountIndex: index,
      });
      continue;
    }

    const result = await fetchMatchesForAccount(account, apiKey!, start, count);

    if (!result.error) {
      accountCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + ACCOUNT_CACHE_TTL_MS,
      });
      accountResults.push({
        ...result,
        accountIndex: index,
      });
      continue;
    }

    if (cached) {
      accountResults.push({
        ...cached.data,
        error: `${result.error} Pokazuję ostatnie dostępne dane.`,
        accountIndex: index,
      });
      continue;
    }

    accountResults.push({
      ...result,
      accountIndex: index,
    });
  }

  return NextResponse.json({
    configured: true,
    accounts: accountResults,
  });
}

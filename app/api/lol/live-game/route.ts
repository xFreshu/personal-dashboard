import { NextResponse } from "next/server";
import {
  createRiotHeaders,
  getDpmLinks,
  getRegionalRoute,
  parseLolAccounts,
} from "@/lib/lol";

export const dynamic = "force-dynamic";

type RiotAccount = {
  puuid: string;
};

type RiotSummoner = {
  id: string;
};

type RiotLeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

type RiotCurrentGameParticipant = {
  teamId: number;
  championId: number;
  bot: boolean;
  summonerName: string;
  summonerId: string;
  spell1Id: number;
  spell2Id: number;
};

type RiotCurrentGame = {
  gameId: number;
  gameMode: string;
  gameType: string;
  gameStartTime: number;
  gameQueueConfigId: number;
  participants: RiotCurrentGameParticipant[];
};

type ChampionCatalogEntry = {
  id: string;
  key: string;
  name: string;
  tags: string[];
  iconUrl: string;
};

type ChampionCatalog = {
  version: string;
  byId: Record<number, ChampionCatalogEntry>;
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

type LiveRank = RankedQueue | null;

let championCatalogCache:
  | {
      expiresAt: number;
      data: ChampionCatalog;
    }
  | undefined;

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

async function getChampionCatalog() {
  if (championCatalogCache && championCatalogCache.expiresAt > Date.now()) {
    return championCatalogCache.data;
  }

  const versionsResponse = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
    cache: "no-store",
  });

  if (!versionsResponse.ok) {
    throw new Error(`Champion version lookup failed (${versionsResponse.status}).`);
  }

  const versions = (await versionsResponse.json()) as string[];
  const version = versions[0];

  const championsResponse = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
    { cache: "no-store" },
  );

  if (!championsResponse.ok) {
    throw new Error(`Champion catalog lookup failed (${championsResponse.status}).`);
  }

  const payload = (await championsResponse.json()) as {
    data: Record<
      string,
      {
        id: string;
        key: string;
        name: string;
        tags: string[];
      }
    >;
  };

  const data = {
    version,
    byId: Object.fromEntries(
      Object.values(payload.data).map((champion) => [
        Number(champion.key),
        {
          ...champion,
          iconUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.id}.png`,
        },
      ]),
    ),
  } satisfies ChampionCatalog;

  championCatalogCache = {
    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    data,
  };

  return data;
}

function rankScore(rank: LiveRank) {
  if (!rank) return -1;

  const tierScores: Record<string, number> = {
    IRON: 0,
    BRONZE: 400,
    SILVER: 800,
    GOLD: 1200,
    PLATINUM: 1600,
    EMERALD: 2000,
    DIAMOND: 2400,
    MASTER: 2800,
    GRANDMASTER: 3200,
    CHALLENGER: 3600,
  };

  const divisionScores: Record<string, number> = {
    IV: 0,
    III: 100,
    II: 200,
    I: 300,
  };

  return (tierScores[rank.tier] ?? 0) + (divisionScores[rank.rank] ?? 0) + rank.leaguePoints;
}

function rankLabel(rank: LiveRank) {
  if (!rank) return "Unranked";
  return `${rank.tier} ${rank.rank} · ${rank.leaguePoints} LP`;
}

function teamLabel(teamId: number, currentTeamId: number) {
  return teamId === currentTeamId ? "Your Team" : "Enemy Team";
}

async function fetchRankBySummonerId(platform: string, summonerId: string, apiKey: string): Promise<LiveRank> {
  try {
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
      return null;
    }

    const entries = (await response.json()) as RiotLeagueEntry[];
    const soloQueue = entries.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
    const flexQueue = entries.find((entry) => entry.queueType === "RANKED_FLEX_SR");
    return soloQueue ? normalizeQueue(soloQueue) : flexQueue ? normalizeQueue(flexQueue) : null;
  } catch {
    return null;
  }
}

function queueName(queueId: number) {
  const names: Record<number, string> = {
    400: "Draft Pick",
    420: "Solo Queue",
    430: "Blind Pick",
    440: "Flex Queue",
    450: "ARAM",
    700: "Clash",
    900: "URF",
    1700: "Arena",
  };

  return names[queueId] ?? `Queue ${queueId}`;
}

function buildComposition(tags: string[]) {
  const counts = tags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => `${count}x ${tag}`);
}

export async function GET(request: Request) {
  const apiKey = process.env.RIOT_API_KEY;
  const accounts = parseLolAccounts(process.env.LOL_ACCOUNTS);
  const url = new URL(request.url);
  const accountIndex = Number.parseInt(url.searchParams.get("account") ?? "0", 10);

  const missing = [
    !apiKey && "RIOT_API_KEY",
    accounts.length === 0 && "LOL_ACCOUNTS",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return NextResponse.json({ configured: false, missing });
  }

  const account = accounts[accountIndex] ?? accounts[0];
  if (!account) {
    return NextResponse.json({ configured: true, status: "inactive" });
  }

  const regionalRoute = getRegionalRoute(account.platform);
  if (!regionalRoute) {
    return NextResponse.json({
      configured: true,
      status: "unknown",
      error: `Unsupported platform ${account.platform}.`,
    });
  }

  try {
    const [riotAccountResponse, championCatalog] = await Promise.all([
      fetch(
        `https://${regionalRoute.toLowerCase()}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
          account.gameName,
        )}/${encodeURIComponent(account.tagLine)}`,
        {
          headers: createRiotHeaders(apiKey!),
          cache: "no-store",
        },
      ),
      getChampionCatalog(),
    ]);

    if (!riotAccountResponse.ok) {
      return NextResponse.json({
        configured: true,
        status: "unknown",
        error: `Riot account lookup failed (${riotAccountResponse.status}).`,
      });
    }

    const riotAccount = (await riotAccountResponse.json()) as RiotAccount;
    const summonerResponse = await fetch(
      `https://${account.platform.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(
        riotAccount.puuid,
      )}`,
      {
        headers: createRiotHeaders(apiKey!),
        cache: "no-store",
      },
    );

    if (!summonerResponse.ok) {
      return NextResponse.json({
        configured: true,
        status: "unknown",
        error: `Summoner lookup failed (${summonerResponse.status}).`,
      });
    }

    const summoner = (await summonerResponse.json()) as RiotSummoner;
    const liveGameResponse = await fetch(
      `https://${account.platform.toLowerCase()}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(
        summoner.id,
      )}`,
      {
        headers: createRiotHeaders(apiKey!),
        cache: "no-store",
      },
    );

    if (liveGameResponse.status === 404) {
      return NextResponse.json({
        configured: true,
        status: "inactive",
      });
    }

    if (!liveGameResponse.ok) {
      return NextResponse.json({
        configured: true,
        status: "unknown",
        error: `Live game lookup failed (${liveGameResponse.status}).`,
      });
    }

    const liveGame = (await liveGameResponse.json()) as RiotCurrentGame;
    const participantRanks = new Map<string, LiveRank>(
      await Promise.all(
        liveGame.participants.map(
          async (participant): Promise<[string, LiveRank]> => [
            participant.summonerId,
            await fetchRankBySummonerId(account.platform, participant.summonerId, apiKey!),
          ],
        ),
      ),
    );

    const currentParticipant = liveGame.participants.find(
      (participant) => participant.summonerId === summoner.id,
    );
    const currentTeamId = currentParticipant?.teamId ?? liveGame.participants[0]?.teamId ?? 100;

    const participants = liveGame.participants.map((participant) => {
      const champion = championCatalog.byId[participant.championId];
      const rank: LiveRank = participantRanks.get(participant.summonerId) ?? null;

      return {
        summonerId: participant.summonerId,
        summonerName: participant.summonerName,
        championId: participant.championId,
        championName: champion?.name ?? `Champion ${participant.championId}`,
        championIconUrl:
          champion?.iconUrl ??
          `https://ddragon.leagueoflegends.com/cdn/${championCatalog.version}/img/ui/champion.png`,
        championTags: champion?.tags ?? [],
        spell1Id: participant.spell1Id,
        spell2Id: participant.spell2Id,
        teamId: participant.teamId,
        bot: participant.bot,
        isCurrentPlayer: participant.summonerId === summoner.id,
        rank,
        rankLabel: rankLabel(rank),
        rankScore: rankScore(rank),
      };
    });

    const teams = Array.from(new Set(participants.map((participant) => participant.teamId))).map((teamId) => {
      const teamParticipants = participants
        .filter((participant) => participant.teamId === teamId)
        .sort((a, b) => Number(b.isCurrentPlayer) - Number(a.isCurrentPlayer) || b.rankScore - a.rankScore);

      const rankedParticipants = teamParticipants.filter((participant) => participant.rank);
      const tags = teamParticipants.flatMap((participant) => participant.championTags);

      return {
        teamId,
        label: teamLabel(teamId, currentTeamId),
        participants: teamParticipants,
        analysis: {
          highestRank:
            [...teamParticipants]
              .sort((a, b) => b.rankScore - a.rankScore)
              .find((participant) => participant.rank)?.rankLabel ?? "No ranked data",
          knownRanks: rankedParticipants.length,
          unrankedCount: teamParticipants.length - rankedParticipants.length,
          frontlineCount: teamParticipants.filter((participant) =>
            participant.championTags.some((tag) => tag === "Tank" || tag === "Fighter"),
          ).length,
          backlineCount: teamParticipants.filter((participant) =>
            participant.championTags.some((tag) => tag === "Mage" || tag === "Marksman"),
          ).length,
          composition: buildComposition(tags),
        },
      };
    });

    return NextResponse.json({
      configured: true,
      status: "active",
      gameId: liveGame.gameId,
      gameMode: liveGame.gameMode,
      gameType: liveGame.gameType,
      gameStartTime: liveGame.gameStartTime,
      queueId: liveGame.gameQueueConfigId,
      queueName: queueName(liveGame.gameQueueConfigId),
      participantCount: liveGame.participants.length,
      links: getDpmLinks(account.gameName, account.tagLine),
      teams,
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      status: "unknown",
      error: error instanceof Error ? error.message : "Unexpected live scouting error.",
    });
  }
}

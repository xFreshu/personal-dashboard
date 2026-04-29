import { NextResponse } from "next/server";
import { createRiotHeaders, normalizePlatform } from "@/lib/lol";

export const dynamic = "force-dynamic";

type RiotLeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
};

type PlayerRank =
  | {
      queueType: string;
      tier: string;
      rank: string;
      leaguePoints: number;
    }
  | null
  | {
      error: string;
    };

type PlayerRankRequest = {
  platform?: string;
  participants?: Array<{
    puuid?: string;
  }>;
};

function getPrimaryRank(entries: RiotLeagueEntry[]) {
  const soloQueue = entries.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
  const flexQueue = entries.find((entry) => entry.queueType === "RANKED_FLEX_SR");
  const primaryQueue = soloQueue ?? flexQueue ?? null;

  if (!primaryQueue) {
    return null;
  }

  return {
    queueType: primaryQueue.queueType,
    tier: primaryQueue.tier,
    rank: primaryQueue.rank,
    leaguePoints: primaryQueue.leaguePoints,
  } satisfies Exclude<PlayerRank, null | { error: string }>;
}

async function fetchRankForPuuid(platform: string, puuid: string, apiKey: string) {
  try {
    const rankByPuuidResponse = await fetch(
      `https://${platform.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(
        puuid,
      )}`,
      {
        headers: createRiotHeaders(apiKey),
        cache: "no-store",
      },
    );

    if (rankByPuuidResponse.ok) {
      const entries = (await rankByPuuidResponse.json()) as RiotLeagueEntry[];
      return [puuid, getPrimaryRank(entries)] as const;
    }

    const summonerResponse = await fetch(
      `https://${platform.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(
        puuid,
      )}`,
      {
        headers: createRiotHeaders(apiKey),
        cache: "no-store",
      },
    );

    if (!summonerResponse.ok) {
      return [puuid, { error: `Rank unavailable (${rankByPuuidResponse.status}).` }] as const;
    }

    const summoner = (await summonerResponse.json()) as { id: string };
    const rankResponse = await fetch(
      `https://${platform.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(
        summoner.id,
      )}`,
      {
        headers: createRiotHeaders(apiKey),
        cache: "no-store",
      },
    );

    if (!rankResponse.ok) {
      return [puuid, { error: `Rank unavailable (${rankResponse.status}).` }] as const;
    }

    const entries = (await rankResponse.json()) as RiotLeagueEntry[];
    return [puuid, getPrimaryRank(entries)] as const;
  } catch {
    return [puuid, { error: "Rank unavailable" }] as const;
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.RIOT_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        configured: false,
        missing: ["RIOT_API_KEY"],
      },
      { status: 400 },
    );
  }

  const body = (await request.json()) as PlayerRankRequest;
  const platform = body.platform ? normalizePlatform(body.platform) : null;
  const puuids = Array.from(
    new Set(
      (body.participants ?? [])
        .map((participant) => participant.puuid?.trim())
        .filter((puuid): puuid is string => Boolean(puuid)),
    ),
  ).slice(0, 10);

  if (!platform || puuids.length === 0) {
    return NextResponse.json(
      {
        error: "Brak wymaganych danych do pobrania rang.",
      },
      { status: 400 },
    );
  }

  const ranks = Object.fromEntries(await Promise.all(puuids.map((puuid) => fetchRankForPuuid(platform, puuid, apiKey))));

  return NextResponse.json({
    configured: true,
    ranks,
  });
}

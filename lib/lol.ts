export type LolAccountConfig = {
  gameName: string;
  tagLine: string;
  platform: string;
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

const PLATFORM_TO_OPGG_REGION: Record<string, string> = {
  BR1: "br",
  EUN1: "eune",
  EUW1: "euw",
  JP1: "jp",
  KR: "kr",
  LA1: "lan",
  LA2: "las",
  NA1: "na",
  OC1: "oce",
  RU: "ru",
  TR1: "tr",
};

export function createRiotHeaders(apiKey: string) {
  return {
    "X-Riot-Token": apiKey,
  };
}

export function normalizePlatform(value: string) {
  const normalized = value.trim().toUpperCase();
  return PLATFORM_ALIASES[normalized] ?? normalized;
}

export function getRegionalRoute(platform: string) {
  return PLATFORM_TO_REGION[platform] ?? null;
}

export function getDpmUrl(gameName: string, tagLine: string) {
  return `https://dpm.lol/${encodeURIComponent(`${gameName}-${tagLine}`)}`;
}

export function getDpmLinks(gameName: string, tagLine: string) {
  const overview = getDpmUrl(gameName, tagLine);

  return {
    overview,
    champions: `${overview}/champions`,
    live: `${overview}/live`,
  };
}

export function getOpggUrl(account: LolAccountConfig) {
  const region = PLATFORM_TO_OPGG_REGION[account.platform] ?? account.platform.toLowerCase();

  return `https://op.gg/lol/summoners/${region}/${encodeURIComponent(
    `${account.gameName}-${account.tagLine}`,
  )}`;
}

export function parseLolAccounts(input: string | undefined) {
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

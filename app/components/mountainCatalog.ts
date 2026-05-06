export type MountainDifficulty = "lekka" | "srednia" | "trudna";

export type MountainPeak = {
  id: string;
  name: string;
  elevation: number;
  crown: boolean;
  note: string;
};

export type MountainRoute = {
  id: string;
  name: string;
  distanceKm?: number;
  time: string;
  difficulty: MountainDifficulty;
  highlights: string[];
};

export type MountainRange = {
  id: string;
  name: string;
  area: string;
  character: string;
  highestPeak: string;
  peaks: MountainPeak[];
  routes: MountainRoute[];
};

export type MountainRegion = {
  id: string;
  name: string;
  description: string;
  accent: string;
  ranges: MountainRange[];
};

export const mountainRegions: MountainRegion[] = [
  {
    id: "karpaty",
    name: "Karpaty",
    description: "Tatry, Pieniny i Beskidy: najwyzsze cele, dlugie grzbiety i najwiekszy kawalek Korony Gór Polski.",
    accent: "from-emerald-500 to-cyan-400",
    ranges: [
      {
        id: "tatry",
        name: "Tatry",
        area: "Podhale",
        character: "alpejskie granie, stawy i ekspozycja",
        highestPeak: "Rysy",
        peaks: [
          { id: "rysy", name: "Rysy", elevation: 2499, crown: true, note: "najwyzszy punkt Polski" },
          { id: "kozi-wierch", name: "Kozi Wierch", elevation: 2291, crown: false, note: "najwyzszy w calosci w Polsce" },
          { id: "kasprowy-wierch", name: "Kasprowy Wierch", elevation: 1987, crown: false, note: "klasyk z Kuźnic" },
          { id: "giewont", name: "Giewont", elevation: 1894, crown: false, note: "symbol Zakopanego" },
        ],
        routes: [
          {
            id: "tatry-rysy",
            name: "Palenica - Morskie Oko - Czarny Staw - Rysy",
            distanceKm: 24.5,
            time: "10-12 h",
            difficulty: "trudna",
            highlights: ["Morskie Oko", "Czarny Staw", "wysokogorski final"],
          },
          {
            id: "tatry-czerwone-wierchy",
            name: "Czerwone Wierchy z Koscieliska",
            distanceKm: 19.5,
            time: "7-9 h",
            difficulty: "trudna",
            highlights: ["Ciemniak", "Krzesanica", "panorama Tatr"],
          },
        ],
      },
      {
        id: "beskid-zywiecki",
        name: "Beskid Zywiecki",
        area: "Zywiecczyzna i Orawa",
        character: "dlugie podejscia, polany i widokowe grzbiety",
        highestPeak: "Babia Gora",
        peaks: [
          { id: "babia-gora", name: "Babia Gora", elevation: 1725, crown: true, note: "Diablak, krolowa Beskidow" },
          { id: "pilsko", name: "Pilsko", elevation: 1557, crown: false, note: "szeroka panorama na Tatry" },
          { id: "romanka", name: "Romanka", elevation: 1366, crown: false, note: "mocny beskidzki las" },
        ],
        routes: [
          {
            id: "zywiecki-babia",
            name: "Krowiarki - Sokolica - Babia Gora - Markowe Szczawiny",
            distanceKm: 13.8,
            time: "5-7 h",
            difficulty: "trudna",
            highlights: ["Perć Akademikow", "Sokolica", "schronisko"],
          },
          {
            id: "zywiecki-pilsko",
            name: "Korbielow - Hala Miziowa - Pilsko",
            distanceKm: 14.2,
            time: "5-6 h",
            difficulty: "srednia",
            highlights: ["Hala Miziowa", "grzbiet graniczny", "Tatry w oddali"],
          },
        ],
      },
      {
        id: "beskid-slaski",
        name: "Beskid Slaski",
        area: "Wisla, Szczyrk, Ustron",
        character: "gesta siec szlakow i szybkie wypady z miast",
        highestPeak: "Skrzyczne",
        peaks: [
          { id: "skrzyczne", name: "Skrzyczne", elevation: 1257, crown: true, note: "najwyzszy szczyt pasma" },
          { id: "barania-gora", name: "Barania Gora", elevation: 1220, crown: false, note: "zrodla Wisly" },
          { id: "czantoria-wielka", name: "Czantoria Wielka", elevation: 995, crown: false, note: "grzbiet nad Ustroniem" },
        ],
        routes: [
          {
            id: "slaski-skrzyczne",
            name: "Szczyrk - Skrzyczne - Malinowska Skala",
            distanceKm: 15.5,
            time: "5-7 h",
            difficulty: "srednia",
            highlights: ["Skrzyczne", "Malinowska Skala", "widokowy grzbiet"],
          },
          {
            id: "slaski-barania",
            name: "Wisla Czarne - Barania Gora - Wodospad Rodla",
            distanceKm: 17.2,
            time: "6-7 h",
            difficulty: "srednia",
            highlights: ["zrodla Wisly", "wieza widokowa", "Wodospad Rodla"],
          },
        ],
      },
      {
        id: "beskid-maly",
        name: "Beskid Maly",
        area: "Andrychow, Zywiec, Bielsko-Biala",
        character: "nizsze, zwarte pasmo dobre na szybki dzien",
        highestPeak: "Czupel",
        peaks: [
          { id: "czupel", name: "Czupel", elevation: 933, crown: true, note: "Korona Gór Polski" },
          { id: "lamana-skala", name: "Lamana Skala", elevation: 929, crown: false, note: "Madohora" },
        ],
        routes: [
          {
            id: "maly-czupel",
            name: "Międzybrodzie Bialskie - Czupel - Magurka Wilkowicka",
            distanceKm: 11.6,
            time: "4-5 h",
            difficulty: "srednia",
            highlights: ["Czupel", "Magurka", "Jezioro Miedzybrodzkie"],
          },
        ],
      },
      {
        id: "beskid-makowski",
        name: "Beskid Makowski",
        area: "Myslenice i okolice",
        character: "lagodne grzbiety i lesne przejscia",
        highestPeak: "Lubomir",
        peaks: [
          { id: "lubomir", name: "Lubomir", elevation: 904, crown: true, note: "obserwatorium astronomiczne" },
          { id: "lysa-gora-makowski", name: "Lysa Gora", elevation: 700, crown: false, note: "lokalny klasyk" },
        ],
        routes: [
          {
            id: "makowski-lubomir",
            name: "Przełęcz Jaworzyce - Lubomir - Kudłacze",
            distanceKm: 9.8,
            time: "3-4 h",
            difficulty: "lekka",
            highlights: ["Lubomir", "obserwatorium", "Kudlacze"],
          },
        ],
      },
      {
        id: "beskid-wyspowy",
        name: "Beskid Wyspowy",
        area: "Limanowa i Mszana Dolna",
        character: "samotne wyspy szczytow i strome podejscia",
        highestPeak: "Mogielica",
        peaks: [
          { id: "mogielica", name: "Mogielica", elevation: 1171, crown: true, note: "wieza i polany" },
          { id: "cwilin", name: "Cwilin", elevation: 1072, crown: false, note: "duza widokowa polana" },
        ],
        routes: [
          {
            id: "wyspowy-mogielica",
            name: "Przełęcz Rydza-Smiglego - Mogielica - Jurkow",
            distanceKm: 13.4,
            time: "5-6 h",
            difficulty: "srednia",
            highlights: ["Mogielica", "Polana Stumorgowa", "widok na Tatry"],
          },
        ],
      },
      {
        id: "gorce",
        name: "Gorce",
        area: "Nowy Targ i Rabka",
        character: "polany, schroniska i szerokie widoki",
        highestPeak: "Turbacz",
        peaks: [
          { id: "turbacz", name: "Turbacz", elevation: 1310, crown: true, note: "centralny punkt Gorcow" },
          { id: "luban", name: "Luban", elevation: 1211, crown: false, note: "wieza nad Dunajcem" },
        ],
        routes: [
          {
            id: "gorce-turbacz",
            name: "Nowy Targ Kowaniec - Turbacz - Bukowina Waksmundzka",
            distanceKm: 17.8,
            time: "6-7 h",
            difficulty: "srednia",
            highlights: ["Turbacz", "schronisko", "Tatry z polan"],
          },
        ],
      },
      {
        id: "beskid-sadecki",
        name: "Beskid Sadecki",
        area: "Piwniczna, Krynica, Szczawnica",
        character: "dlugie lesne grzbiety i uzdrowiska",
        highestPeak: "Radziejowa",
        peaks: [
          { id: "radziejowa", name: "Radziejowa", elevation: 1266, crown: true, note: "wieza widokowa" },
          { id: "jaworzyna-krynicka", name: "Jaworzyna Krynicka", elevation: 1114, crown: false, note: "pasmo krynickie" },
        ],
        routes: [
          {
            id: "sadecki-radziejowa",
            name: "Przehyba - Radziejowa - Wielki Rogacz",
            distanceKm: 16.1,
            time: "5-6 h",
            difficulty: "srednia",
            highlights: ["Przehyba", "Radziejowa", "Wielki Rogacz"],
          },
        ],
      },
      {
        id: "beskid-niski",
        name: "Beskid Niski",
        area: "Lemkowszczyzna",
        character: "dzikie doliny, cerkwie i spokojne grzbiety",
        highestPeak: "Lackowa",
        peaks: [
          { id: "lackowa", name: "Lackowa", elevation: 997, crown: true, note: "sciana placzu od Izb" },
          { id: "magura-watkowska", name: "Magura Watkowska", elevation: 846, crown: false, note: "Magurski Park Narodowy" },
        ],
        routes: [
          {
            id: "niski-lackowa",
            name: "Izby - Lackowa - Ostry Wierch",
            distanceKm: 13.2,
            time: "5-6 h",
            difficulty: "trudna",
            highlights: ["Lackowa", "grzbiet graniczny", "Beskid Niski bez tlumu"],
          },
        ],
      },
      {
        id: "pieniny",
        name: "Pieniny",
        area: "Szczawnica i Krościenko",
        character: "wapienne skaly, przelom Dunajca i krotkie perly",
        highestPeak: "Wysoka",
        peaks: [
          { id: "wysoka", name: "Wysoka", elevation: 1050, crown: true, note: "Wysokie Skalki" },
          { id: "trzy-korony", name: "Trzy Korony", elevation: 982, crown: false, note: "ikona Pienin" },
          { id: "sokolica", name: "Sokolica", elevation: 747, crown: false, note: "widok na Dunajec" },
        ],
        routes: [
          {
            id: "pieniny-sokolica-trzy-korony",
            name: "Szczawnica - Sokolica - Trzy Korony - Kroscienko",
            distanceKm: 15.8,
            time: "6-7 h",
            difficulty: "srednia",
            highlights: ["Sokolica", "Trzy Korony", "Dunajec"],
          },
        ],
      },
      {
        id: "bieszczady",
        name: "Bieszczady",
        area: "Ustrzyki Gorne i Wetlina",
        character: "poloniny, przestrzen i dlugie widoki",
        highestPeak: "Tarnica",
        peaks: [
          { id: "tarnica", name: "Tarnica", elevation: 1346, crown: true, note: "najwyzszy szczyt Bieszczadow" },
          { id: "halicz", name: "Halicz", elevation: 1333, crown: false, note: "czesc petli przez Rozsypaniec" },
          { id: "polonina-wetlinska", name: "Polonina Wetlinska", elevation: 1255, crown: false, note: "Chatka Puchatka II" },
        ],
        routes: [
          {
            id: "bieszczady-tarnica",
            name: "Wolosate - Tarnica - Halicz - Rozsypaniec",
            distanceKm: 20.6,
            time: "7-9 h",
            difficulty: "trudna",
            highlights: ["Tarnica", "Halicz", "Rozsypaniec"],
          },
          {
            id: "bieszczady-wetlinska",
            name: "Przełęcz Wyzna - Polonina Wetlinska - Wetlina",
            distanceKm: 12.4,
            time: "4-5 h",
            difficulty: "srednia",
            highlights: ["Chatka Puchatka", "Smerek", "poloniny"],
          },
        ],
      },
    ],
  },
  {
    id: "sudety",
    name: "Sudety",
    description: "Karkonosze, Kotliny Klodzkie i mozaika nizszych pasm: duzo wiez, schronisk i kompaktowych petli.",
    accent: "from-sky-500 to-violet-400",
    ranges: [
      {
        id: "karkonosze",
        name: "Karkonosze",
        area: "Karpacz i Szklarska Poreba",
        character: "grzbietowe wedrowki, kotly i wysokie schroniska",
        highestPeak: "Sniezka",
        peaks: [
          { id: "sniezka", name: "Sniezka", elevation: 1603, crown: true, note: "najwyzszy szczyt Sudetow" },
          { id: "szrenica", name: "Szrenica", elevation: 1362, crown: false, note: "nad Szklarska Poreba" },
        ],
        routes: [
          {
            id: "karkonosze-sniezka",
            name: "Karpacz - Samotnia - Sniezka - Dom Slaski",
            distanceKm: 17.7,
            time: "6-8 h",
            difficulty: "trudna",
            highlights: ["Samotnia", "Sniezka", "Kociol Malego Stawu"],
          },
        ],
      },
      {
        id: "gory-izerskie",
        name: "Gory Izerskie",
        area: "Jakuszyce i Swieradow-Zdroj",
        character: "szerokie trakty, hale i torfowiska",
        highestPeak: "Wysoka Kopa",
        peaks: [
          { id: "wysoka-kopa", name: "Wysoka Kopa", elevation: 1126, crown: true, note: "Korona Gór Polski" },
          { id: "stog-izerski", name: "Stog Izerski", elevation: 1107, crown: false, note: "nad Swieradowem" },
        ],
        routes: [
          {
            id: "izerskie-wysoka-kopa",
            name: "Rozdroze Izerskie - Wysoka Kopa - Wysoki Kamien",
            distanceKm: 17.9,
            time: "5-6 h",
            difficulty: "srednia",
            highlights: ["Wysoka Kopa", "Wysoki Kamien", "Hala Izerska"],
          },
        ],
      },
      {
        id: "gory-stolowe",
        name: "Gory Stolowe",
        area: "Karlow i Kudowa-Zdroj",
        character: "labirynty skalne i plaskie wierzchowiny",
        highestPeak: "Szczeliniec Wielki",
        peaks: [
          { id: "szczeliniec-wielki", name: "Szczeliniec Wielki", elevation: 919, crown: true, note: "najwyzszy szczyt Gór Stolowych" },
          { id: "skalne-grzyby", name: "Skalne Grzyby", elevation: 680, crown: false, note: "formacje skalne" },
        ],
        routes: [
          {
            id: "stolowe-szczeliniec",
            name: "Karlow - Szczeliniec Wielki - Bledne Skaly",
            distanceKm: 14.6,
            time: "5-6 h",
            difficulty: "srednia",
            highlights: ["Szczeliniec", "Bledne Skaly", "skalne labirynty"],
          },
        ],
      },
      {
        id: "gory-sowie",
        name: "Gory Sowie",
        area: "Rzeczka i Walim",
        character: "lesne grzbiety, wieze i historia",
        highestPeak: "Wielka Sowa",
        peaks: [
          { id: "wielka-sowa", name: "Wielka Sowa", elevation: 1015, crown: true, note: "wieza widokowa" },
        ],
        routes: [
          {
            id: "sowie-wielka-sowa",
            name: "Przełęcz Sokola - Wielka Sowa - Kozie Siodlo",
            distanceKm: 9.7,
            time: "3-4 h",
            difficulty: "lekka",
            highlights: ["Wielka Sowa", "wieza", "schronisko Orzel"],
          },
        ],
      },
      {
        id: "gory-walbrzyskie",
        name: "Gory Walbrzyskie",
        area: "Walbrzych",
        character: "miejskie gory ze stromymi podejsciami",
        highestPeak: "Chelmiec",
        peaks: [
          { id: "chelmiec", name: "Chelmiec", elevation: 850, crown: true, note: "tradycyjny szczyt KGP" },
          { id: "borowa", name: "Borowa", elevation: 853, crown: false, note: "rzeczywiscie najwyzsza w pasmie" },
        ],
        routes: [
          {
            id: "walbrzyskie-borowa-chelmiec",
            name: "Walbrzych - Borowa - Chelmiec",
            distanceKm: 18.2,
            time: "6-7 h",
            difficulty: "trudna",
            highlights: ["Borowa", "Chelmiec", "strome podejscia"],
          },
        ],
      },
      {
        id: "gory-kamienne",
        name: "Gory Kamienne",
        area: "Sucha i Andrzejowka",
        character: "ostre, wulkaniczne garby i krotkie mocne trasy",
        highestPeak: "Waligora",
        peaks: [
          { id: "waligora", name: "Waligora", elevation: 936, crown: true, note: "strome podejscie spod Andrzejowki" },
        ],
        routes: [
          {
            id: "kamienne-waligora",
            name: "Andrzejowka - Waligora - Suchawa",
            distanceKm: 10.8,
            time: "4-5 h",
            difficulty: "srednia",
            highlights: ["Waligora", "Andrzejowka", "Suchawa"],
          },
        ],
      },
      {
        id: "gory-kaczawskie",
        name: "Gory Kaczawskie",
        area: "Wojcieszow i Kaczorow",
        character: "nizsze pasmo z wapieniami i wygaslymi wulkanami",
        highestPeak: "Skopiec",
        peaks: [
          { id: "skopiec", name: "Skopiec", elevation: 724, crown: true, note: "Korona Gór Polski" },
          { id: "okole", name: "Okole", elevation: 725, crown: false, note: "widokowa wieza" },
        ],
        routes: [
          {
            id: "kaczawskie-skopiec",
            name: "Komarno - Skopiec - Baraniec",
            distanceKm: 8.4,
            time: "3 h",
            difficulty: "lekka",
            highlights: ["Skopiec", "Baraniec", "spokojne grzbiety"],
          },
        ],
      },
      {
        id: "rudawy-janowickie",
        name: "Rudawy Janowickie",
        area: "Janowice Wielkie",
        character: "skaly, zamki i bliskie widoki na Karkonosze",
        highestPeak: "Skalnik",
        peaks: [
          { id: "skalnik", name: "Skalnik", elevation: 945, crown: true, note: "Ostra Mala jako punkt widokowy" },
          { id: "sokolik", name: "Sokolik", elevation: 642, crown: false, note: "Sokoliki" },
        ],
        routes: [
          {
            id: "rudawy-skalnik",
            name: "Przełęcz pod Srednica - Skalnik - Ostra Mala",
            distanceKm: 9.3,
            time: "3-4 h",
            difficulty: "lekka",
            highlights: ["Skalnik", "Ostra Mala", "widok na Karkonosze"],
          },
        ],
      },
      {
        id: "masyw-snieznika",
        name: "Masyw Snieznika",
        area: "Międzygorze i Kletno",
        character: "wysoki sudecki masyw i dlugie lesne podejscia",
        highestPeak: "Snieznik",
        peaks: [
          { id: "snieznik", name: "Snieznik", elevation: 1425, crown: true, note: "wieza i szeroki grzbiet" },
        ],
        routes: [
          {
            id: "snieznik-miedzygorze",
            name: "Międzygorze - Schronisko pod Snieznikiem - Snieznik",
            distanceKm: 15.1,
            time: "5-6 h",
            difficulty: "srednia",
            highlights: ["Snieznik", "schronisko", "Wodospad Wilczki"],
          },
        ],
      },
      {
        id: "gory-bialskie",
        name: "Gory Bialskie",
        area: "Stronie Slaskie",
        character: "ciche lasy i dzikie graniczne grzbiety",
        highestPeak: "Rudawiec",
        peaks: [
          { id: "rudawiec", name: "Rudawiec", elevation: 1112, crown: true, note: "Korona Gór Polski" },
        ],
        routes: [
          {
            id: "bialskie-rudawiec",
            name: "Bielice - Rudawiec - Iwinka",
            distanceKm: 15.6,
            time: "5-6 h",
            difficulty: "srednia",
            highlights: ["Rudawiec", "Bielice", "dzikie lasy"],
          },
        ],
      },
      {
        id: "gory-zlote",
        name: "Gory Zlote",
        area: "Ladek-Zdroj",
        character: "graniczne przejscia i uzdrowiskowe zaplecze",
        highestPeak: "Kowadlo",
        peaks: [
          { id: "kowadlo", name: "Kowadlo", elevation: 989, crown: true, note: "Korona Gór Polski" },
        ],
        routes: [
          {
            id: "zlote-kowadlo",
            name: "Bielice - Kowadlo - Przełęcz Trzech Granic",
            distanceKm: 11.2,
            time: "4 h",
            difficulty: "srednia",
            highlights: ["Kowadlo", "grzbiet graniczny", "Bielice"],
          },
        ],
      },
      {
        id: "gory-bystrzyckie",
        name: "Gory Bystrzyckie",
        area: "Spalona i Bystrzyca Klodzka",
        character: "lagodne grzbiety i trasy na dluzsze spacery",
        highestPeak: "Jagodna",
        peaks: [
          { id: "jagodna", name: "Jagodna", elevation: 977, crown: true, note: "wieza widokowa" },
        ],
        routes: [
          {
            id: "bystrzyckie-jagodna",
            name: "Spalona - Jagodna - Schronisko Jagodna",
            distanceKm: 9.6,
            time: "3 h",
            difficulty: "lekka",
            highlights: ["Jagodna", "wieza", "schronisko"],
          },
        ],
      },
      {
        id: "gory-orlickie",
        name: "Gory Orlickie",
        area: "Duszniki-Zdroj i Zieleniec",
        character: "graniczne wierzchowiny i szybkie wyjscia",
        highestPeak: "Orlica",
        peaks: [
          { id: "orlica", name: "Orlica", elevation: 1084, crown: true, note: "wieza na granicy" },
        ],
        routes: [
          {
            id: "orlickie-orlica",
            name: "Zieleniec - Orlica - Schronisko Orlica",
            distanceKm: 8.8,
            time: "3 h",
            difficulty: "lekka",
            highlights: ["Orlica", "Zieleniec", "widokowy grzbiet"],
          },
        ],
      },
      {
        id: "gory-bardzkie",
        name: "Gory Bardzkie",
        area: "Bardo i Klodzko",
        character: "nizsze pasmo nad przelomem Nysy Klodzkiej",
        highestPeak: "Klodzka Gora",
        peaks: [
          { id: "klodzka-gora", name: "Klodzka Gora", elevation: 765, crown: true, note: "wieza widokowa" },
        ],
        routes: [
          {
            id: "bardzkie-klodzka",
            name: "Przełęcz Klodzka - Klodzka Gora - Bardo",
            distanceKm: 13.7,
            time: "4-5 h",
            difficulty: "srednia",
            highlights: ["Klodzka Gora", "Bardo", "przelom Nysy"],
          },
        ],
      },
      {
        id: "gory-opawskie",
        name: "Gory Opawskie",
        area: "Glucholazy",
        character: "najdalej na wschod wysuniete Sudety",
        highestPeak: "Biskupia Kopa",
        peaks: [
          { id: "biskupia-kopa", name: "Biskupia Kopa", elevation: 889, crown: true, note: "wieza na granicy" },
        ],
        routes: [
          {
            id: "opawskie-biskupia",
            name: "Jarnołtowek - Biskupia Kopa - Gwarkowa Perc",
            distanceKm: 12.1,
            time: "4-5 h",
            difficulty: "srednia",
            highlights: ["Biskupia Kopa", "Gwarkowa Perc", "Jarnołtowek"],
          },
        ],
      },
    ],
  },
  {
    id: "swietokrzyskie-przedgorze",
    name: "Swietokrzyskie i Przedgorze",
    description: "Nizsze pasma poza glownym lukiem Karpat i Sudetow: dobre na spokojne domykanie mapy Polski.",
    accent: "from-amber-400 to-rose-400",
    ranges: [
      {
        id: "gory-swietokrzyskie",
        name: "Gory Swietokrzyskie",
        area: "Lysogory",
        character: "najstarsze gory, goloborza i lesne grzbiety",
        highestPeak: "Lysica",
        peaks: [
          { id: "lysica", name: "Lysica", elevation: 614, crown: true, note: "Korona Gór Polski" },
          { id: "lysa-gora", name: "Lysa Gora", elevation: 594, crown: false, note: "goloborza i klasztor" },
        ],
        routes: [
          {
            id: "swietokrzyskie-lysica",
            name: "Swieta Katarzyna - Lysica - Przełęcz Sw. Mikolaja",
            distanceKm: 8.6,
            time: "3 h",
            difficulty: "lekka",
            highlights: ["Lysica", "Puszcza Jodlowa", "Lysogory"],
          },
        ],
      },
      {
        id: "masyw-slezy",
        name: "Masyw Slezy",
        area: "Sobótka",
        character: "samotna gora nad Nizina Slaska",
        highestPeak: "Sleza",
        peaks: [
          { id: "sleza", name: "Sleza", elevation: 718, crown: true, note: "Korona Gór Polski" },
        ],
        routes: [
          {
            id: "sleza-sobotka",
            name: "Sobótka - Sleza - Wiezyca",
            distanceKm: 10.5,
            time: "3-4 h",
            difficulty: "lekka",
            highlights: ["Sleza", "Wiezyca", "widok na Wroclaw"],
          },
        ],
      },
    ],
  },
];

export const mountainCatalogSources = [
  {
    label: "Korona Gór Polski",
    href: "https://kgp.info.pl/",
  },
  {
    label: "Centralny Rejestr Szlakow PTTK",
    href: "https://szlaki.pttk.pl/",
  },
];

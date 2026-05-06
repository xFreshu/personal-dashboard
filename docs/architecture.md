# Architecture

## Przeglad

Aplikacja jest oparta o Next.js App Router. Strony i route handlery sa w `app/`,
komponenty UI w `app/components/`, a dostep do bazy jest izolowany przez
`lib/prisma.ts`.

```text
Browser
  -> Next.js pages in app/
  -> client/server components in app/components/
  -> route handlers in app/api/
  -> external APIs or PostgreSQL through Prisma
```

## Warstwa UI

Glowny layout korzysta z sidebara i stron:

- `/` - dashboard dzienny,
- `/learning` - roadmapy nauki,
- `/mountains` - atlas pasm, szczytow i tras w Polsce,
- `/github` - aktywnosc GitHub,
- `/codex` - status Codexa i tokeny.

Widgety powinny pozostawac samodzielne: komponent odpowiada za prezentacje,
route handler za pobranie lub przetworzenie danych, a typy powinny byc lokalne
albo wyniesione dopiero wtedy, gdy sa realnie wspoldzielone.

## API i przeplywy danych

### Habits

- `GET /api/habits?year=YYYY&month=M` pobiera wpisy z wybranego miesiaca.
- `POST /api/habits/toggle` przelacza wpis dla pary `habit + date`.
- Dane sa w PostgreSQL w tabeli `habits`.
- Model Prisma wymusza unikalnosc `habit + date`.

### Google Calendar

- NextAuth obsluguje logowanie Google i refresh access tokena.
- `GET /api/calendar` wymaga sesji z `accessToken`.
- API pobiera kilka najblizszych wydarzen z glownego kalendarza.

### GitHub

- `GET /api/github` korzysta z REST i GraphQL GitHub API.
- Token jest opcjonalny dla czesci danych, ale wymagany lub zalecany dla limitow,
  contribution calendar i prywatnych repozytoriow.
- Konfiguracja repozytoriow pochodzi ze zmiennych srodowiskowych.

### League of Legends

- `GET /api/lol/rank` korzysta z Riot API.
- `GET /api/lol/matches` korzysta z Account V1 i Match V5, pobiera match ID po
  PUUID, a nastepnie szczegoly meczow do widoku `/league`. Endpoint obsluguje
  parametry `account`, `start` i `count`, zeby UI moglo dociagac kolejne mecze
  przy scrollowaniu.
- Konta sa konfigurowane przez zmienna srodowiskowa w formacie
  `gameName|tagLine|platform`, rozdzielane srednikami.
- Route handler normalizuje platformy i dobiera regional route.
- Po pobraniu PUUID endpoint sprawdza Spectator V5:
  `/lol/spectator/v5/active-games/by-summoner/{puuid}`. Odpowiedz `404`
  oznacza normalny stan "poza gra"; inne bledy Spectatora sa zwracane jako
  status nieznany, zeby nie ukrywac danych rankingowych.
- Widget linkuje do DPM.lol przez `https://dpm.lol/{gameName}-{tagLine}` oraz
  podstrone `/live`, ktora pokazuje live game, gdy gracz jest w meczu.
- Strona `/league` dodaje linki do DPM.lol oraz OP.GG. Link OP.GG jest budowany
  w formacie `https://op.gg/lol/summoners/{region}/{gameName}-{tagLine}`.
- Ikony championow w historii meczow pochodza z Data Dragon:
  `https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/{champion}_0.jpg`.

### Codex

- `GET /api/codex/tokens` czyta lokalna baze stanu Codexa oraz status przez
  `codex app-server`.
- Route handler wymaga runtime Node.js, bo korzysta z procesow systemowych.

### Gory i szlaki

- Widok `/mountains` korzysta z kuratorowanego katalogu w
  `app/components/mountainCatalog.ts`.
- Katalog obejmuje pelna Korone Gór Polski oraz popularne polskie szczyty i
  klasyczne trasy w najwazniejszych pasmach.
- Nie ladujemy pelnego snapshotu OSM w UI, bo kilkanascie tysiecy punktow bylo
  zbyt ciezkie do codziennego odhaczania.
- Postep odwiedzin jest zapisywany w `localStorage` pod kluczem
  `mountain-progress-v1`, podobnie do lokalnego postepu roadmap nauki.
- Jesli funkcja ma zostac zsynchronizowana miedzy urzadzeniami, kolejnym krokiem
  sa modele Prisma dla odwiedzin.

## Baza danych

Prisma ma obecnie jeden model:

- `Habit` z polami `habit`, `date`, `completed`, `createdAt`.

Dodajac kolejne modele:

- aktualizuj `prisma/schema.prisma`,
- opisz cel modelu w tym pliku,
- dopisz test route handlera albo logiki, ktora korzysta z modelu.

## Zmienne srodowiskowe

Znane zmienne:

- `DATABASE_URL` - polaczenie PostgreSQL dla Prisma.
- `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET` - OAuth Google.
- `NEXTAUTH_SECRET` - sekret sesji NextAuth.
- `GITHUB_USERNAME` - uzytkownik GitHub.
- `GITHUB_TOKEN` - token GitHub, najlepiej read-only.
- `GITHUB_REPOS` albo `GITHUB_REPOSITORIES` - lista repozytoriow po przecinku.
- `RIOT_API_KEY` - klucz Riot API.
- `LOL_ACCOUNTS` - lista kont LoL rozdzielana srednikami.
- `CODEX_STATE_DB_PATH` - opcjonalna sciezka do bazy stanu Codexa.
- `CODEX_BIN_PATH` - opcjonalna sciezka do binarki Codexa.

## Testy

Projekt uzywa Vitest:

- testy stron sa w `app/__tests__/`,
- testy komponentow w `app/components/__tests__/`,
- testy API w `app/api/__tests__/`.

Pelna lokalna weryfikacja:

```bash
npm run verify
```

## Decyzje techniczne

Aktualne decyzje i ich uzasadnienia sa w [decisions.md](decisions.md).

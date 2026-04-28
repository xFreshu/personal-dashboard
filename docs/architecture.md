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
- Konta sa konfigurowane przez zmienna srodowiskowa w formacie
  `gameName|tagLine|platform`, rozdzielane srednikami.
- Route handler normalizuje platformy i dobiera regional route.
- Po pobraniu PUUID endpoint sprawdza Spectator V5:
  `/lol/spectator/v5/active-games/by-summoner/{puuid}`. Odpowiedz `404`
  oznacza normalny stan "poza gra"; inne bledy Spectatora sa zwracane jako
  status nieznany, zeby nie ukrywac danych rankingowych.
- Widget linkuje do DPM.lol przez `https://dpm.lol/{gameName}-{tagLine}` oraz
  podstrone `/live`, ktora pokazuje live game, gdy gracz jest w meczu.

### Codex

- `GET /api/codex/tokens` czyta lokalna baze stanu Codexa oraz status przez
  `codex app-server`.
- Route handler wymaga runtime Node.js, bo korzysta z procesow systemowych.

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

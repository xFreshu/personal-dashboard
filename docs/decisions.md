# Decisions

Ten plik przechowuje wazne decyzje projektowe. Nowe wpisy dodawaj od gory albo
chronologicznie w ramach sekcji, zachowujac krotkie uzasadnienie i konsekwencje.

## 2026-05-06: Atlas gorski pokazuje popularne polskie cele zamiast pelnego OSM

**Decyzja:** Widok `/mountains` korzysta z kuratorowanego katalogu TypeScript:
pelna Korona Gór Polski plus popularne polskie szczyty i klasyczne trasy.
Odwiedzone elementy sa zapisywane w `localStorage`.

**Dlaczego:** Pelny snapshot OpenStreetMap zawieral kilkanascie tysiecy
szczytow i tysiące relacji szlakowych, co bylo zbyt ciezkie do codziennego,
osobistego odhaczania. Katalog popularnych celow daje mniej szumu i lepsza
uzytecznosc.

**Konsekwencje:** Katalog nie jest pelnym rejestrem wszystkich punktow w Polsce.
Nowe popularne cele dodajemy recznie do `mountainCatalog.ts`. Synchronizacja
miedzy urzadzeniami bedzie wymagac modeli Prisma dla odwiedzin.

## 2026-04-28: Dokumentacja agents/docs jako zrodlo wiedzy

**Decyzja:** Dodajemy `AGENTS.md` oraz folder `docs/` z opisem produktu,
architektury i decyzji.

**Dlaczego:** Projekt ma byc rozwijany z pomoca agentow. Potrzebne jest miejsce,
z ktorego mozna szybko odczytac intencje, zakres i zasady pracy bez ponownego
odkrywania kontekstu z kodu.

**Konsekwencje:** Przy zmianach produktu, architektury albo waznych kompromisach
technicznych nalezy aktualizowac odpowiedni plik w `docs/`.

## 2026-04-28: Next.js App Router jako glowna struktura aplikacji

**Decyzja:** Strony i API pozostaja w strukturze `app/` Next.js App Router.

**Dlaczego:** Obecny kod jest juz tak zorganizowany, a route handlery dobrze
pasuja do widgetowego dashboardu z integracjami zewnetrznymi.

**Konsekwencje:** Nowe endpointy dodajemy jako `app/api/.../route.ts`, a nowe
widoki jako strony w `app/`.

## 2026-04-28: Prisma i PostgreSQL dla danych trwalych

**Decyzja:** Dane trwale aplikacji sa modelowane przez Prisma i przechowywane w
PostgreSQL.

**Dlaczego:** Nawyki wymagaja prostego, transakcyjnego zapisu i unikalnosci po
parze `habit + date`. Prisma daje czytelny model i typowany dostep.

**Konsekwencje:** Nie dodajemy rownoleglego sposobu zapisu danych trwalych bez
wyraznej potrzeby. Nowe modele powinny trafiac do `prisma/schema.prisma`.

## 2026-04-28: Integracje zewnetrzne przez route handlery

**Decyzja:** Integracje z GitHub, Google Calendar, Riot API i Codexem sa
ukrywane za route handlerami Next.js.

**Dlaczego:** UI nie powinien znac sekretow ani szczegolow autoryzacji. Route
handlery centralizuja obsluge bledow, cache i format odpowiedzi.

**Konsekwencje:** Komponenty powinny pobierac dane z lokalnych endpointow, a nie
bezposrednio z API zewnetrznych.

## 2026-04-28: Dashboard zamiast landing page'a

**Decyzja:** Pierwszym ekranem aplikacji jest dzialajacy dashboard.

**Dlaczego:** Produkt jest prywatnym narzedziem codziennym, a nie publiczna
strona promocyjna.

**Konsekwencje:** Nowe prace frontendowe powinny wzmacniac skanowalnosc,
ergonomie i realne przeplywy pracy zamiast dodawac sekcje marketingowe.

# Product

## Wizja

`personal-dashboard` ma byc prywatnym centrum dowodzenia: jedna aplikacja, ktora
po otwarciu pokazuje najwazniejsze informacje o dniu, postepach, narzedziach i
aktywnosciach. Produkt nie jest publicznym SaaS-em ani strona marketingowa. To
narzedzie robocze, ktore ma byc szybkie, czytelne i dopasowane do wlasciciela.

## Uzytkownicy

Glownym uzytkownikiem jest wlasciciel dashboardu. Potrzebuje:

- szybkiego przegladu dnia,
- mniej przelaczania sie miedzy uslugami,
- widoku postepow w nawykach i nauce,
- statusu swoich narzedzi programistycznych,
- wgladu w aktywnosc GitHub i zuzycie Codexa,
- okazjonalnego monitorowania kont League of Legends.

Drugorzednym "uzytkownikiem" sa agenci pracujacy nad repozytorium. Dla nich
projekt powinien byc latwy do zrozumienia, testowania i rozbudowy.

## MVP

Obecne MVP sklada sie z:

- strony glownej `/` z widgetami czasu, pogody, kalendarza, nawykow i LoL,
- strony `/league` z historia meczow LoL, forma kont i linkami do zewnetrznych
  profili,
- strony `/learning` z tablica roadmap nauki,
- strony `/mountains` z atlasem popularnych polskich szczytow i tras do
  odhaczania,
- strony `/github` z widgetem GitHub,
- strony `/codex` ze statusem konta i zuzyciem tokenow Codexa,
- sidebaru jako glownej nawigacji,
- API dla GitHuba, Google Calendar, nawykow, LoL i Codex tokenow,
- zapisu nawykow w PostgreSQL przez Prisma.

## Kierunek rozwoju

Priorytetem jest uzytecznosc codzienna, nie liczba funkcji. Nowe funkcje powinny
trafic do dashboardu tylko wtedy, gdy:

- odpowiadaja na powtarzalna potrzebe,
- daja szybki sygnal bez dlugiej konfiguracji,
- sa odporne na chwilowe problemy z API zewnetrznym,
- nie zamieniaja aplikacji w zbyt szeroki panel administracyjny.

## Zasady UX

- Pierwszy ekran ma byc realnym dashboardem, nie landing page'em.
- Informacje powinny byc skanowalne: status, liczby, daty i linki maja byc
  latwe do wychwycenia.
- Stany ladowania i bledow sa czescia produktu, szczegolnie przy integracjach
  zewnetrznych.
- UI moze miec charakter osobisty, ale nie powinien przeszkadzac w pracy.
- Polskie komunikaty sa preferowane w miejscach, ktore czyta wlasciciel.

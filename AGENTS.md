# Projekt: Internal Team Dashboard

## 1. Cel projektu
Stworzenie responsywnej aplikacji webowej pełniącej funkcję wewnętrznego dashboardu informacyjnego dla zespołu w Żorach.

## 2. Kluczowe Funkcjonalności
* **Widget Czasu:** Wyświetlanie aktualnej godziny i daty w formacie lokalnym.
* **Widget Pogodowy:** Integracja z API (np. OpenWeatherMap) dla lokalizacji: **Żory, PL**. Wyświetlanie temperatury, ikony stanu pogody oraz wilgotności.
* **Integracja Google Calendar:** Wyświetlanie listy nadchodzących wydarzeń z publicznego lub prywatnego kalendarza (wymagana autoryzacja OAuth2).
* **Interfejs:** Nowoczesny, ciemny motyw (Dark Mode), układ kafelkowy (Grid Layout).

## 3. Tech Stack (Proponowany)
* **Frontend:** Next.js
* **API:** OpenWeatherMap API, Google Calendar API.
* **Stylizacja:** Tailwind CSS dla szybkości i responsywności.

## 4. Roadmap
1. [ ] Setup struktury projektu i layoutu (Grid).
2. [ ] Implementacja zegara i statycznej sekcji pogody.
3. [ ] Fetching danych pogodowych dla Żor.
4. [ ] Konfiguracja Google Cloud Console i integracja kalendarza.
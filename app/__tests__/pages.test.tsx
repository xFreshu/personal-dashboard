import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import CodexPage from "../codex/page";
import GitHubPage from "../github/page";
import LearningPage from "../learning/page";
import RootLayout, { metadata } from "../layout";
import Home from "../page";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist-sans" }),
  Geist_Mono: () => ({ variable: "geist-mono" }),
}));

vi.mock("../components/AuthProvider", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

vi.mock("../components/Sidebar", () => ({
  default: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

vi.mock("../components/ClockWidget", () => ({
  default: () => <div>Clock widget</div>,
}));

vi.mock("../components/WeatherWidget", () => ({
  default: () => <div>Weather widget</div>,
}));

vi.mock("../components/CalendarWidget", () => ({
  default: () => <div>Calendar widget</div>,
}));

vi.mock("../components/HabitWidget", () => ({
  default: () => <div>Habit widget</div>,
}));

vi.mock("../components/LolRankWidget", () => ({
  default: () => <div>LoL widget</div>,
}));

vi.mock("../components/CodexTokensWidget", () => ({
  default: () => <div>Codex tokens widget</div>,
}));

vi.mock("../components/CodexStatusPanel", () => ({
  default: () => <div>Codex status panel</div>,
}));

vi.mock("../components/GitHubWidget", () => ({
  default: () => <div>GitHub widget</div>,
}));

vi.mock("../components/LearningRoadmapBoard", () => ({
  default: () => <div>Learning roadmap board</div>,
}));

describe("app pages and layout", () => {
  it("renders the main dashboard without Codex tokens", () => {
    render(<Home />);

    expect(screen.getByText("Clock widget")).toBeInTheDocument();
    expect(screen.getByText("Weather widget")).toBeInTheDocument();
    expect(screen.getByText("Calendar widget")).toBeInTheDocument();
    expect(screen.getByText("Habit widget")).toBeInTheDocument();
    expect(screen.getByText("LoL widget")).toBeInTheDocument();
    expect(screen.queryByText("Codex tokens widget")).not.toBeInTheDocument();
  });

  it("renders Codex page widgets", () => {
    render(<CodexPage />);

    expect(screen.getByText("Codex status panel")).toBeInTheDocument();
    expect(screen.getByText("Codex tokens widget")).toBeInTheDocument();
  });

  it("renders GitHub and learning pages", () => {
    const { rerender } = render(<GitHubPage />);

    expect(screen.getByText("GitHub widget")).toBeInTheDocument();

    rerender(<LearningPage />);
    expect(screen.getByText("Learning roadmap board")).toBeInTheDocument();
  });

  it("wraps the app with auth provider and sidebar", () => {
    render(
      <RootLayout>
        <main>Content</main>
      </RootLayout>,
    );

    expect(metadata).toMatchObject({
      title: "Internal Team Dashboard",
      description: "Wewnętrzny dashboard dla zespołu",
    });
    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});

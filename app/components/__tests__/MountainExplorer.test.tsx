import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import MountainExplorer from "../MountainExplorer";

const STORAGE_KEY = "mountain-progress-v1";

describe("MountainExplorer", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders regions, active range and Korona Gór Polski progress", () => {
    render(<MountainExplorer />);

    expect(screen.getByRole("heading", { name: "Góry i szlaki Polski" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Karpaty/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sudety/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tatry" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rysy 2499 m KGP/i })).toBeInTheDocument();
    expect(screen.getByText("0/28")).toBeInTheDocument();
  });

  it("filters ranges and switches to another mountain range", async () => {
    const user = userEvent.setup();

    render(<MountainExplorer />);

    await user.type(screen.getByPlaceholderText("Szukaj szczytu, pasma albo trasy"), "Bieszczady");
    await user.click(screen.getByRole("button", { name: /Bieszczady/i }));

    expect(screen.getByRole("heading", { name: "Bieszczady" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tarnica 1346 m KGP/i })).toBeInTheDocument();
  });

  it("persists visited peaks in localStorage", async () => {
    const user = userEvent.setup();

    render(<MountainExplorer />);

    await user.click(screen.getByRole("button", { name: /Rysy 2499 m KGP/i }));

    await waitFor(() => {
      expect(screen.getByText("1/52")).toBeInTheDocument();
      expect(screen.getByText("1/28")).toBeInTheDocument();
    });

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toMatchObject({
      "peak:rysy": true,
    });
  });

  it("can mark the whole active range as visited", async () => {
    const user = userEvent.setup();

    render(<MountainExplorer />);

    await user.click(screen.getByRole("button", { name: "Zaznacz pasmo" }));

    await waitFor(() => {
      expect(screen.getByText("4/52")).toBeInTheDocument();
      expect(screen.getByText("2/32")).toBeInTheDocument();
    });

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(stored!)).toMatchObject({
      "peak:rysy": true,
      "peak:giewont": true,
      "route:tatry-rysy": true,
    });
  });

});

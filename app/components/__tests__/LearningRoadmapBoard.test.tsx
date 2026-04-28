import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LearningRoadmapBoard from "../LearningRoadmapBoard";

const STORAGE_KEY = "learning-roadmap-progress-v1";

describe("LearningRoadmapBoard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders roadmap tracks with cloud and architecture topics", () => {
    render(<LearningRoadmapBoard />);

    expect(screen.getByRole("heading", { name: "Centrum Nauki" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /JavaScript Developer/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skad czerpac wiedze" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Core JavaScript od podstaw/i })).toHaveAttribute(
      "href",
      "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting",
    );
    expect(screen.getByRole("heading", { name: "Cloud and Hosting Basics" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Static hosting, SSR, serverless i kontenery - kiedy co wybrac/i,
      }),
    ).toBeInTheDocument();
  });

  it("persists topic progress in localStorage after marking an item as read", async () => {
    const user = userEvent.setup();

    render(<LearningRoadmapBoard />);

    await user.click(
      screen.getAllByRole("button", {
        name: /HTTP, HTTPS, metody, status codes i headers/i,
      })[0],
    );

    await waitFor(() => {
      expect(screen.getByText("1/32 tematow")).toBeInTheDocument();
    });

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toMatchObject({
      "javascript:networking-for-apps:http-basics": true,
    });
  });

  it("loads stored progress and switches learning tracks", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ "javascript:networking-for-apps:http-basics": true }),
    );

    render(<LearningRoadmapBoard />);

    expect(await screen.findByText("1/32 tematow")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /DevOps Sciezka/i }));

    expect(screen.getByRole("heading", { name: "Linux and Networking Base" })).toBeInTheDocument();
  });

  it("logs localStorage load and save failures without crashing", async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("read failed");
      });
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("write failed");
      });

    render(<LearningRoadmapBoard />);

    expect(await screen.findByRole("heading", { name: "Centrum Nauki" })).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith("Failed to load learning progress", expect.any(Error));

    await user.click(
      screen.getAllByRole("button", {
        name: /HTTP, HTTPS, metody, status codes i headers/i,
      })[0],
    );

    expect(consoleSpy).toHaveBeenCalledWith("Failed to save learning progress", expect.any(Error));

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});

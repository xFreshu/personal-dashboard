import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
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
});

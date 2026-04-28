import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentPropsWithoutRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Sidebar from "../Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/learning",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: ComponentPropsWithoutRef<"a"> & {
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
      writable: true,
    });
  });

  it("is collapsed by default and expands on button click", async () => {
    const user = userEvent.setup();
    const { container } = render(<Sidebar />);

    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("w-20");
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Nauka")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Rozwiń sidebar/i }));

    expect(aside).toHaveClass("w-72");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Nauka")).toBeInTheDocument();
    expect(screen.getByText("League")).toBeInTheDocument();
  });

  it("closes with the mobile backdrop and after a mobile link click", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 480,
      writable: true,
    });
    const { container } = render(<Sidebar />);

    await user.click(screen.getByRole("button", { name: /Rozwiń sidebar/i }));
    expect(container.querySelector("aside")).toHaveClass("w-72");

    await user.click(screen.getByRole("button", { name: /Zamknij sidebar/i }));
    expect(container.querySelector("aside")).toHaveClass("w-20");

    await user.click(screen.getByRole("button", { name: /Rozwiń sidebar/i }));
    await user.click(screen.getByRole("link", { name: /Dashboard/i }));
    expect(container.querySelector("aside")).toHaveClass("w-20");
  });
});

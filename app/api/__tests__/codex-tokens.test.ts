import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fsMock = vi.hoisted(() => ({
  existsSync: vi.fn(),
}));

const childProcessMock = vi.hoisted(() => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock("node:fs", () => ({
  existsSync: fsMock.existsSync,
  default: {
    existsSync: fsMock.existsSync,
  },
}));

vi.mock("node:child_process", () => ({
  execFile: childProcessMock.execFile,
  spawn: childProcessMock.spawn,
  default: {
    execFile: childProcessMock.execFile,
    spawn: childProcessMock.spawn,
  },
}));

const promisifyCustom = Symbol.for("nodejs.util.promisify.custom");
(childProcessMock.execFile as unknown as Record<symbol, unknown>)[promisifyCustom] = vi.fn();

const originalEnv = process.env;

describe("Codex tokens API route", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CODEX_STATE_DB_PATH: "/tmp/codex-state.sqlite",
      CODEX_BIN_PATH: "codex-test",
    };
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("reports missing Codex state database", async () => {
    fsMock.existsSync.mockReturnValue(false);
    const { GET } = await import("../codex/tokens/route");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      configured: false,
      missing: ["/tmp/codex-state.sqlite"],
    });
  });

  it("returns token summaries, recent threads and Codex app status", async () => {
    fsMock.existsSync.mockReturnValue(true);
    vi.mocked(
      (childProcessMock.execFile as unknown as Record<symbol, ReturnType<typeof vi.fn>>)[
        promisifyCustom
      ],
    ).mockImplementation(async (_command: string, args: string[]) => {
      const query = args.at(-1) ?? "";

      if (query.includes("AS totalTokens")) {
        return {
          stdout: JSON.stringify([
            {
              totalTokens: 1000,
              totalThreads: 2,
              todayTokens: 300,
              weekTokens: 700,
              monthTokens: 1000,
              activeToday: 1,
              updatedAt: 1_777_360_000_000,
            },
          ]),
        };
      }

      if (query.includes("WITH RECURSIVE days")) {
        return {
          stdout: JSON.stringify([{ day: "2026-04-28", tokens: 300, threads: 1 }]),
        };
      }

      if (query.includes("GROUP BY COALESCE")) {
        return {
          stdout: JSON.stringify([{ model: "gpt-5.5", tokens: 1000, threads: 2 }]),
        };
      }

      if (query.includes("LIMIT 5")) {
        return {
          stdout: JSON.stringify([
            {
              id: "thread-1",
              title: "Hello\nCodex",
              tokens: 300,
              model: "gpt-5.5",
              updatedAt: 1_777_360_000_000,
            },
          ]),
        };
      }

      return {
        stdout: JSON.stringify([
          {
            id: "session-1",
            title: "Latest session",
            model: "gpt-5.5",
            reasoningEffort: "medium",
            cwd: "/workspace",
            approvalMode: "on-request",
            sandboxPolicy: JSON.stringify({ type: "workspace-write" }),
            updatedAt: 1_777_360_000_000,
          },
        ]),
      };
    });
    childProcessMock.spawn.mockImplementation(() => createCodexProcess());

    const { GET } = await import("../codex/tokens/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(childProcessMock.spawn).toHaveBeenCalledWith(
      "codex-test",
      ["app-server", "--listen", "stdio://"],
      expect.objectContaining({ stdio: ["pipe", "pipe", "ignore"] }),
    );
    expect(body).toMatchObject({
      configured: true,
      summary: {
        totalTokens: 1000,
        todayTokens: 300,
      },
      days: [{ day: "2026-04-28", tokens: 300, threads: 1 }],
      models: [{ model: "gpt-5.5", tokens: 1000, threads: 2 }],
      recentThreads: [{ id: "thread-1", title: "Hello Codex" }],
      status: {
        account: {
          type: "chatgpt",
          email: "codex@example.com",
        },
        latestSession: {
          id: "session-1",
        },
      },
    });
  });

  it("returns a configured error when sqlite fails", async () => {
    fsMock.existsSync.mockReturnValue(true);
    vi.mocked(
      (childProcessMock.execFile as unknown as Record<symbol, ReturnType<typeof vi.fn>>)[
        promisifyCustom
      ],
    ).mockRejectedValue(new Error("sqlite exploded"));
    childProcessMock.spawn.mockImplementation(() => createCodexProcess());
    const { GET } = await import("../codex/tokens/route");

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      configured: true,
      error: "sqlite exploded",
    });
  });

  it("captures Codex app-server JSON-RPC errors", async () => {
    fsMock.existsSync.mockReturnValue(true);
    mockSqlRows();
    childProcessMock.spawn.mockImplementation(() =>
      createCodexProcess({
        onWrite(line, stdout) {
          const parsed = JSON.parse(line) as { id: number };
          if (parsed.id === 2) {
            stdout.emit(
              "data",
              Buffer.from(`${JSON.stringify({ id: 2, error: { message: "RPC failed" } })}\n`),
            );
          }
        },
      }),
    );
    const { GET } = await import("../codex/tokens/route");

    const response = await GET();
    const body = await response.json();

    expect(body.status.error).toBe("RPC failed");
  });

  it("captures Codex app-server process errors and early exits", async () => {
    fsMock.existsSync.mockReturnValue(true);
    mockSqlRows();
    childProcessMock.spawn.mockImplementation(() =>
      createCodexProcess({
        onWrite: () => true,
        afterCreate(child) {
          queueMicrotask(() => child.emit("error", new Error("spawn failed")));
        },
      }),
    );
    let route = await import("../codex/tokens/route");
    let response = await route.GET();
    let body = await response.json();

    expect(body.status.error).toBe("spawn failed");

    vi.resetModules();
    childProcessMock.spawn.mockImplementation(() =>
      createCodexProcess({
        onWrite: () => true,
        afterCreate(child) {
          queueMicrotask(() => child.emit("exit"));
        },
      }),
    );

    route = await import("../codex/tokens/route");
    response = await route.GET();
    body = await response.json();

    expect(body.status.error).toBe(
      "Codex app-server zakonczyl prace przed zwroceniem limitow.",
    );
  });

  it("times out when Codex app-server does not answer", async () => {
    vi.useFakeTimers();
    fsMock.existsSync.mockReturnValue(true);
    mockSqlRows();
    childProcessMock.spawn.mockImplementation(() => createCodexProcess({ onWrite: () => true }));
    const { GET } = await import("../codex/tokens/route");

    const responsePromise = GET();
    await vi.advanceTimersByTimeAsync(8_000);
    const response = await responsePromise;
    const body = await response.json();

    expect(body.status.error).toBe(
      "Nie udalo sie odczytac statusu Codexa przed timeoutem.",
    );
    vi.useRealTimers();
  });
});

function mockSqlRows() {
  vi.mocked(
    (childProcessMock.execFile as unknown as Record<symbol, ReturnType<typeof vi.fn>>)[
      promisifyCustom
    ],
  ).mockResolvedValue({
    stdout: "[]",
  });
}

type CodexProcessOptions = {
  onWrite?: (
    line: string,
    stdout: EventEmitter,
    child: ReturnType<typeof createCodexProcess>,
  ) => boolean | void;
  afterCreate?: (child: ReturnType<typeof createCodexProcess>) => void;
};

function createCodexProcess(options: CodexProcessOptions = {}) {
  const stdout = new EventEmitter();
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stdin: { write: (line: string) => boolean };
    kill: ReturnType<typeof vi.fn>;
  };

  child.stdout = stdout;
  child.kill = vi.fn();
  child.stdin = {
    write: vi.fn((line: string) => {
      const handled = options.onWrite?.(line, stdout, child);
      if (handled) return true;

      const parsed = JSON.parse(line) as { id: number };

      if (parsed.id === 2) {
        stdout.emit(
          "data",
          Buffer.from(
            `${JSON.stringify({
              id: 2,
              result: {
                account: {
                  type: "chatgpt",
                  email: "codex@example.com",
                  planType: "plus",
                },
                requiresOpenaiAuth: false,
              },
            })}\n`,
          ),
        );
      }

      if (parsed.id === 3) {
        stdout.emit(
          "data",
          Buffer.from(
            `${JSON.stringify({
              id: 3,
              result: {
                rateLimits: null,
                rateLimitsByLimitId: {
                  codex: {
                    limitId: "codex",
                    limitName: "Codex",
                    primary: null,
                    secondary: null,
                    credits: null,
                    planType: "plus",
                    rateLimitReachedType: null,
                  },
                },
              },
            })}\n`,
          ),
        );
      }

      return true;
    }),
  };

  options.afterCreate?.(child);

  return child;
}

import { execFile } from "node:child_process";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

type SummaryRow = {
  totalTokens: number;
  totalThreads: number;
  todayTokens: number;
  weekTokens: number;
  monthTokens: number;
  activeToday: number;
  updatedAt: number | null;
};

type DayRow = {
  day: string;
  tokens: number;
  threads: number;
};

type ModelRow = {
  model: string;
  tokens: number;
  threads: number;
};

type RecentThreadRow = {
  id: string;
  title: string;
  tokens: number;
  model: string;
  updatedAt: number;
};

type LatestSessionRow = {
  id: string;
  title: string;
  model: string | null;
  reasoningEffort: string | null;
  cwd: string;
  approvalMode: string;
  sandboxPolicy: string;
  updatedAt: number;
};

type CodexAccount =
  | {
      type: "chatgpt";
      email: string;
      planType: string;
    }
  | {
      type: "apiKey" | "amazonBedrock";
    };

type RateLimitWindow = {
  usedPercent: number;
  windowDurationMins: number | null;
  resetsAt: number | null;
};

type RateLimitSnapshot = {
  limitId: string | null;
  limitName: string | null;
  primary: RateLimitWindow | null;
  secondary: RateLimitWindow | null;
  credits: {
    hasCredits: boolean;
    unlimited: boolean;
    balance: string | null;
  } | null;
  planType: string | null;
  rateLimitReachedType: string | null;
};

type CodexAppServerData = {
  account: CodexAccount | null;
  requiresOpenaiAuth: boolean | null;
  rateLimits: RateLimitSnapshot | null;
  rateLimitsByLimitId: Record<string, RateLimitSnapshot> | null;
  error: string | null;
};

const defaultDbPath = `${process.env.HOME ?? ""}/.codex/state_5.sqlite`;

function getDatabasePath() {
  return process.env.CODEX_STATE_DB_PATH || defaultDbPath;
}

async function runSql<T>(databasePath: string, query: string): Promise<T[]> {
  const { stdout } = await execFileAsync("sqlite3", [
    "-json",
    "-readonly",
    databasePath,
    query,
  ]);

  const trimmed = stdout.trim();
  if (!trimmed) return [];

  return JSON.parse(trimmed) as T[];
}

function getCodexBinary() {
  return process.env.CODEX_BIN_PATH || "codex";
}

function isJsonRpcResult(value: unknown): value is {
  id: number;
  result?: unknown;
  error?: { message?: string };
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "number"
  );
}

async function readCodexAppServer(): Promise<CodexAppServerData> {
  return new Promise((resolve) => {
    const child = spawn(getCodexBinary(), ["app-server", "--listen", "stdio://"], {
      stdio: ["pipe", "pipe", "ignore"],
    });

    const results = new Map<number, unknown>();
    let outputBuffer = "";
    let settled = false;

    const finish = (data: CodexAppServerData) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      child.kill();
      resolve(data);
    };

    const maybeFinish = () => {
      if (!results.has(2) || !results.has(3)) return;

      const accountResult = results.get(2) as
        | { account?: CodexAccount | null; requiresOpenaiAuth?: boolean }
        | undefined;
      const rateLimitResult = results.get(3) as
        | {
            rateLimits?: RateLimitSnapshot;
            rateLimitsByLimitId?: Record<string, RateLimitSnapshot> | null;
          }
        | undefined;

      finish({
        account: accountResult?.account ?? null,
        requiresOpenaiAuth: accountResult?.requiresOpenaiAuth ?? null,
        rateLimits: rateLimitResult?.rateLimits ?? null,
        rateLimitsByLimitId: rateLimitResult?.rateLimitsByLimitId ?? null,
        error: null,
      });
    };

    const timeout = setTimeout(() => {
      finish({
        account: null,
        requiresOpenaiAuth: null,
        rateLimits: null,
        rateLimitsByLimitId: null,
        error: "Nie udalo sie odczytac statusu Codexa przed timeoutem.",
      });
    }, 8_000);

    child.stdout.on("data", (chunk: Buffer) => {
      outputBuffer += chunk.toString("utf8");

      let newlineIndex = outputBuffer.indexOf("\n");
      while (newlineIndex >= 0) {
        const line = outputBuffer.slice(0, newlineIndex).trim();
        outputBuffer = outputBuffer.slice(newlineIndex + 1);

        if (line) {
          try {
            const parsed = JSON.parse(line) as unknown;
            if (isJsonRpcResult(parsed)) {
              if (parsed.error) {
                finish({
                  account: null,
                  requiresOpenaiAuth: null,
                  rateLimits: null,
                  rateLimitsByLimitId: null,
                  error: parsed.error.message ?? "Codex app-server zwrocil blad.",
                });
                return;
              }

              results.set(parsed.id, parsed.result);
              maybeFinish();
            }
          } catch {
            // App-server can emit log lines on stdout; they are not part of JSON-RPC responses.
          }
        }

        newlineIndex = outputBuffer.indexOf("\n");
      }
    });

    child.on("error", (error) => {
      finish({
        account: null,
        requiresOpenaiAuth: null,
        rateLimits: null,
        rateLimitsByLimitId: null,
        error: error.message,
      });
    });

    child.on("exit", () => {
      if (!settled) {
        finish({
          account: null,
          requiresOpenaiAuth: null,
          rateLimits: null,
          rateLimitsByLimitId: null,
          error: "Codex app-server zakonczyl prace przed zwroceniem limitow.",
        });
      }
    });

    const initializeRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        clientInfo: {
          name: "personal-dashboard",
          title: "Personal Dashboard",
          version: "0.1.0",
        },
        capabilities: {
          experimentalApi: true,
        },
      },
    };

    const accountRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "account/read",
      params: {
        refreshToken: false,
      },
    };

    const rateLimitsRequest = {
      jsonrpc: "2.0",
      id: 3,
      method: "account/rateLimits/read",
    };

    child.stdin.write(`${JSON.stringify(initializeRequest)}\n`);
    child.stdin.write(`${JSON.stringify(accountRequest)}\n`);
    child.stdin.write(`${JSON.stringify(rateLimitsRequest)}\n`);
  });
}

export async function GET() {
  const databasePath = getDatabasePath();

  if (!existsSync(databasePath)) {
    return NextResponse.json({
      configured: false,
      missing: [databasePath],
    });
  }

  try {
    const summaryQuery = `
      SELECT
        COALESCE(SUM(tokens_used), 0) AS totalTokens,
        COUNT(*) AS totalThreads,
        COALESCE(SUM(CASE
          WHEN date(updated_at_ms / 1000, 'unixepoch', 'localtime') = date('now', 'localtime')
          THEN tokens_used ELSE 0 END), 0) AS todayTokens,
        COALESCE(SUM(CASE
          WHEN date(updated_at_ms / 1000, 'unixepoch', 'localtime') >= date('now', '-6 days', 'localtime')
          THEN tokens_used ELSE 0 END), 0) AS weekTokens,
        COALESCE(SUM(CASE
          WHEN date(updated_at_ms / 1000, 'unixepoch', 'localtime') >= date('now', '-29 days', 'localtime')
          THEN tokens_used ELSE 0 END), 0) AS monthTokens,
        COALESCE(SUM(CASE
          WHEN date(updated_at_ms / 1000, 'unixepoch', 'localtime') = date('now', 'localtime')
          THEN 1 ELSE 0 END), 0) AS activeToday,
        MAX(updated_at_ms) AS updatedAt
      FROM threads
      WHERE tokens_used > 0
        AND source = 'vscode';
    `;

    const daysQuery = `
      WITH RECURSIVE days(day, offset) AS (
        SELECT date('now', 'localtime'), 0
        UNION ALL
        SELECT date(day, '-1 day'), offset + 1 FROM days WHERE offset < 6
      )
      SELECT
        days.day AS day,
        COALESCE(SUM(threads.tokens_used), 0) AS tokens,
        COUNT(threads.id) AS threads
      FROM days
      LEFT JOIN threads
        ON date(threads.updated_at_ms / 1000, 'unixepoch', 'localtime') = days.day
        AND threads.tokens_used > 0
        AND threads.source = 'vscode'
      GROUP BY days.day
      ORDER BY days.day ASC;
    `;

    const modelsQuery = `
      SELECT
        COALESCE(NULLIF(model, ''), model_provider, 'unknown') AS model,
        COALESCE(SUM(tokens_used), 0) AS tokens,
        COUNT(*) AS threads
      FROM threads
      WHERE tokens_used > 0
        AND source = 'vscode'
      GROUP BY COALESCE(NULLIF(model, ''), model_provider, 'unknown')
      ORDER BY tokens DESC
      LIMIT 4;
    `;

    const recentQuery = `
      SELECT
        id,
        COALESCE(NULLIF(title, ''), first_user_message, 'Bez tytulu') AS title,
        tokens_used AS tokens,
        COALESCE(NULLIF(model, ''), model_provider, 'unknown') AS model,
        updated_at_ms AS updatedAt
      FROM threads
      WHERE tokens_used > 0
        AND source = 'vscode'
      ORDER BY updated_at_ms DESC
      LIMIT 5;
    `;

    const latestSessionQuery = `
      SELECT
        id,
        COALESCE(NULLIF(title, ''), first_user_message, 'Bez tytulu') AS title,
        model,
        reasoning_effort AS reasoningEffort,
        cwd,
        approval_mode AS approvalMode,
        sandbox_policy AS sandboxPolicy,
        updated_at_ms AS updatedAt
      FROM threads
      WHERE source = 'vscode'
      ORDER BY updated_at_ms DESC
      LIMIT 1;
    `;

    const [summaryRows, days, models, recentThreads, latestSessionRows, status] = await Promise.all([
      runSql<SummaryRow>(databasePath, summaryQuery),
      runSql<DayRow>(databasePath, daysQuery),
      runSql<ModelRow>(databasePath, modelsQuery),
      runSql<RecentThreadRow>(databasePath, recentQuery),
      runSql<LatestSessionRow>(databasePath, latestSessionQuery),
      readCodexAppServer(),
    ]);

    return NextResponse.json({
      configured: true,
      status: {
        ...status,
        latestSession: latestSessionRows[0] ?? null,
      },
      summary: summaryRows[0] ?? {
        totalTokens: 0,
        totalThreads: 0,
        todayTokens: 0,
        weekTokens: 0,
        monthTokens: 0,
        activeToday: 0,
        updatedAt: null,
      },
      days,
      models,
      recentThreads: recentThreads.map((thread) => ({
        ...thread,
        title: thread.title.replace(/\s+/g, " ").trim(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        error:
          error instanceof Error
            ? error.message
            : "Nie udalo sie odczytac zuzycia tokenow Codexa.",
      },
      { status: 500 },
    );
  }
}

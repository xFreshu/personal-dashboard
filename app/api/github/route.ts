import { NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

type GitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
};

type GitHubRepo = {
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  pushed_at: string | null;
  updated_at: string;
  archived: boolean;
  fork: boolean;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name?: string;
      date?: string;
    } | null;
  };
};

type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  updated_at: string;
  pull_request?: unknown;
};

type GitHubPullRequest = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  updated_at: string;
  draft?: boolean;
};

type GitHubRelease = {
  id: number;
  name: string | null;
  tag_name: string;
  html_url: string;
  published_at: string | null;
  prerelease: boolean;
};

type GitHubWorkflowRun = {
  id: number;
  name: string | null;
  html_url: string;
  status: string;
  conclusion: string | null;
  event: string;
  head_branch: string | null;
  created_at: string;
  updated_at: string;
};

type GitHubWorkflowRunsResponse = {
  workflow_runs?: GitHubWorkflowRun[];
};

type GitHubEvent = {
  id: string;
  type: string;
  created_at: string;
  repo: {
    name: string;
  };
  payload?: {
    action?: string;
    ref?: string;
    ref_type?: string;
    pull_request?: {
      number?: number;
      title?: string;
      html_url?: string;
    };
    issue?: {
      number?: number;
      title?: string;
      html_url?: string;
    };
    commits?: {
      sha: string;
      message: string;
      url: string;
    }[];
    release?: {
      tag_name?: string;
      html_url?: string;
    };
  };
};

type ContributionDay = {
  date: string;
  contributionCount: number;
  color: string;
};

type GraphQLContributionResponse = {
  data?: {
    user?: {
      login: string;
      name: string | null;
      avatarUrl: string;
      url: string;
      followers: { totalCount: number };
      repositories: { totalCount: number };
      issues: { totalCount: number };
      pullRequests: { totalCount: number };
      contributionsCollection: {
        totalCommitContributions: number;
        totalIssueContributions: number;
        totalPullRequestContributions: number;
        totalPullRequestReviewContributions: number;
        totalRepositoryContributions: number;
        restrictedContributionsCount: number;
        contributionCalendar: {
          totalContributions: number;
          weeks: {
            contributionDays: ContributionDay[];
          }[];
        };
      };
    };
    rateLimit?: {
      remaining: number;
      resetAt: string;
    };
  };
  errors?: { message: string }[];
};

function githubHeaders(token?: string) {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubRest<T>(path: string, token?: string) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(token),
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`GitHub REST ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
) {
  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: "POST",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
  });

  const payload = (await response.json()) as T & { errors?: { message: string }[] };

  if (!response.ok || payload.errors?.length) {
    throw new Error(
      payload.errors?.map((error) => error.message).join(", ") ||
        `GitHub GraphQL failed with ${response.status}`,
    );
  }

  return payload;
}

function getConfiguredRepos(username: string) {
  const raw = process.env.GITHUB_REPOS ?? process.env.GITHUB_REPOSITORIES ?? "";
  return raw
    .split(",")
    .map((repo) => repo.trim())
    .filter(Boolean)
    .map((repo) => (repo.includes("/") ? repo : `${username}/${repo}`));
}

function compactCommitMessage(message: string) {
  return message.split("\n")[0]?.trim() || "(brak opisu commita)";
}

function eventLabel(event: GitHubEvent) {
  const repoName = event.repo.name.split("/").at(-1) ?? event.repo.name;

  switch (event.type) {
    case "PushEvent": {
      const count = event.payload?.commits?.length ?? 0;
      return {
        label: "Push",
        detail: `${count} ${count === 1 ? "commit" : "commity"} w ${repoName}`,
        href: `https://github.com/${event.repo.name}`,
      };
    }
    case "PullRequestEvent":
      return {
        label: "Pull request",
        detail: `${event.payload?.action ?? "update"} #${event.payload?.pull_request?.number ?? ""} ${repoName}`,
        href: event.payload?.pull_request?.html_url ?? `https://github.com/${event.repo.name}/pulls`,
      };
    case "IssuesEvent":
      return {
        label: "Issue",
        detail: `${event.payload?.action ?? "update"} #${event.payload?.issue?.number ?? ""} ${repoName}`,
        href: event.payload?.issue?.html_url ?? `https://github.com/${event.repo.name}/issues`,
      };
    case "WatchEvent":
      return {
        label: "Star",
        detail: `Gwiazdka dla ${repoName}`,
        href: `https://github.com/${event.repo.name}`,
      };
    case "CreateEvent":
      return {
        label: "Create",
        detail: `${event.payload?.ref_type ?? "zasób"} ${event.payload?.ref ?? ""} w ${repoName}`.trim(),
        href: `https://github.com/${event.repo.name}`,
      };
    case "ReleaseEvent":
      return {
        label: "Release",
        detail: `${event.payload?.release?.tag_name ?? "nowy release"} w ${repoName}`,
        href: event.payload?.release?.html_url ?? `https://github.com/${event.repo.name}/releases`,
      };
    default:
      return {
        label: event.type.replace("Event", ""),
        detail: repoName,
        href: `https://github.com/${event.repo.name}`,
      };
  }
}

function isFailedRun(run: GitHubWorkflowRun) {
  return ["action_required", "cancelled", "failure", "timed_out"].includes(
    run.conclusion ?? run.status,
  );
}

async function getContributions(username: string, token?: string) {
  if (!token) {
    return {
      available: false,
      reason: "GITHUB_TOKEN is required for the GraphQL contribution calendar.",
    };
  }

  const to = new Date();
  const from = new Date(to);
  from.setFullYear(to.getFullYear() - 1);

  const query = `
    query DashboardContributions($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        login
        name
        avatarUrl
        url
        followers {
          totalCount
        }
        repositories(ownerAffiliations: OWNER, first: 1) {
          totalCount
        }
        issues(first: 1) {
          totalCount
        }
        pullRequests(first: 1) {
          totalCount
        }
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalRepositoryContributions
          restrictedContributionsCount
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
      }
      rateLimit {
        remaining
        resetAt
      }
    }
  `;

  try {
    const response = await githubGraphQL<GraphQLContributionResponse>(
      query,
      {
        login: username,
        from: from.toISOString(),
        to: to.toISOString(),
      },
      token,
    );

    const user = response.data?.user;
    if (!user) {
      throw new Error("Nie znaleziono użytkownika GitHub.");
    }

    const collection = user.contributionsCollection;

    return {
      available: true,
      profile: {
        login: user.login,
        name: user.name,
        avatarUrl: user.avatarUrl,
        url: user.url,
        followers: user.followers.totalCount,
        repositories: user.repositories.totalCount,
        issues: user.issues.totalCount,
        pullRequests: user.pullRequests.totalCount,
      },
      totals: {
        contributions: collection.contributionCalendar.totalContributions,
        commits: collection.totalCommitContributions,
        issues: collection.totalIssueContributions,
        pullRequests: collection.totalPullRequestContributions,
        reviews: collection.totalPullRequestReviewContributions,
        repositories: collection.totalRepositoryContributions,
        restricted: collection.restrictedContributionsCount,
      },
      calendar: collection.contributionCalendar.weeks.flatMap(
        (week) => week.contributionDays,
      ),
      rateLimit: response.data?.rateLimit ?? null,
    };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : "Nie udało się pobrać kalendarza.",
    };
  }
}

async function getRepoDashboard(repoFullName: string, token?: string) {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository: ${repoFullName}`);
  }

  const [
    details,
    commits,
    issues,
    pullRequests,
    releases,
    workflowRuns,
  ] = await Promise.all([
    githubRest<GitHubRepo>(`/repos/${owner}/${repo}`, token),
    githubRest<GitHubCommit[]>(`/repos/${owner}/${repo}/commits?per_page=3`, token),
    githubRest<GitHubIssue[]>(`/repos/${owner}/${repo}/issues?state=open&per_page=8`, token),
    githubRest<GitHubPullRequest[]>(`/repos/${owner}/${repo}/pulls?state=open&per_page=5`, token),
    githubRest<GitHubRelease[]>(`/repos/${owner}/${repo}/releases?per_page=1`, token).catch(
      () => [],
    ),
    githubRest<GitHubWorkflowRunsResponse>(
      `/repos/${owner}/${repo}/actions/runs?per_page=5`,
      token,
    ).catch(() => ({ workflow_runs: [] })),
  ]);

  const openIssues = issues.filter((issue) => !issue.pull_request).slice(0, 5);
  const runs = workflowRuns.workflow_runs ?? [];

  return {
    name: details.name,
    fullName: details.full_name,
    description: details.description,
    url: details.html_url,
    language: details.language,
    pushedAt: details.pushed_at,
    stats: {
      stars: details.stargazers_count,
      forks: details.forks_count,
      watchers: details.watchers_count,
      openIssues: openIssues.length,
      openPullRequests: pullRequests.length,
    },
    latestCommits: commits.map((commit) => ({
      sha: commit.sha,
      shortSha: commit.sha.slice(0, 7),
      message: compactCommitMessage(commit.commit.message),
      author: commit.commit.author?.name ?? null,
      date: commit.commit.author?.date ?? null,
      url: commit.html_url,
    })),
    openIssues: openIssues.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      updatedAt: issue.updated_at,
    })),
    openPullRequests: pullRequests.map((pullRequest) => ({
      id: pullRequest.id,
      number: pullRequest.number,
      title: pullRequest.title,
      url: pullRequest.html_url,
      updatedAt: pullRequest.updated_at,
      draft: pullRequest.draft ?? false,
    })),
    latestRelease: releases[0]
      ? {
          id: releases[0].id,
          name: releases[0].name,
          tagName: releases[0].tag_name,
          url: releases[0].html_url,
          publishedAt: releases[0].published_at,
          prerelease: releases[0].prerelease,
        }
      : null,
    actions: {
      latestRuns: runs.map((run) => ({
        id: run.id,
        name: run.name,
        url: run.html_url,
        status: run.status,
        conclusion: run.conclusion,
        event: run.event,
        branch: run.head_branch,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
      })),
      failedCount: runs.filter(isFailedRun).length,
    },
  };
}

export async function GET() {
  const username = process.env.GITHUB_USERNAME;
  const token = process.env.GITHUB_TOKEN;

  if (!username) {
    return NextResponse.json({
      configured: false,
      missing: ["GITHUB_USERNAME"],
    });
  }

  try {
    const [profile, repos, events, contributions] = await Promise.all([
      githubRest<GitHubUser>(`/users/${username}`, token),
      githubRest<GitHubRepo[]>(
        `/users/${username}/repos?sort=pushed&direction=desc&per_page=100&type=owner`,
        token,
      ),
      githubRest<GitHubEvent[]>(`/users/${username}/events/public?per_page=20`, token),
      getContributions(username, token),
    ]);

    const configuredRepos = getConfiguredRepos(username);
    const selectedRepos = configuredRepos.length
      ? configuredRepos
      : repos
          .filter((repo) => !repo.archived && !repo.fork)
          .sort((a, b) => {
            const pushedA = new Date(a.pushed_at ?? a.updated_at).getTime();
            const pushedB = new Date(b.pushed_at ?? b.updated_at).getTime();
            return pushedB - pushedA;
          })
          .slice(0, 3)
          .map((repo) => repo.full_name);

    const repoResults = await Promise.allSettled(
      selectedRepos.slice(0, 5).map((repo) => getRepoDashboard(repo, token)),
    );

    const repoErrors = repoResults
      .map((result, index) =>
        result.status === "rejected"
          ? `${selectedRepos[index]}: ${
              result.reason instanceof Error ? result.reason.message : "błąd pobierania"
            }`
          : null,
      )
      .filter(Boolean);

    const repositoryDashboards = repoResults
      .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof getRepoDashboard>>> =>
        result.status === "fulfilled",
      )
      .map((result) => result.value);

    const publicEvents = events
      .filter((event) =>
        ["PushEvent", "PullRequestEvent", "IssuesEvent", "WatchEvent", "CreateEvent", "ReleaseEvent", "ForkEvent"].includes(
          event.type,
        ),
      )
      .slice(0, 8)
      .map((event) => ({
        id: event.id,
        type: event.type,
        repo: event.repo.name,
        createdAt: event.created_at,
        ...eventLabel(event),
      }));

    return NextResponse.json(
      {
        configured: true,
        hasToken: Boolean(token),
        profile: {
          login: profile.login,
          name: profile.name,
          avatarUrl: profile.avatar_url,
          url: profile.html_url,
          bio: profile.bio,
          followers: profile.followers,
          following: profile.following,
          publicRepos: profile.public_repos,
        },
        contributions,
        aggregate: {
          publicRepos: repos.length,
          stars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
          forks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
          openIssues: repositoryDashboards.reduce(
            (sum, repo) => sum + repo.stats.openIssues,
            0,
          ),
          openPullRequests: repositoryDashboards.reduce(
            (sum, repo) => sum + repo.stats.openPullRequests,
            0,
          ),
          failedWorkflowRuns: repositoryDashboards.reduce(
            (sum, repo) => sum + repo.actions.failedCount,
            0,
          ),
        },
        events: publicEvents,
        repositories: repositoryDashboards,
        errors: repoErrors,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        error: error instanceof Error ? error.message : "Nie udało się pobrać danych GitHub.",
      },
      { status: 500 },
    );
  }
}

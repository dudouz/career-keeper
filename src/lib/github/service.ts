/**
 * GitHub API service functions
 * These are pure functions that interact with the GitHub API via Octokit
 */

import { Octokit } from "@octokit/rest"
import type {
  GitHubContributionData,
  Repository,
  Commit,
  PullRequest,
  Issue,
  Release,
} from "@/lib/db/types"
import { GITHUB } from "@/lib/constants"

/**
 * Create an Octokit instance with the given token
 */
function createOctokit(token: string) {
  return new Octokit({ auth: token })
}

/**
 * Validate a GitHub personal access token and get username
 */
export async function validateGitHubToken(token: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const octokit = createOctokit(token)
    const { data } = await octokit.users.getAuthenticated()
    return { valid: true, username: data.login }
  } catch {
    return { valid: false, error: "Invalid GitHub token" }
  }
}

/**
 * Get the authenticated user's username
 */
export async function getGitHubUsername(token: string): Promise<string> {
  const octokit = createOctokit(token)
  const { data } = await octokit.users.getAuthenticated()
  return data.login
}

/**
 * Fetch all repositories for the authenticated user
 */
export async function fetchGitHubRepositories(token: string, _username: string): Promise<Repository[]> {
  const octokit = createOctokit(token)
  const { data } = await octokit.repos.listForAuthenticatedUser({
    per_page: GITHUB.REPOS_PER_PAGE,
    sort: "updated",
  })

  return data.map((repo) => ({
    name: repo.full_name,
    description: repo.description || undefined,
    url: repo.html_url,
    language: repo.language || undefined,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
  }))
}

/**
 * Fetch commits for a specific repository
 */
export async function fetchGitHubCommits(token: string, repoFullName: string, username: string): Promise<Commit[]> {
  try {
    const octokit = createOctokit(token)
    const [owner, repo] = repoFullName.split("/")
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      author: username,
      per_page: GITHUB.COMMITS_PER_PAGE,
    })

    return data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      date: commit.commit.author?.date || new Date().toISOString(),
      repository: repoFullName,
      url: commit.html_url,
    }))
  } catch {
    return []
  }
}

/**
 * Fetch pull requests for a specific repository
 */
export async function fetchGitHubPullRequests(token: string, repoFullName: string, username: string): Promise<PullRequest[]> {
  try {
    const octokit = createOctokit(token)
    const [owner, repo] = repoFullName.split("/")
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: "all",
      per_page: GITHUB.PRS_PER_PAGE,
    })

    return data
      .filter((pr) => pr.user?.login === username)
      .map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        createdAt: pr.created_at,
        closedAt: pr.closed_at || undefined,
        repository: repoFullName,
        url: pr.html_url,
      }))
  } catch {
    return []
  }
}

/**
 * Fetch issues for a specific repository
 */
export async function fetchGitHubIssues(token: string, repoFullName: string, username: string): Promise<Issue[]> {
  try {
    const octokit = createOctokit(token)
    const [owner, repo] = repoFullName.split("/")
    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      creator: username,
      state: "all",
      per_page: GITHUB.ISSUES_PER_PAGE,
    })

    // Filter out pull requests (they come through issues API too)
    return data
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        createdAt: issue.created_at,
        closedAt: issue.closed_at || undefined,
        repository: repoFullName,
        url: issue.html_url,
      }))
  } catch {
    return []
  }
}

/**
 * Fetch releases for a specific repository
 */
export async function fetchGitHubReleases(token: string, repoFullName: string, username: string): Promise<Release[]> {
  try {
    const octokit = createOctokit(token)
    const [owner, repo] = repoFullName.split("/")
    const { data } = await octokit.repos.listReleases({
      owner,
      repo,
      per_page: GITHUB.PRS_PER_PAGE,
    })

    return data
      .filter((release) => release.author?.login === username)
      .map((release) => ({
        tagName: release.tag_name,
        name: release.name || release.tag_name,
        body: release.body || undefined,
        createdAt: release.created_at,
        repository: repoFullName,
        url: release.html_url,
        downloadCount: release.assets.reduce((sum, asset) => sum + asset.download_count, 0),
      }))
  } catch {
    return []
  }
}

/**
 * Fetch all GitHub contributions (repositories, commits, PRs, issues, releases)
 */
export async function fetchGitHubContributions(token: string): Promise<GitHubContributionData> {
  const username = await getGitHubUsername(token)

  // Fetch repositories
  const repositories = await fetchGitHubRepositories(token, username)

  // Fetch commits, PRs, issues, and releases for each repo
  const commits: Commit[] = []
  const pullRequests: PullRequest[] = []
  const issues: Issue[] = []
  const releases: Release[] = []
  const languageStats: Record<string, number> = {}

  for (const repo of repositories.slice(0, GITHUB.MAX_REPOS_FOR_MVP)) {
    // Count languages
    if (repo.language) {
      languageStats[repo.language] = (languageStats[repo.language] || 0) + 1
    }

    // Fetch all data in parallel for this repo
    const [repoCommits, repoPRs, repoIssues, repoReleases] = await Promise.all([
      fetchGitHubCommits(token, repo.name, username),
      fetchGitHubPullRequests(token, repo.name, username),
      fetchGitHubIssues(token, repo.name, username),
      fetchGitHubReleases(token, repo.name, username),
    ])

    commits.push(...repoCommits)
    pullRequests.push(...repoPRs)
    issues.push(...repoIssues)
    releases.push(...repoReleases)
  }

  return {
    repositories,
    commits,
    pullRequests,
    issues,
    releases,
    languages: languageStats,
    totalContributions: commits.length + pullRequests.length + issues.length,
    scannedAt: new Date().toISOString(),
  }
}

/**
 * Check GitHub API rate limit
 */
export async function checkGitHubRateLimit(token: string): Promise<{ remaining: number; limit: number; reset: Date }> {
  const octokit = createOctokit(token)
  const { data } = await octokit.rateLimit.get()
  return {
    remaining: data.rate.remaining,
    limit: data.rate.limit,
    reset: new Date(data.rate.reset * 1000),
  }
}

import { Octokit } from "@octokit/rest"
import type {
  GitHubContributionData,
  Repository,
  Commit,
  PullRequest,
  Issue,
  Release,
} from "@/lib/db/types"

// TODO: Not sure if we need a class, we can have some hooks for each method and leverage react query instead...
// TODO: We also have some magic numbers, we should use a more consistent approach.

export class GitHubClient {
  private octokit: Octokit

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token })
  }

  async validateToken(): Promise<{ valid: boolean; username?: string; error?: string }> {
    try {
      const { data } = await this.octokit.users.getAuthenticated()
      return { valid: true, username: data.login }
    } catch {
      return { valid: false, error: "Invalid GitHub token" }
    }
  }

  async fetchContributions(): Promise<GitHubContributionData> {
    const username = await this.getUsername()

    // Fetch repositories
    const repositories = await this.fetchRepositories(username)

    // Fetch commits, PRs, issues, and releases for each repo
    const commits: Commit[] = []
    const pullRequests: PullRequest[] = []
    const issues: Issue[] = []
    const releases: Release[] = []
    const languageStats: Record<string, number> = {}

    for (const repo of repositories.slice(0, 10)) {
      // Limit to 10 repos for MVP
      // Count languages
      if (repo.language) {
        languageStats[repo.language] = (languageStats[repo.language] || 0) + 1
      }

      // Fetch commits
      const repoCommits = await this.fetchCommits(repo.name, username)
      commits.push(...repoCommits)

      // Fetch pull requests
      const repoPRs = await this.fetchPullRequests(repo.name, username)
      pullRequests.push(...repoPRs)

      // Fetch issues
      const repoIssues = await this.fetchIssues(repo.name, username)
      issues.push(...repoIssues)

      // Fetch releases
      const repoReleases = await this.fetchReleases(repo.name, username)
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

  private async getUsername(): Promise<string> {
    const { data } = await this.octokit.users.getAuthenticated()
    return data.login
  }

  private async fetchRepositories(_username: string): Promise<Repository[]> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      per_page: 100,
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

  private async fetchCommits(repoFullName: string, username: string): Promise<Commit[]> {
    try {
      const [owner, repo] = repoFullName.split("/")
      const { data } = await this.octokit.repos.listCommits({
        owner,
        repo,
        author: username,
        per_page: 50,
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

  private async fetchPullRequests(repoFullName: string, username: string): Promise<PullRequest[]> {
    try {
      const [owner, repo] = repoFullName.split("/")
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state: "all",
        per_page: 50,
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

  private async fetchIssues(repoFullName: string, username: string): Promise<Issue[]> {
    try {
      const [owner, repo] = repoFullName.split("/")
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        creator: username,
        state: "all",
        per_page: 50,
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

  private async fetchReleases(repoFullName: string, username: string): Promise<Release[]> {
    try {
      const [owner, repo] = repoFullName.split("/")
      const { data } = await this.octokit.repos.listReleases({
        owner,
        repo,
        per_page: 50,
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

  async checkRateLimit(): Promise<{ remaining: number; limit: number; reset: Date }> {
    const { data } = await this.octokit.rateLimit.get()
    return {
      remaining: data.rate.remaining,
      limit: data.rate.limit,
      reset: new Date(data.rate.reset * 1000),
    }
  }
}

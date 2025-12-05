/**
 * User Domain Entity
 * Represents a user in the system
 */

export class User {
  constructor(
    public readonly id: string,
    public readonly username: string | null,
    public jiraBaseUrl: string | null = null,
    public jiraAccessToken: string | null = null,
    public jiraRefreshToken: string | null = null,
    public jiraTokenExpiresAt: Date | null = null
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("User ID is required");
    }
  }

  updateJiraBaseUrl(url: string | null): void {
    if (url !== null) {
      // Normalize URL
      let normalizedUrl = url.trim();
      if (normalizedUrl.startsWith("http://") || normalizedUrl.startsWith("https://")) {
        normalizedUrl = normalizedUrl.replace(/^https?:\/\//, "");
      }
      if (normalizedUrl.endsWith("/")) {
        normalizedUrl = normalizedUrl.slice(0, -1);
      }
      this.jiraBaseUrl = normalizedUrl;
    } else {
      this.jiraBaseUrl = null;
    }
  }

  updateJiraTokens(
    accessToken: string | null,
    refreshToken: string | null,
    expiresAt: Date | null
  ): void {
    this.jiraAccessToken = accessToken;
    this.jiraRefreshToken = refreshToken;
    this.jiraTokenExpiresAt = expiresAt;
  }

  static fromRow(row: {
    id: string;
    username: string | null;
    jira_base_url?: string | null;
    jira_access_token?: string | null;
    jira_refresh_token?: string | null;
    jira_token_expires_at?: string | null;
  }): User {
    return new User(
      row.id,
      row.username,
      row.jira_base_url ?? null,
      row.jira_access_token ?? null,
      row.jira_refresh_token ?? null,
      row.jira_token_expires_at ? new Date(row.jira_token_expires_at) : null
    );
  }

  toRow(): {
    id: string;
    username: string | null;
    jira_base_url: string | null;
    jira_access_token: string | null;
    jira_refresh_token: string | null;
    jira_token_expires_at: string | null;
  } {
    return {
      id: this.id,
      username: this.username,
      jira_base_url: this.jiraBaseUrl,
      jira_access_token: this.jiraAccessToken,
      jira_refresh_token: this.jiraRefreshToken,
      jira_token_expires_at: this.jiraTokenExpiresAt?.toISOString() ?? null,
    };
  }
}


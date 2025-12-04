/**
 * Task Domain Entity
 * Pure business logic, no external dependencies
 */

export type TaskStatus = "active" | "pending" | "completed";

export class Task {
  constructor(
    public readonly id: string,
    public readonly roomId: string,
    public title: string,
    public description: string | null,
    public status: TaskStatus,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public jiraKey: string | null = null,
    public jiraUrl: string | null = null,
    public jiraId: string | null = null
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("Task id is required");
    }
    if (!this.roomId || this.roomId.trim().length === 0) {
      throw new Error("Task roomId is required");
    }
    if (!this.title || this.title.trim().length === 0) {
      throw new Error("Task title cannot be empty");
    }
    if (!this.createdBy || this.createdBy.trim().length === 0) {
      throw new Error("Task createdBy is required");
    }
  }

  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new Error("Task title cannot be empty");
    }
    this.title = newTitle.trim();
    this.updatedAt = new Date();
  }

  updateDescription(newDescription: string | null): void {
    this.description = newDescription ? newDescription.trim() : null;
    this.updatedAt = new Date();
  }

  markAsCompleted(): void {
    this.status = "completed";
    this.updatedAt = new Date();
  }

  markAsActive(): void {
    this.status = "active";
    this.updatedAt = new Date();
  }

  markAsPending(): void {
    this.status = "pending";
    this.updatedAt = new Date();
  }

  linkToJira(jiraKey: string, jiraUrl: string, jiraId: string): void {
    this.jiraKey = jiraKey;
    this.jiraUrl = jiraUrl;
    this.jiraId = jiraId;
    this.updatedAt = new Date();
  }

  unlinkFromJira(): void {
    this.jiraKey = null;
    this.jiraUrl = null;
    this.jiraId = null;
    this.updatedAt = new Date();
  }

  // Factory method to create from database row
  static fromRow(row: {
    id: string;
    room_id: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    created_by_key: string;
    created_by_username?: string;
    created_at: string;
    updated_at: string;
    jira_key?: string | null;
    jira_url?: string | null;
    jira_id?: string | null;
  }): Task {
    return new Task(
      row.id,
      row.room_id,
      row.title,
      row.description || null,
      row.status,
      row.created_by_key,
      new Date(row.created_at),
      new Date(row.updated_at),
      row.jira_key || null,
      row.jira_url || null,
      row.jira_id || null
    );
  }

  // Convert to database row format
  toRow(): {
    id: string;
    room_id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    created_by_key: string;
    created_at: string;
    updated_at: string;
    jira_key: string | null;
    jira_url: string | null;
    jira_id: string | null;
  } {
    return {
      id: this.id,
      room_id: this.roomId,
      title: this.title,
      description: this.description,
      status: this.status,
      created_by_key: this.createdBy,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      jira_key: this.jiraKey,
      jira_url: this.jiraUrl,
      jira_id: this.jiraId,
    };
  }
}


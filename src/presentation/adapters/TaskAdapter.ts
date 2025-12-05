/**
 * Task Adapter
 * Converts between domain entities and presentation layer interfaces
 */

import { Task as DomainTask } from "../../domain/entities/Task";
import type { TaskInfo } from "@/interfaces/Voting.interface";

export class TaskAdapter {
  /**
   * Convert domain Task to presentation TaskInfo interface
   */
  static toPresentation(task: DomainTask): TaskInfo {
    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: task.status,
      room_id: task.roomId,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
      created_by_username: task.createdByUsername || undefined,
      created_by_key: task.createdBy,
      jira_key: task.jiraKey || undefined,
      jira_url: task.jiraUrl || undefined,
      jira_id: task.jiraId || undefined,
    };
  }

  /**
   * Convert presentation TaskInfo interface to domain Task
   */
  static toDomain(task: TaskInfo): DomainTask {
    return DomainTask.fromRow({
      id: task.id,
      room_id: task.room_id,
      title: task.title,
      description: task.description,
      status: task.status,
      created_by_key: task.created_by_key || "",
      created_by_username: task.created_by_username,
      created_at: task.created_at || new Date().toISOString(),
      updated_at: task.updated_at || new Date().toISOString(),
      jira_key: task.jira_key,
      jira_url: task.jira_url,
      jira_id: task.jira_id,
    });
  }

  /**
   * Convert array of domain Tasks to presentation TaskInfo[]
   */
  static toPresentationArray(tasks: DomainTask[]): TaskInfo[] {
    return tasks.map((task) => this.toPresentation(task));
  }

  /**
   * Convert array of presentation TaskInfo[] to domain Tasks
   */
  static toDomainArray(tasks: TaskInfo[]): DomainTask[] {
    return tasks.map((task) => this.toDomain(task));
  }
}


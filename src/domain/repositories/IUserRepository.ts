/**
 * IUserRepository
 * Repository interface for User entities
 */

import type { User } from "../entities/User";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  update(user: User): Promise<User>;
  updateJiraBaseUrl(userId: string, jiraBaseUrl: string | null): Promise<void>;
}


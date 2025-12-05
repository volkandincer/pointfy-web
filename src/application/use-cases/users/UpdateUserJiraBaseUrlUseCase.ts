/**
 * UpdateUserJiraBaseUrlUseCase
 * Updates a user's Jira base URL
 */

import type { IUserRepository } from "../../../domain/repositories/IUserRepository";

export interface UpdateUserJiraBaseUrlDTO {
  userId: string;
  jiraBaseUrl: string;
}

export class UpdateUserJiraBaseUrlUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: UpdateUserJiraBaseUrlDTO): Promise<string> {
    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error("User ID is required");
    }

    if (!dto.jiraBaseUrl || dto.jiraBaseUrl.trim().length === 0) {
      throw new Error("Jira base URL is required");
    }

    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.updateJiraBaseUrl(dto.jiraBaseUrl);
    await this.userRepository.updateJiraBaseUrl(dto.userId, user.jiraBaseUrl);
    
    return user.jiraBaseUrl || "";
  }
}


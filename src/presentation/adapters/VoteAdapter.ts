/**
 * Vote Adapter
 * Converts between domain entities and presentation layer interfaces
 */

import { Vote as DomainVote } from "../../domain/entities/Vote";
import type { VoteInfo } from "@/interfaces/Voting.interface";

export class VoteAdapter {
  /**
   * Convert domain Vote to presentation VoteInfo interface
   */
  static toPresentation(vote: DomainVote): VoteInfo {
    return {
      user_name: vote.userName,
      user_key: vote.userId,
      point: vote.point,
    };
  }

  /**
   * Convert presentation VoteInfo interface to domain Vote
   * Note: VoteInfo doesn't have all fields, so this is a partial conversion
   */
  static toDomain(voteInfo: VoteInfo, roomId: string, taskId: string): DomainVote {
    // This is a partial conversion - we need roomId and taskId from context
    // In practice, we'd fetch the full vote or create it
    return DomainVote.fromRow({
      id: crypto.randomUUID(), // Temporary ID
      room_id: roomId,
      task_id: taskId,
      user_key: voteInfo.user_key,
      user_name: voteInfo.user_name,
      point: voteInfo.point,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Convert array of domain Votes to presentation VoteInfo[]
   */
  static toPresentationArray(votes: DomainVote[]): VoteInfo[] {
    return votes.map((vote) => this.toPresentation(vote));
  }
}


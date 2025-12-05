/**
 * Dependency Injection Container
 * Simple DI container for managing dependencies
 */

import type { INoteRepository } from "../../domain/repositories/INoteRepository";
import type { IRoomRepository } from "../../domain/repositories/IRoomRepository";
import type { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import type { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import type { IRetroCardRepository } from "../../domain/repositories/IRetroCardRepository";
import type { IRetroActionItemRepository } from "../../domain/repositories/IRetroActionItemRepository";
import type { IVoteRepository } from "../../domain/repositories/IVoteRepository";

import { SupabaseNoteRepository } from "../repositories/SupabaseNoteRepository";
import { SupabaseRoomRepository } from "../repositories/SupabaseRoomRepository";
import { SupabaseTaskRepository } from "../repositories/SupabaseTaskRepository";
import { SupabaseBoardRepository } from "../repositories/SupabaseBoardRepository";
import { SupabaseRetroCardRepository } from "../repositories/SupabaseRetroCardRepository";
import { SupabaseRetroActionItemRepository } from "../repositories/SupabaseRetroActionItemRepository";
import { SupabaseVoteRepository } from "../repositories/SupabaseVoteRepository";

class Container {
  private noteRepository: INoteRepository | null = null;
  private roomRepository: IRoomRepository | null = null;
  private taskRepository: ITaskRepository | null = null;
  private boardRepository: IBoardRepository | null = null;
  private retroCardRepository: IRetroCardRepository | null = null;
  private retroActionItemRepository: IRetroActionItemRepository | null = null;
  private voteRepository: IVoteRepository | null = null;

  // Repositories
  getNoteRepository(): INoteRepository {
    if (!this.noteRepository) {
      this.noteRepository = new SupabaseNoteRepository();
    }
    return this.noteRepository;
  }

  getRoomRepository(): IRoomRepository {
    if (!this.roomRepository) {
      this.roomRepository = new SupabaseRoomRepository();
    }
    return this.roomRepository;
  }

  getTaskRepository(): ITaskRepository {
    if (!this.taskRepository) {
      this.taskRepository = new SupabaseTaskRepository();
    }
    return this.taskRepository;
  }

  getBoardRepository(): IBoardRepository {
    if (!this.boardRepository) {
      this.boardRepository = new SupabaseBoardRepository();
    }
    return this.boardRepository;
  }

  getRetroCardRepository(): IRetroCardRepository {
    if (!this.retroCardRepository) {
      this.retroCardRepository = new SupabaseRetroCardRepository();
    }
    return this.retroCardRepository;
  }

  getRetroActionItemRepository(): IRetroActionItemRepository {
    if (!this.retroActionItemRepository) {
      this.retroActionItemRepository = new SupabaseRetroActionItemRepository();
    }
    return this.retroActionItemRepository;
  }

  getVoteRepository(): IVoteRepository {
    if (!this.voteRepository) {
      this.voteRepository = new SupabaseVoteRepository();
    }
    return this.voteRepository;
  }

  // Reset all instances (useful for testing)
  reset(): void {
    this.noteRepository = null;
    this.roomRepository = null;
    this.taskRepository = null;
    this.boardRepository = null;
    this.retroCardRepository = null;
    this.retroActionItemRepository = null;
    this.voteRepository = null;
  }
}

// Singleton instance
export const container = new Container();


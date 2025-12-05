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
import type { IRoomCustomFlagRepository } from "../../domain/repositories/IRoomCustomFlagRepository";
import type { IContactMessageRepository } from "../../domain/repositories/IContactMessageRepository";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";

import { SupabaseNoteRepository } from "../repositories/SupabaseNoteRepository";
import { SupabaseRoomRepository } from "../repositories/SupabaseRoomRepository";
import { SupabaseTaskRepository } from "../repositories/SupabaseTaskRepository";
import { SupabaseBoardRepository } from "../repositories/SupabaseBoardRepository";
import { SupabaseRetroCardRepository } from "../repositories/SupabaseRetroCardRepository";
import { SupabaseRetroActionItemRepository } from "../repositories/SupabaseRetroActionItemRepository";
import { SupabaseVoteRepository } from "../repositories/SupabaseVoteRepository";
import { SupabaseRoomCustomFlagRepository } from "../repositories/SupabaseRoomCustomFlagRepository";
import { SupabaseContactMessageRepository } from "../repositories/SupabaseContactMessageRepository";
import { SupabaseUserRepository } from "../repositories/SupabaseUserRepository";

class Container {
  private noteRepository: INoteRepository | null = null;
  private roomRepository: IRoomRepository | null = null;
  private taskRepository: ITaskRepository | null = null;
  private boardRepository: IBoardRepository | null = null;
  private retroCardRepository: IRetroCardRepository | null = null;
  private retroActionItemRepository: IRetroActionItemRepository | null = null;
  private voteRepository: IVoteRepository | null = null;
  private roomCustomFlagRepository: IRoomCustomFlagRepository | null = null;
  private contactMessageRepository: IContactMessageRepository | null = null;
  private userRepository: IUserRepository | null = null;

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

  getRoomCustomFlagRepository(): IRoomCustomFlagRepository {
    if (!this.roomCustomFlagRepository) {
      this.roomCustomFlagRepository = new SupabaseRoomCustomFlagRepository();
    }
    return this.roomCustomFlagRepository;
  }

  getContactMessageRepository(): IContactMessageRepository {
    if (!this.contactMessageRepository) {
      this.contactMessageRepository = new SupabaseContactMessageRepository();
    }
    return this.contactMessageRepository;
  }

  getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = new SupabaseUserRepository();
    }
    return this.userRepository;
  }

  reset(): void {
    this.noteRepository = null;
    this.roomRepository = null;
    this.taskRepository = null;
    this.boardRepository = null;
    this.retroCardRepository = null;
    this.retroActionItemRepository = null;
    this.voteRepository = null;
    this.roomCustomFlagRepository = null;
    this.contactMessageRepository = null;
    this.userRepository = null;
  }
}

// Singleton instance
export const container = new Container();


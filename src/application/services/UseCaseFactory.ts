/**
 * Use Case Factory
 * Factory for creating use case instances with dependencies injected
 */

import { container } from "../../infrastructure/di/Container";
import {
  GetNotesUseCase,
  CreateNoteUseCase,
  UpdateNoteUseCase,
  DeleteNoteUseCase,
  CreateRoomUseCase,
  GetRoomUseCase,
  CreateTaskUseCase,
  GetTasksUseCase,
  UpdateTaskUseCase,
  DeleteTaskUseCase,
  GetBoardsUseCase,
  CreateBoardUseCase,
  UpdateBoardUseCase,
  DeleteBoardUseCase,
  ArchiveBoardUseCase,
  UpdateBoardPositionsUseCase,
  CreateRetroCardUseCase,
  GetRetroCardsUseCase,
  RevealRetroCardsUseCase,
  CreateRetroActionItemUseCase,
  GetRetroActionItemsUseCase,
  UpdateRetroActionItemUseCase,
} from "../use-cases";

export class UseCaseFactory {
  // Notes
  static getNotes(): GetNotesUseCase {
    return new GetNotesUseCase(container.getNoteRepository());
  }

  static createNote(): CreateNoteUseCase {
    return new CreateNoteUseCase(container.getNoteRepository());
  }

  static updateNote(): UpdateNoteUseCase {
    return new UpdateNoteUseCase(container.getNoteRepository());
  }

  static deleteNote(): DeleteNoteUseCase {
    return new DeleteNoteUseCase(container.getNoteRepository());
  }

  // Rooms
  static createRoom(): CreateRoomUseCase {
    return new CreateRoomUseCase(container.getRoomRepository());
  }

  static getRoom(): GetRoomUseCase {
    return new GetRoomUseCase(container.getRoomRepository());
  }

  // Tasks
  static createTask(): CreateTaskUseCase {
    return new CreateTaskUseCase(container.getTaskRepository());
  }

  static getTasks(): GetTasksUseCase {
    return new GetTasksUseCase(container.getTaskRepository());
  }

  static updateTask(): UpdateTaskUseCase {
    return new UpdateTaskUseCase(container.getTaskRepository());
  }

  static deleteTask(): DeleteTaskUseCase {
    return new DeleteTaskUseCase(container.getTaskRepository());
  }

  // Boards
  static getBoards(): GetBoardsUseCase {
    return new GetBoardsUseCase(container.getBoardRepository());
  }

  static createBoard(): CreateBoardUseCase {
    return new CreateBoardUseCase(container.getBoardRepository());
  }

  static updateBoard(): UpdateBoardUseCase {
    return new UpdateBoardUseCase(container.getBoardRepository());
  }

  static deleteBoard(): DeleteBoardUseCase {
    return new DeleteBoardUseCase(container.getBoardRepository());
  }

  static archiveBoard(): ArchiveBoardUseCase {
    return new ArchiveBoardUseCase(container.getBoardRepository());
  }

  static updateBoardPositions(): UpdateBoardPositionsUseCase {
    return new UpdateBoardPositionsUseCase(container.getBoardRepository());
  }

  // Retro Cards
  static createRetroCard(): CreateRetroCardUseCase {
    return new CreateRetroCardUseCase(container.getRetroCardRepository());
  }

  static getRetroCards(): GetRetroCardsUseCase {
    return new GetRetroCardsUseCase(container.getRetroCardRepository());
  }

  static revealRetroCards(): RevealRetroCardsUseCase {
    return new RevealRetroCardsUseCase(container.getRetroCardRepository());
  }

  // Retro Action Items
  static createRetroActionItem(): CreateRetroActionItemUseCase {
    return new CreateRetroActionItemUseCase(container.getRetroActionItemRepository());
  }

  static getRetroActionItems(): GetRetroActionItemsUseCase {
    return new GetRetroActionItemsUseCase(container.getRetroActionItemRepository());
  }

  static updateRetroActionItem(): UpdateRetroActionItemUseCase {
    return new UpdateRetroActionItemUseCase(container.getRetroActionItemRepository());
  }
}


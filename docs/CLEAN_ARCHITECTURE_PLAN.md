# Clean Architecture Refactoring Plan

## 🎯 Amaç
Projeyi Clean Architecture prensiplerine göre yeniden organize etmek ve katmanları ayırmak.

## 📐 Katman Yapısı

```
src/
├── domain/                    # Domain Layer (Business Logic)
│   ├── entities/             # Domain Entities
│   │   ├── Room.ts
│   │   ├── Task.ts
│   │   ├── Note.ts
│   │   ├── Board.ts
│   │   ├── RetroCard.ts
│   │   └── Vote.ts
│   ├── value-objects/        # Value Objects
│   │   ├── RoomCode.ts
│   │   ├── UserId.ts
│   │   └── TaskStatus.ts
│   └── repositories/         # Repository Interfaces (Abstractions)
│       ├── IRoomRepository.ts
│       ├── ITaskRepository.ts
│       ├── INoteRepository.ts
│       └── IBoardRepository.ts
│
├── application/              # Application Layer (Use Cases)
│   ├── use-cases/           # Use Cases
│   │   ├── rooms/
│   │   │   ├── CreateRoomUseCase.ts
│   │   │   ├── JoinRoomUseCase.ts
│   │   │   └── GetRoomUseCase.ts
│   │   ├── tasks/
│   │   │   ├── CreateTaskUseCase.ts
│   │   │   ├── UpdateTaskUseCase.ts
│   │   │   └── GetTasksUseCase.ts
│   │   ├── notes/
│   │   │   ├── CreateNoteUseCase.ts
│   │   │   ├── UpdateNoteUseCase.ts
│   │   │   └── GetNotesUseCase.ts
│   │   └── retro/
│   │       ├── CreateRetroCardUseCase.ts
│   │       └── RevealRetroCardsUseCase.ts
│   ├── services/            # Application Services
│   │   ├── RoomService.ts
│   │   ├── TaskService.ts
│   │   └── NoteService.ts
│   └── dto/                 # Data Transfer Objects
│       ├── CreateRoomDTO.ts
│       ├── CreateTaskDTO.ts
│       └── CreateNoteDTO.ts
│
├── infrastructure/          # Infrastructure Layer (External Concerns)
│   ├── repositories/        # Repository Implementations
│   │   ├── SupabaseRoomRepository.ts
│   │   ├── SupabaseTaskRepository.ts
│   │   ├── SupabaseNoteRepository.ts
│   │   └── SupabaseBoardRepository.ts
│   ├── database/           # Database Abstractions
│   │   ├── SupabaseClient.ts
│   │   └── IDatabaseClient.ts
│   └── external/           # External Services
│       ├── JiraService.ts
│       └── IJiraService.ts
│
└── presentation/           # Presentation Layer (UI)
    ├── components/         # UI Components (mevcut)
    ├── hooks/             # Presentation Hooks (UI state only)
    └── pages/             # Next.js Pages (mevcut)
```

## 🔄 Dependency Flow

```
Presentation → Application → Domain
     ↓              ↓
Infrastructure ← Infrastructure
```

**Kurallar:**
- Presentation Layer sadece Application Layer'a bağımlı
- Application Layer sadece Domain Layer'a bağımlı
- Infrastructure Layer hem Domain hem Application'a bağımlı
- Domain Layer hiçbir katmana bağımlı değil (pure business logic)

## 📋 Refactoring Adımları

### Phase 1: Domain Layer Setup
1. ✅ Domain entities oluştur
2. ✅ Value objects oluştur
3. ✅ Repository interfaces tanımla

### Phase 2: Infrastructure Layer Setup
1. ✅ Database client abstraction
2. ✅ Repository implementations (Supabase)
3. ✅ External services abstraction

### Phase 3: Application Layer Setup
1. ✅ Use cases oluştur
2. ✅ DTOs tanımla
3. ✅ Application services

### Phase 4: Presentation Layer Refactoring
1. ✅ Hooks'ları refactor et (sadece UI state)
2. ✅ Components'leri güncelle (use cases kullan)
3. ✅ API routes'ları güncelle (use cases kullan)

### Phase 5: Dependency Injection
1. ✅ DI container setup
2. ✅ Service locator pattern

## 🎨 Örnek: Note Entity Refactoring

### Önce (Mevcut):
```typescript
// hooks/useNotes.ts
export function useNotes() {
  const supabase = getSupabase();
  const { data } = await supabase.from("notes").select("*");
  // Business logic mixed with data access
}
```

### Sonra (Clean Architecture):
```typescript
// domain/entities/Note.ts
export class Note {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public content: string,
    public category: string,
    // ...
  ) {}
}

// domain/repositories/INoteRepository.ts
export interface INoteRepository {
  findById(id: string): Promise<Note | null>;
  findByUserId(userId: string): Promise<Note[]>;
  create(note: Note): Promise<Note>;
  update(note: Note): Promise<Note>;
  delete(id: string): Promise<void>;
}

// application/use-cases/notes/GetNotesUseCase.ts
export class GetNotesUseCase {
  constructor(private noteRepository: INoteRepository) {}
  
  async execute(userId: string): Promise<Note[]> {
    return this.noteRepository.findByUserId(userId);
  }
}

// infrastructure/repositories/SupabaseNoteRepository.ts
export class SupabaseNoteRepository implements INoteRepository {
  constructor(private supabase: SupabaseClient) {}
  
  async findByUserId(userId: string): Promise<Note[]> {
    const { data } = await this.supabase
      .from("notes")
      .select("*")
      .eq("user_key", userId);
    return data.map(row => Note.fromRow(row));
  }
}

// presentation/hooks/useNotes.ts
export function useNotes() {
  const getNotesUseCase = useGetNotesUseCase();
  const [notes, setNotes] = useState<Note[]>([]);
  
  useEffect(() => {
    getNotesUseCase.execute(userId).then(setNotes);
  }, [userId]);
  
  return { notes };
}
```

## ✅ Başarı Kriterleri

1. ✅ Domain layer hiçbir external dependency içermez
2. ✅ Business logic use cases içinde
3. ✅ Data access repository pattern ile
4. ✅ Presentation layer sadece UI concerns
5. ✅ Test edilebilir yapı (mock'lanabilir)
6. ✅ Dependency injection ile loose coupling


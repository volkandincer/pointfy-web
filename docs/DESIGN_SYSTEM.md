# Design System - Pointfy Web

Bu dokümantasyon, Jira modülünde uygulanan modern tasarım dilinin projenin geneline uygulanması için rehber niteliğindedir.

## Tasarım Prensipleri

### 1. Icon System
- **Lucide React** kullanılmalı (emoji yerine)
- Tüm icon'lar SVG formatında, tutarlı boyutlarda
- Hover ve active state'ler için transition'lar

### 2. Color Scheme
- **Status Colors**: `lib/jira/colors.ts` utility fonksiyonları kullanılmalı
- **Priority Colors**: `getPriorityColorClasses()` kullanılmalı
- Dark mode desteği her zaman olmalı

### 3. Card Design
- **Gradient backgrounds**: `bg-gradient-to-br from-{color}-50 via-white to-white`
- **Hover effects**: `hover:scale-[1.02]`, `hover:shadow-xl`
- **Border**: `border border-{color}-200/50 dark:border-{color}-800/50`
- **Rounded corners**: `rounded-2xl` veya `rounded-xl`
- **Glow effects**: Gradient blur circles arka planda

### 4. Stats Cards
```tsx
<div className="group relative overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/70 hover:shadow-xl dark:border-blue-800/50 dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-blue-700/70">
  <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-blue-400/20 to-blue-600/20 blur-2xl transition-all group-hover:scale-150" />
  <div className="relative mb-4 flex items-center justify-between">
    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/40">
      <Icon className="h-7 w-7" />
    </div>
  </div>
</div>
```

### 5. Filter UI
- **FilterDropdown**: `components/jira/FilterDropdown.tsx` kullanılmalı
- **FilterChip**: `components/jira/FilterChip.tsx` kullanılmalı
- Native `<select>` elementleri kullanılmamalı

### 6. Empty States
- **EmptyState**: `components/jira/EmptyState.tsx` kullanılmalı
- Icon, title, description ve optional action button içermeli

### 7. Typography
- **Headings**: `text-3xl font-bold` (h1), `text-2xl font-semibold` (h2)
- **Body**: `text-sm` veya `text-base`
- **Labels**: `text-xs font-medium text-gray-500`

### 8. Buttons
- **Primary**: `bg-blue-600 hover:bg-blue-700 text-white`
- **Secondary**: `border border-gray-300 bg-white hover:bg-gray-50`
- **Rounded**: `rounded-lg` veya `rounded-xl`
- **Padding**: `px-4 py-2` veya `px-6 py-3`

### 9. Mobile Navigation
- Fixed bottom navigation bar (mobile için)
- Horizontal scroll tab bar yerine bottom nav tercih edilmeli

### 10. Responsive Design
- Mobile-first yaklaşım
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Grid layouts: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

## Uygulama Planı

### Faz 1: Jira Modülü Eksikleri (Tamamlandı)
- [x] JiraIssueModal modernize edildi
- [ ] JiraTaskSelector modernize edilmeli
- [ ] JiraStoryPointModal modernize edilmeli

### Faz 2: Boards Modülü
- [ ] Board list cards modernize edilmeli
- [ ] Board detail page modernize edilmeli
- [ ] Stats cards eklenmeli
- [ ] Filter UI eklenmeli (varsa)

### Faz 3: Rooms Modülü
- [ ] Room list modernize edilmeli
- [ ] Room detail page modernize edilmeli
- [ ] Stats cards eklenmeli

### Faz 4: Tasks Modülü
- [ ] Task list modernize edilmeli
- [ ] Task cards modernize edilmeli
- [ ] Filter UI eklenmeli

### Faz 5: Notes Modülü
- [ ] Note list modernize edilmeli
- [ ] Note cards modernize edilmeli

### Faz 6: Account Sayfası
- [ ] Account settings modernize edilmeli
- [ ] Profile cards modernize edilmeli

## Reusable Components

### Mevcut Components
- `components/jira/FilterDropdown.tsx`
- `components/jira/FilterChip.tsx`
- `components/jira/EmptyState.tsx`
- `components/jira/JqlInput.tsx`

### Oluşturulması Gereken Components
- `components/ui/StatsCard.tsx` (genel kullanım için)
- `components/ui/ModernCard.tsx` (genel kullanım için)
- `components/ui/IconBadge.tsx` (genel kullanım için)

## Color Utilities

### Status Colors
```typescript
import { getStatusColorClasses, getStatusColorClassesGradient } from "@/lib/jira/colors";

// Badge için
className={getStatusColorClasses(statusColor)}

// Gradient card için
className={getStatusColorClassesGradient(statusColor)}
```

### Priority Colors
```typescript
import { getPriorityColorClasses } from "@/lib/jira/colors";

className={getPriorityColorClasses(priority)}
```

## Örnekler

### Modern Card Example
```tsx
<div className="group relative overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/70 hover:shadow-xl dark:border-blue-800/50 dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900">
  {/* Content */}
</div>
```

### Stats Card Example
```tsx
<Link
  href="/path"
  className="group relative overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/70 hover:shadow-xl dark:border-blue-800/50 dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-blue-700/70"
>
  <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-blue-400/20 to-blue-600/20 blur-2xl transition-all group-hover:scale-150" />
  <div className="relative mb-4 flex items-center justify-between">
    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/40">
      <Icon className="h-7 w-7" />
    </div>
    <ChevronRight className="h-5 w-5 text-blue-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
  </div>
  <div className="relative">
    <div className="text-3xl font-bold text-gray-900 dark:text-white">{count}</div>
    <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
  </div>
</Link>
```

## Notlar

- Tüm component'ler dark mode desteklemeli
- Responsive design her zaman öncelikli
- Accessibility (a11y) standartlarına uyulmalı
- Performance için `React.memo`, `useMemo`, `useCallback` kullanılmalı


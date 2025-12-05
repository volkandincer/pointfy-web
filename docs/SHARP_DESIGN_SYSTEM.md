# Sharp Design System - Keskin Hatlı Tasarım Dili

## 🎯 Tasarım Prensipleri

### 1. Keskin Hatlar
- **Border Radius:** `rounded-md` (6px) veya `rounded-lg` (8px) - `rounded-2xl` yerine
- **Köşeler:** Keskin, minimal yuvarlatma
- **Geometric Shapes:** Daha geometric, clean formlar

### 2. Flat Colors
- **Gradient'ler:** Sadece özel durumlarda (hover states)
- **Solid Colors:** Ana renkler solid
- **Background:** Flat white/gray, gradient overlay'ler minimal

### 3. Keskin Border'lar
- **Border Width:** `border` (1px) veya `border-2` (2px)
- **Border Style:** Solid, keskin
- **Border Color:** High contrast, belirgin

### 4. Minimal Shadow
- **Shadow:** `shadow-sm` veya `shadow` - `shadow-xl` yerine
- **Hover Shadow:** `hover:shadow-md` - minimal artış
- **Glow Effects:** Yok veya minimal

### 5. Clean Typography
- **Font Weight:** `font-semibold` veya `font-bold` - belirgin
- **Letter Spacing:** Normal veya tight
- **Line Height:** Compact, efficient

### 6. Geometric Layout
- **Spacing:** Consistent, grid-based
- **Alignment:** Strict, geometric
- **White Space:** Generous ama organized

## 📐 Design Tokens

### Border Radius
```css
rounded-none    /* 0px - keskin köşeler */
rounded-sm      /* 2px - minimal */
rounded-md      /* 6px - standart */
rounded-lg      /* 8px - maksimum */
```

### Borders
```css
border          /* 1px solid */
border-2        /* 2px solid */
border-4        /* 4px solid - accent için */
```

### Shadows
```css
shadow-sm       /* Minimal shadow */
shadow          /* Standart shadow */
shadow-md       /* Hover için */
```

### Colors (Flat)
```css
bg-white        /* Pure white */
bg-gray-50      /* Light gray */
bg-gray-100     /* Medium gray */
bg-gray-900     /* Dark gray */
```

## 🎨 Card Design Pattern

### Basic Card
```tsx
<div className="border border-gray-300 bg-white p-6 shadow-sm hover:border-gray-400 hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-900">
  {/* Content */}
</div>
```

### Card with Accent Border
```tsx
<div className="border-l-4 border-blue-600 border-r border-t border-b border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-900">
  {/* Content */}
</div>
```

### Priority Indicator (Sharp)
```tsx
{/* Top Border - Keskin */}
<div className="absolute left-0 top-0 h-1 w-full bg-red-600" />

{/* Left Border - Keskin */}
<div className="absolute left-0 top-0 h-full w-1 bg-blue-600" />
```

## 🔲 Button Design

### Primary Button (Sharp)
```tsx
<button className="border-2 border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 hover:border-blue-700 transition-colors">
  Button
</button>
```

### Secondary Button (Sharp)
```tsx
<button className="border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 hover:border-gray-400 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-white">
  Button
</button>
```

## 📊 Stats Card (Sharp)

```tsx
<div className="border border-gray-300 bg-white p-6 shadow-sm hover:border-gray-400 hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-900">
  <div className="mb-4 flex items-center gap-3">
    <div className="flex h-12 w-12 items-center justify-center border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20">
      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">42</div>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Label</div>
    </div>
  </div>
</div>
```

## 🎯 Örnekler

### Linear App Style
- Keskin köşeler
- Flat colors
- Minimal shadows
- Geometric layout

### GitHub Style
- Clean borders
- Flat backgrounds
- Sharp corners
- High contrast

### Notion (Minimal)
- Clean lines
- Flat design
- Generous spacing
- Sharp edges

## ✅ Uygulama Checklist

- [ ] Tüm `rounded-2xl` → `rounded-md` veya `rounded-lg`
- [ ] Gradient backgrounds → Flat colors
- [ ] `shadow-xl` → `shadow-sm` veya `shadow`
- [ ] `hover:-translate-y-1` → `hover:shadow-md` (translate yerine)
- [ ] Border'lar keskin ve belirgin
- [ ] Geometric, clean layout
- [ ] High contrast colors
- [ ] Minimal animations


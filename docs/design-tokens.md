# Design Tokens & Tailwind Configuration

## Overview
This document describes the design token system and Tailwind CSS configuration for the Science of Revolution web app. The system is designed to meet WCAG 2.1 AA accessibility standards and support multiple themes.

## Theme Support
The app supports three themes:
- **Light** (default)
- **Dark**
- **Sepia** (reading-friendly)

Themes are applied via class names on the root HTML element:
```html
<html class="dark">  <!-- Dark theme -->
<html class="sepia"> <!-- Sepia theme -->
```

## Color System

### Brand Colors
```typescript
primary: {
  DEFAULT: '#b91c1c',  // Main brand color (red-700)
  foreground: '#ffffff', // Text on primary
  hover: '#991b1b',     // Hover state
  light: '#dc2626'      // Light variant
}

accent: {
  DEFAULT: '#f97316',   // Accent color (orange-500)
  foreground: '#ffffff',
  hover: '#ea580c',
  light: '#fb923c'
}
```

### Semantic Colors
```typescript
success: { DEFAULT: '#16a34a', foreground: '#ffffff' }
warning: { DEFAULT: '#f59e0b', foreground: '#000000' }
error: { DEFAULT: '#dc2626', foreground: '#ffffff' }
```

### Surface Colors
All surface colors are theme-aware:
```typescript
background: {
  DEFAULT: '#ffffff',  // Light theme
  dark: '#0f172a',     // Dark theme
  sepia: '#f5f3ed'     // Sepia theme
}

surface: {
  DEFAULT: '#f8fafc',
  dark: '#1e293b',
  sepia: '#e8e5da'
}

border: {
  DEFAULT: '#e2e8f0',
  dark: '#334155',
  sepia: '#d4cdb8'
}

foreground: {
  DEFAULT: '#0f172a',
  muted: '#64748b',
  dark: '#f8fafc',
  'dark-muted': '#94a3b8',
  sepia: '#3e3522',
  'sepia-muted': '#6b6149'
}
```

## Typography

### Font Families
```typescript
sans: ['Inter', 'system-ui', ...] // UI elements
serif: ['Crimson Pro', 'Georgia', ...] // Reading content
mono: ['JetBrains Mono', 'Menlo', ...] // Code
```

### Font Sizes
Standard scale with optimized line heights:
- `text-xs` through `text-5xl` for UI
- `text-reader-{sm|base|lg|xl}` for reading content (optimized line-height)

### Reading-Optimized Sizes
```css
text-reader-sm: 1rem / 1.6   (16px / 25.6px)
text-reader-base: 1.125rem / 1.8  (18px / 32.4px)
text-reader-lg: 1.25rem / 2    (20px / 40px)
text-reader-xl: 1.5rem / 2.4   (24px / 57.6px)
```

## Spacing
Uses Tailwind's default spacing scale with additions:
- `18` (4.5rem / 72px)
- `88` (22rem / 352px)
- `128` (32rem / 512px)

## Components

### Buttons
```html
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
```

### Inputs
```html
<input class="input" type="text" placeholder="Enter text..." />
```

### Cards
```html
<div class="card">
  Card content
</div>
```

### Reader
```html
<div class="reader-container">
  <article class="reader-content">
    Reading content here...
  </article>
</div>
```

## Accessibility Features

### Focus Indicators
All interactive elements have visible focus indicators meeting WCAG 2.1 AA:
```css
*:focus-visible {
  outline: none;
  ring: 2px solid primary;
  ring-offset: 2px;
}
```

### Screen Reader Support
Use `sr-only` utility for screen-reader-only content:
```html
<span class="sr-only">Descriptive text for screen readers</span>
```

### Color Contrast
All color combinations meet WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text).

## Animations
Subtle, performance-optimized animations:
```typescript
animate-fade-in: // 0.2s fade in
animate-slide-up: // 0.3s slide up with fade
```

## Z-Index Scale
Consistent layering system:
```typescript
modal: 50
popover: 40
overlay: 30
dropdown: 20
sticky: 10
```

## Best Practices

### Using Theme Colors
Always use semantic color tokens rather than hard-coded values:
```html
<!-- Good -->
<div class="bg-surface text-foreground">

<!-- Bad -->
<div class="bg-white text-black">
```

### Responsive Design
Use mobile-first approach:
```html
<div class="text-base md:text-lg lg:text-xl">
  Responsive text
</div>
```

### Dark Mode Support
Test all components in all themes:
```tsx
// Toggle theme
document.documentElement.classList.toggle('dark')
document.documentElement.classList.toggle('sepia')
```

## Programmatic Token Access

The design system now includes programmatic access to tokens via `src/styles/tokens.ts`. This allows you to use design tokens directly in TypeScript/JavaScript code:

### Importing Tokens

```typescript
import {
  colors,
  spacing,
  borderRadius,
  zIndex,
  getColor,
  getSpacing,
  getBorderRadius,
  getZIndex,
  type SpacingKey,
  type BorderRadiusKey
} from '@/styles/tokens'
```

### Using Helper Functions

```typescript
// Get color by path
const primaryColor = getColor('primary.DEFAULT') // '#b91c1c'
const darkBg = getColor('background.dark') // '#0f172a'

// Get spacing value
const padding = getSpacing(4) // '1rem'
const customSpacing = getSpacing(18) // '4.5rem'

// Get border radius
const radius = getBorderRadius('md') // '0.5rem'

// Get z-index
const modalZ = getZIndex('modal') // '50'
```

### Type Safety

All token helpers are fully typed:

```typescript
import type { SpacingKey, BorderRadiusKey } from '@/styles/tokens'

const spacing: SpacingKey = 4 // ✓ Valid
const spacing: SpacingKey = 999 // ✗ TypeScript error

const radius: BorderRadiusKey = 'lg' // ✓ Valid
const radius: BorderRadiusKey = 'huge' // ✗ TypeScript error
```

### Direct Access

You can also access tokens directly:

```typescript
import { colors, spacing } from '@/styles/tokens'

const styles = {
  backgroundColor: colors.primary.DEFAULT,
  padding: spacing[4],
}
```

### Testing

Comprehensive unit tests are available in `src/styles/__tests__/tokens.test.ts`. Run them with:

```bash
npm test -- src/styles/__tests__/tokens.test.ts
```

## Customization
To add new tokens:

1. **Update `src/styles/tokens.ts`** with new token definitions
2. **Export from Tailwind config** (if needed for utility classes)
3. **Add tests** in `src/styles/__tests__/tokens.test.ts`
4. **Update this documentation**

Always maintain WCAG AA contrast ratios and test across all themes.

## Resources
- **Token definitions**: `src/styles/tokens.ts`
- **Tailwind integration**: `tailwind.config.ts`
- **Tests**: `src/styles/__tests__/tokens.test.ts`
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

# Palette Bridge

Maps Tailwind CSS color palettes to Material Design 3 color roles with contrast level support, live preview, and multi-format export.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # Type-check + production build
npm run lint      # ESLint
npx vitest run    # Run all tests
npx vitest run src/lib/__tests__/palette.test.ts  # Single test file
```

## Architecture

```
src/
├── components/    # React presentational components (props drilling, no context)
├── lib/           # Pure business logic: color math, exports, palette utils
│   └── __tests__/ # Unit tests (vitest)
├── hooks/         # useThemeMapping: useReducer + localStorage persistence
├── data/          # Static data: M3 role definitions, sample palette, contrast shifts
├── types/         # Shared TypeScript types (AppState, AppAction, etc.)
├── App.tsx        # Root layout, composes all components
└── main.tsx       # Entry point
```

### State management

Single `useReducer` in `useThemeMapping` hook. State persisted to localStorage key `'palette-bridge-state'`. Immutable updates via `structuredClone()`. Actions: `SET_PALETTE_CONFIG`, `SET_ROLE_ASSIGNMENT`, `SET_CONTRAST_LEVEL`, `SET_THEME_MODE`, `RESET_CONTRAST_TO_DEFAULTS`, `TOGGLE_INTERPOLATION`, `LOAD_STATE`.

### Color pipeline

Hex (sRGB) → OKLCH interpolation for shade generation → WCAG contrast ratios for accessibility badges. All color math in `src/lib/`.

## Stack

- TypeScript 5.9 (strict), React 19, Vite 7, Tailwind CSS 4
- Vitest for tests, ESLint 9 flat config
- shadcn/ui (Radix primitives, tailwind-merge, clsx, class-variance-authority) for accessible UI components

## Conventions

- **Styling**: Tailwind utility classes; `style={{ backgroundColor: hex }}` for dynamic colors
- **Components**: Functional, hooks-based, props drilling (no context/redux)
- **Naming**: PascalCase components/types, camelCase functions/vars, SCREAMING_SNAKE_CASE constants
- **Tests**: Co-located in `__tests__/` dirs, test pure logic in `src/lib/`
- **Exports**: Each format in its own `export-*.ts` file with corresponding test
- **TypeScript**: Strict mode, no unused locals/params, no implicit any
- **Git**: Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)

## Domain context

- **M3 roles**: 66 Material Design 3 semantic color roles across 6 families (primary, secondary, tertiary, error, surface, other)
- **Contrast levels**: Standard, Medium, High — each with independent shade mappings
- **Theme modes**: Light and Dark with separate role assignments
- **Export formats**: Kotlin (Color.kt + Theme.kt), Material JSON, Tokens Studio (DTCG), CSS custom properties

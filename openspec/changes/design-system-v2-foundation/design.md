# Design: Design system v2 — foundation (tokens and fonts)

**Change:** design-system-v2-foundation
**Date:** 2026-11-20

## Technical Approach

`tokens.css` (in `.docs/design/system/`) is the design source of truth. The code gets a typed copy of its **semantic layer** in a new `packages/ui/src/tokens/semantic.ts`, with one object for light and one for dark. Everything else derives from it:

```
.docs/design/system/tokens.css  (design source, not imported)
        │  values copied once; checked by script (task 7.3)
        ▼
tokens/semantic.ts  ──►  theme.ts (lightTheme / darkTheme, AppTheme)  ──►  mobile (useAppTheme)
        │                                                              
        └──────────────►  cssVariables.ts (--color-* + v1 aliases)    ──►  web (CSS)
```

The raw scales stay in `tokens.ts` (`colors`, `palette`). `semantic.ts` holds the same literal values as `tokens.css` (same keys, without the `--color-` prefix), so the check script can compare them one to one. Dark mode starts from the light values and overrides only what `tokens.css` overrides.

## Architecture Decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Where v2 values live in code | (a) Edit `theme.ts` values in place · (b) New `semantic.ts`, theme and CSS derive from it · (c) Import `tokens.json` at runtime | **(b)** | One place to compare with `tokens.css`; web and mobile cannot diverge. (c) adds JSON import and path coupling to `.docs/` |
| Theme shape | Rename keys to v2 names · Keep v1 keys and add v2 keys | **Keep and add** | 158 files use the theme (`useAppTheme`, `AppTheme`, `lightTheme`/`darkTheme`); renaming is churn with no visual gain. v2 names (`brand.edge`, `text.onMuted`, `motivation.*`) are added next to them |
| Web variables | Switch CSS to `--color-*` now · Emit both, migrate later | **Emit both** | Web screens are redone in Phase 4. Only `--brand-500` fills and text change now, because they fail contrast |
| `palette.brand[500]` uses | Change `palette.brand` to start at 600 · Fix each use by role | **By role** | Shifting the scale would silently move borders, tints and focus rings. Fills → solid, text → text, focus → focus |
| Static styles (`StyleSheet.create` at module level) | Convert to theme hooks now · Use the matching scale step | **Scale step** (`palette.brand[600]` / `[700]`) | Converting to hooks is part of the component rewrite (Phase 0, part 2). Note: these spots do not follow dark mode yet, same as today |
| Native font weights | `fontWeight` + one family · One family name per weight | **Family per weight** via `nativeFont(role, weight)` | Android does not pick a weight file from `fontWeight` for custom fonts |
| Font packages (mobile) | Bundle `.ttf` in assets · `@expo-google-fonts/*` | **`@expo-google-fonts/nunito` + `/inter`** | Versioned, no binary files in the repo, standard Expo path (`npx expo install`) |
| Font loading gate | Splash screen API · Existing `isHydrated` loading view | **Existing view** | Already there; one condition more. No new dependency |
| Check-ins vs notifications | Keep `notification` = emerald · Split | **Split** | v2: notifications use the brand color, wellbeing/check-ins use emerald. Check-in consumers move to `wellbeing` first |

## Token Mapping (light / dark)

Values come from `tokens.css`. The light column names the scale step where one exists.

| `semantic.ts` key | Light | Dark |
|---|---|---|
| `brand.solid` | primary 600 `#2563EB` | `#3B82F6` |
| `brand.edge` | primary 800 `#1E40AF` | `#1D4ED8` |
| `brand.tint` / `tintBorder` | primary 50 / 200 | `rgba(59,130,246,.14)` / `.3` |
| `brand.text` | primary 700 `#1D4ED8` | `#93C5FD` |
| `brand.focus` | primary 500 `#3B82F6` | `#60A5FA` |
| `bg` / `surface` / `surfaceMuted` | `#F6F8FC` / white / slate 100 | `#0C1222` / slate 800 / slate 900 |
| `border` | slate 200 | slate 700 |
| `text.primary` / `secondary` / `muted` / `onMuted` / `onSolid` | slate 900 / gray 500 / slate 500 / slate 600 / white | slate 50 / slate 400 / slate 400 / slate 300 / white |
| `success` bg / fg / solid / edge | green 50 / 700 / 700 / 800 | `rgba(34,197,94,.12)` / `#4ADE80` / green 700 / 800 |
| `warning` bg / fg | amber 50 / 700 | `rgba(245,158,11,.12)` / `#FBBF24` |
| `danger` bg / fg / solid / edge | red 50 / 700 / 600 / 800 | `rgba(239,68,68,.12)` / `#F87171` / red 600 / 800 |
| `info` bg / fg | sky 50 / 700 | `rgba(14,165,233,.12)` / `#7DD3FC` |
| Feature accents (bg / fg) | scale 50 / 700: mission & notification = primary, medication = amber, calendar = pink, document = sky, backpack = teal, ai & treatment = violet, wellbeing = emerald | `rgba(...,.12)` / scale 300 (as in `tokens.css`) |
| `motivation` | streak orange 500 · streakBg orange 50 · streakBorder orange 200 · streakText/streakSolid orange 700 · streakEdge orange 800 · level amber 500 · levelEdge amber 700 · progress green 500 · track slate 200 | streakBg `rgba(249,115,22,.12)` · streakBorder `.35` · streakText `#FB923C` · track slate 700 |

The exact strings are copied from `tokens.css` during implementation and checked with a script (task 7.3).

`AppTheme` keeps its v1 keys and maps them onto the v2 values:
- `brand.solid` → `brand.solid`;
- `brand.tintText` → `brand.text`;
- `brand.fg` → `brand.solid` (light) / `#60A5FA` (dark);
- `status.errorFg` → `danger.fg`;
- `accent.docFg` → `document.fg`;
- and so on.

New keys:

```ts
brand:   { …v1, edge: string; focus: string; text: string };
surface: { …v1, muted: string };
text:    { …v1, onMuted: string; onSolid: string };
status:  { …v1, infoBg: string; infoFg: string;
           successSolid: string; successEdge: string;
           dangerSolid: string; dangerEdge: string };
accent:  { …v1, wellbeingBg: string; wellbeingFg: string;
           missionBg: string; missionFg: string;
           treatmentBg: string; treatmentFg: string };
motivation: { streak, streakBg, streakBorder, streakText, streakSolid,
              streakEdge, level, levelEdge, progress, track };
```

## Fonts

```ts
// tokens.ts
export const fontFamily = {
  inherit: 'inherit',
  sans:    'var(--font-inter), Inter, system-ui, sans-serif',   // body (v1 name kept)
  body:    'var(--font-inter), Inter, system-ui, sans-serif',
  heading: 'var(--font-nunito), Nunito, system-ui, sans-serif',
  mono:    'JetBrains Mono, Menlo, monospace',
} as const;

export const nativeFontFamily = {
  sans: 'Inter_400Regular', // v1 key kept
  mono: 'JetBrainsMono',
  body:    { 400: 'Inter_400Regular', 500: 'Inter_500Medium', 600: 'Inter_600SemiBold' },
  heading: { 700: 'Nunito_700Bold', 800: 'Nunito_800ExtraBold', 900: 'Nunito_900Black' },
} as const;

export function nativeFont(role: 'body' | 'heading', weight: number): string
// picks the closest loaded weight for the role
```

- **Mobile:** `App.tsx` calls `useFonts({ Inter_400Regular, …, Nunito_900Black })`. The existing loading view stays until `isHydrated && (fontsLoaded || fontError)`.
- **Web:** `layout.tsx` loads `Inter({ weight: ['400','500','600'], variable: '--font-inter' })` and `Nunito({ weight: ['700','800','900'], variable: '--font-nunito' })` and puts both classes on `<html>`. `globals.css` already uses `var(--font-sans)` on `body`.

## File Changes

| File | Change |
|---|---|
| `packages/ui/src/tokens/tokens.ts` | Scales (`teal`; missing steps), `palette.accent` remap and new keys, `palette.motivation`, `radii` additions, `fontFamily` / `fontWeight` / `nativeFontFamily`, `nativeFont()` |
| `packages/ui/src/tokens/semantic.ts` | **New.** `semanticLight` / `semanticDark` copied from `tokens.css` |
| `packages/ui/src/tokens/theme.ts` | `lightTheme` / `darkTheme` from `semantic.ts`; `AppTheme` additions |
| `packages/ui/src/tokens/cssVariables.ts` | `--color-*`, `--font-heading` / `--font-body`, v2 radii; v1 aliases from the new theme |
| `packages/ui/src/index.ts`, `web.ts` | Export `semantic` and `nativeFont` |
| `packages/ui/src/primitives/{Button,Chip,Spinner,Pagination}/*`, `forms/{Checkbox,TextField,Select,DatePicker,TimePicker,DateTimePicker}/*.native.tsx`, `Checkbox.web.tsx` | `brand[500]` by role |
| `packages/ui/src/primitives/Typography/Typography.native.tsx` | `nativeFont()` per variant |
| `packages/ui/src/platform/HeluAgendaCalendar/{EventBlock,MonthGridView}.tsx` | Check-in color → `accent.wellbeing*` |
| `apps/mobile/App.tsx` | `useFonts` + loading gate; spinner color |
| `apps/mobile/package.json` | `expo-font`, `@expo-google-fonts/nunito`, `@expo-google-fonts/inter` |
| `apps/mobile/src/**` (≈ 14 files) | `brand[500]` by role; check-in uses → `wellbeing`; `MedicationCard` intake → `status.successSolid`; hex literals; voseo |
| `apps/web/src/app/layout.tsx` | `next/font` Nunito + Inter |
| `apps/web/src/**/*.css` | `background` / `color` with `--brand-500` → `--color-brand-solid` / `--color-brand-text` |
| `.docs/architecture/adr/0002-adopt-design-system-b.md`, `.docs/architecture/design-system.md` | Mark tokens, theme and fonts as done |

## Testing Strategy

There is no test runner (`openspec/config.yaml`). Verification:

1. `pnpm exec tsc --noEmit -p apps/mobile` and `pnpm --filter @helu/web build`.
2. **Token check script** (task 7.3, kept in `packages/ui/scripts/`). Two checks:
   - it parses `tokens.css` and the `semantic.ts` values (through `tsx` if available, otherwise a JSON dump);
   - it lists every `var(--…)` used in `apps/web/src` that is not emitted.
3. **Contrast spot check** of white on solid and the fg/bg pairs of status, accents and on-muted, with the same formula used in the design audit.
4. **Visual check:**
   - web login and main pages in the browser, in light and dark;
   - mobile in the iOS simulator if available: Inicio, Agenda, Documentos, Mochilas, login.
5. **Grep gate:** no `palette.brand[500]` as `backgroundColor`, `background` or `color` in `apps/` and `packages/ui/src` (focus borders allowed).

## Migration / Rollout

Single PR to `dev`, with work-unit commits (see `tasks.md`). There are no data or API changes, so rollback is a revert.

## Open Questions

- **Dark mode screen review:** there are no dark mockups, so it is checked only for legibility.
- **When screens adopt Nunito:** they do it as they move to `Typography` and the new components (Phase 0, part 2, and later phases).

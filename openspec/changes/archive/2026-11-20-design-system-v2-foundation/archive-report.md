# Archive Report: design-system-v2-foundation

**Change:** design-system-v2-foundation
**Archived:** 2026-11-20
**Archive location:** `openspec/changes/archive/2026-11-20-design-system-v2-foundation/`
**Issue / PR:** JIADevs/FrontendHealthGuard#35 (Phase 0, part 1) · PR #36, merged into `dev` as `b8f5b31`
**Verdict:** PASS WITH WARNINGS

## Summary

The v2 tokens, themes, CSS variables and fonts are live in `@helu/ui`, `apps/mobile` and `apps/web`. All tasks are done. `check:tokens` passes, and there are no new type errors against `dev`.

## Specs merged into `openspec/specs/`

| Spec | Location |
|---|---|
| Design tokens v2 | `specs/shared-ui/design-tokens.spec.md` (new domain) |
| Mobile fonts and colors | `specs/mobile/fonts-and-colors.spec.md` |
| Web fonts and colors | `specs/web/fonts-and-colors.spec.md` (new domain) |

## Warnings

- `dev` already fails `tsc` (mobile, 85 errors) and `next build` (web, type errors). The criterion used here was "no new errors".
- The web login is unreadable in dark mode. This already happens on `dev` and is left for Phase 4.
- `palette.status.error[500]` is used as text or badge fill at 3.76:1. It will be fixed with the components in Phase 0.2.
- The mobile check ran only in the iOS simulator. A physical phone needs Expo SDK 58 (separate PR).

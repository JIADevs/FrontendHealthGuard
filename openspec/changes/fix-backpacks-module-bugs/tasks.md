# Tasks: Corregir módulo Mochilas (mobile + API)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 550–750 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR-B → PR-F1 → PR-F2 |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Feature branch chain

**Tracker branch** (ambos repos): `feature/fix-backpacks-module-bugs` ← creada desde `dev`  
**Integración final**: tracker → `dev` (una vez mergeados todos los slices)

| Unit | PR | Head branch | Base (PR target) | Tras merge |
|------|-----|-------------|------------------|------------|
| B | PR-B | `fix/backpacks-api-contract` | `feature/fix-backpacks-module-bugs` | → tracker (backend) |
| F1 | PR-F1 | `fix/backpacks-shared-api` | `feature/fix-backpacks-module-bugs` | → tracker (frontend) |
| F2 | PR-F2 | `fix/backpacks-mobile-ui` | `fix/backpacks-shared-api` | → tracker (frontend) |

**Orden**: merge PR-B al tracker backend → PR-F1 al tracker frontend → PR-F2 al tracker frontend → QA en tracker → tracker → `dev` en cada repo.

Si el diff de PR-F2 muestra cambios de F1, retarget/rebase: base debe ser `fix/backpacks-shared-api`, no el tracker.

### Suggested Work Units

| Unit | Goal | PR | Verify |
|------|------|-----|--------|
| B | Contrato API | PR-B | `pytest tests/api/test_backpacks.py` |
| F1 | Shared client | PR-F1 | `tsc -p packages/api` |
| F2 | Mobile UI | PR-F2 | `tsc -p apps/mobile` + QA manual |

---

## Phase 1: Backend [PR-B]

- [x] 1.1 `crud_backpack.py`: add `count_documents`, `is_document_linked`; duplicate-safe `add_document`
- [x] 1.2 `backpacks.py`: POST documents → 409 if linked; PUT → attach `document_count`
- [x] 1.3 `test_backpacks.py`: duplicate add 409; PUT returns correct count after link
- [x] 1.4 Run pytest; commit BackendHealthGuard + update `openspec/changes/.../tasks` checkboxes

---

## Phase 2: Shared API [PR-F1]

- [x] 2.1 Create `packages/api/src/backpackQueryUtils.ts` — `invalidateBackpackQueries`, `QK.backpackDocIds`
- [x] 2.2 `hooks.ts`: wire add/remove/create mutations to helper; handle 409 in add mutation
- [x] 2.3 Create `useBackpackInfiniteDocuments.ts` — `useInfiniteBackpackDocuments`, `useInfiniteDocumentsCatalog` (LIMIT=20)
- [x] 2.4 `useBackpackDetailCore.ts`: use `useRemoveDocFromBackpackMutation`; drop duplicate remove mutation
- [x] 2.5 Export new hooks/utils from `packages/api` index; `tsc -p packages/api`

---

## Phase 3: Mobile components [PR-F2]

- [x] 3.1 Create `BackpackAddDocumentsHeader.tsx` — subtitle + SearchField (no h3 title)
- [x] 3.2 Create `BackpackDocumentPickerList.tsx` — rows, load-more, optional add/check modes
- [x] 3.3 `BackpackDetailDocumentItem.tsx`: props `onRemove`, `isRemoving`; remove affordance
- [x] 3.4 `BackpackDetailContentSection.tsx`: load-more footer; pass remove props
- [x] 3.5 `BackpackCreateDocumentPicker.tsx`: delegate to picker list; export via `index.ts`

---

## Phase 4: Mobile screens [PR-F2]

- [x] 4.1 `BackpackAddDocumentsScreen`: use header + infinite catalog; remove duplicate title (B09)
- [x] 4.2 `BackpackDetailScreen`: infinite docs; Alert confirm remove; wire `removeDocument` (B01)
- [x] 4.3 `BackpackEditScreen`: connect `docSearch`/`setDocSearch` to picker (B10)
- [x] 4.4 `useBackpackCreateWithDocs.ts`: call `invalidateBackpackQueries` after doc links (B06)
- [x] 4.5 Header badges: use flattened pages for bytes; rely on invalidated `documentCount` (B08, B13)

---

## Phase 5: Verification

- [ ] 5.1 API: pytest green (spec: duplicate, PUT count)
- [ ] 5.2 Mobile QA: remove doc; list count after add/remove without refresh (B05)
- [ ] 5.3 Mobile QA: added doc hidden in picker same session (B07)
- [ ] 5.4 Mobile QA: load-more on detail + add flows (B11, B12)
- [ ] 5.5 `tsc --noEmit -p apps/mobile`

---

## Apply order

1. Crear tracker `feature/fix-backpacks-module-bugs` desde `dev` en **ambos** repos
2. Phase 1 → **PR-B** → merge al tracker (BackendHealthGuard)
3. Phase 2 → **PR-F1** → merge al tracker (FrontendHealthGuard)
4. Phases 3–4 → **PR-F2** (base: `fix/backpacks-shared-api`) → merge al tracker
5. Phase 5 en tracker; luego **tracker → `dev`** en cada repo

---
name: feature-refactor
description: >-
  Decomposes a large/messy feature (God components, 1k+ line route files,
  tangled shared state) into focused hooks and presentational components while
  preserving behavior. Quantifies the problem, mirrors an existing
  already-refactored sibling feature's file convention instead of inventing one,
  then migrates in small vertical slices that keep tests/typecheck/lints green
  after every step. Use when the user says refactor, decompose, "this file is
  too big", "split this up", "the code is getting messy", or "fixing one thing
  breaks another".
---

# Feature refactor (decompose a large feature)

Use when a feature has grown into a few giant files where editing one concern
breaks another. Goal: isolate concerns so changes are local, without changing
behavior.

## Core principles

1. **Behavior-preserving.** Pure extraction/relocation. No feature changes mixed
   in. If a correctness bug is found, fix it as its own clearly-labeled slice (or
   defer), never silently inside a move.
2. **Match the repo, don't invent.** Find a feature in this repo that was already
   refactored well and mirror its structure, naming, and test colocation exactly.
   Consistency beats personal preference.
3. **Vertical slices.** Extract one concern at a time. The app must compile and
   all tests pass after every slice. Never leave a broken intermediate state.
4. **Low-risk first.** Extract the simplest, least-coupled concerns first to
   validate the pattern; do the highest-coupling concern last.
5. **The entry file shrinks every slice.** A route/page file should end as a thin
   orchestrator that wires hooks to presentational components.

## Workflow

Copy this checklist and track progress:

```
- [ ] 0. Safety net: clean tree + baseline green
- [ ] 1. Assess & quantify
- [ ] 2. Find the convention (sibling feature)
- [ ] 3. Plan decomposition boundaries
- [ ] 4. Execute in vertical slices
- [ ] 5. Verify
```

### 0. Safety net

- Run `git status`. Prefer a clean (or committed) tree so each slice is an easy
  revert. If dirty, ask the user to commit/stash first.
- Identify the test command and the tests covering this feature. Run them once to
  confirm a green baseline. If there is no coverage on the riskiest logic,
  consider adding characterization tests before moving it.

### 1. Assess & quantify

Make the problem concrete before proposing anything.

- Measure file sizes and find the giant components. Example (adjust per repo):
  - line counts per file in the feature
  - within a big file, locate top-level component/function boundaries and count
    `useState` / `useEffect` / `useMutation` / `useQuery` / `useMemo` /
    `useCallback` occurrences.
- A single component with **hundreds of lines and dozens of hooks** is a "God
  component" — the decomposition target.
- Map the internal structure: group state/queries/effects/memos by concern, note
  the major render sections, and call out **coupling hotspots** (see below). For
  very large files, use parallel read-only explore subagents to inventory
  structure quickly.

### 2. Find the convention (most important step)

Locate a sibling feature in the same repo that has already been decomposed
cleanly. Read its real on-disk layout (folders, file names, where hooks/tests
live, how the entry file delegates). Record the pattern explicitly and follow it:

- Where do route/page entries live, and how thin are they?
- Is there a route-adjacent folder, a `features/` module, or colocated files?
- Naming: kebab-case vs PascalCase files? `hooks/` folder? `data/` for pure
  transforms? Are tests colocated (`*.test.ts` next to source)?
- Barrel `index.ts` or direct imports?

If the user references a specific feature ("we did X differently"), that feature
is the source of truth — mirror it. Do not introduce a competing structure.

### 3. Plan decomposition boundaries

Slice by **concern**, typically:

- **Data hooks** — queries + their derived data and cache wiring
  (`use-<thing>-list`, `use-<thing>-detail`).
- **Action hooks** — mutations + the dialog/confirmation state they own
  (`use-delete-<thing>`, `use-reschedule-<thing>`).
- **Form/state hooks** — local editable state + derived validity.
- **Orchestration hooks** — load/prefill/autosave/dirty-tracking (usually the
  most coupled; do last).
- **Presentational components** — render-only sections (toolbar, table, panel,
  dialogs) that receive props/handlers.

Pure logic (formatting, mapping, parsing) belongs in plain modules with unit
tests, not inside components. Put each extraction's destination path in the plan.

### 4. Execute in vertical slices

For each slice:

1. Move the state/logic/JSX for one concern into its new hook/component file.
2. Wire it back into the entry file via the hook's return / the component's props.
3. Keep the public behavior identical (same query keys, same effect timing, same
   ordering, same mount lifetime / `enabled` timing when hooks move). Preserve
   subtle dependencies — see hotspots.
4. Build + run the feature's tests + typecheck + lints. Fix before moving on.
5. Keep slices small enough to review and revert independently.

Do the low-coupling concerns first; do snapshot/prefill/dirty-tracking last.

### 5. Verify

- Full test suite green; typecheck clean; lints clean on touched files.
- Manual smoke of the feature's primary flows (the ones most likely to regress
  from shared-state changes).
- Confirm the entry file is now a thin orchestrator.

## Coupling hotspots (handle with care)

These commonly cause "fixing one thing breaks another" and need careful
preservation when extracted:

- **Serialized snapshots** feeding dirty-detection/autosave/leave-guards — touch
  many concerns at once. Extract the snapshot builder as pure logic; keep
  consumers reading the same shape.
- **Prefill/load effect chains** gated on async data (e.g. an effect that waits
  for a secondary query/catalog). Preserve the exact gating and the
  "done" refs/flags; splitting them wrong causes blank or stale loads.
- **Derived id/scope values** that gate every query and mutation — extract once,
  pass down; don't recompute divergently.
- **Effects that set multiple unrelated states together** — keep their grouping
  or you change timing/ordering.
- **Mutation callbacks that navigate or invalidate queries** — preserve the
  invalidation predicate/keys precisely.
- **Mount lifetime / enable timing.** If you relocate a hook, effect, or query
  into a component with a different mount lifetime or `enabled` timing than
  before, preserve that lifecycle — or treat the difference as an intentional
  behavior change, not a pure extraction. Identical hook bodies in a
  shorter-/later-mounted child are not automatically behavior-preserving.

## Anti-patterns

- Mixing a behavior change into an extraction commit.
- Inventing a new folder/naming scheme when the repo already has one.
- Big-bang rewrite instead of incremental slices.
- Extracting the most-coupled concern first.
- Dropping/duplicating an import or effect during a move (re-verify usages after
  each slice; run the build).
- Leaving the entry file large "for now".

## Done checklist

- [ ] No God component remains; entry file is a thin orchestrator.
- [ ] Structure/naming/tests match the chosen sibling-feature convention.
- [ ] Behavior unchanged (or bug fixes called out as their own slices).
- [ ] Tests + typecheck + lints green; primary flows smoke-tested.

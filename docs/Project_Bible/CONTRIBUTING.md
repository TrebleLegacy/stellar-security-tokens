# Contributing to the Project Bible

> How to add, update, and maintain artifacts in this knowledge base.

---

## Core Principle

**Every artifact must be verifiable against source code.** No hallucinated methods, no assumed behavior. If you didn't read the file, don't document it. Cite file paths and line ranges when possible.

---

## Artifact Types

### Layer Artifacts (`*_layer.md`)

Per-layer deep reads of a specific codebase area. One file per architectural layer.

**When to create:** When a new layer is added to the codebase (e.g., a new `workers/` directory, a new microservice, a mobile app).

**Template:**
```markdown
# [Layer Name] Layer — Full Deep Read

> **[Tech Stack]** | Read date: YYYY-MM-DD
> Files: [count] | Lines: [total]

---

## File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `filename.ext` | NNN | One-line description |

## [Section per logical group]

### [File or Group Name]
- Purpose
- Key methods/functions with signatures
- Dependencies (what it imports/calls)
- Issues found

## Key Issues Found

| Issue | Severity | Location |
|-------|----------|----------|
| Description | 🔴/🟡/🟢 | `file:line` |
```

**Rules:**
- Read every file in the layer, not just grep
- Document ALL public methods with their signatures
- Map dependencies (what calls what)
- Flag issues with severity: 🔴 Critical, 🟡 Tech debt, 🟢 Info

---

### Synthesis Artifacts (`NN_name.md`)

Cross-cutting analysis that references multiple layers. Numbered for ordering.

**When to create:** When a new cross-cutting concern needs documentation (e.g., `09_api_versioning.md`, `10_i18n_coverage.md`).

**Template:**
```markdown
# NN — [Title]

> [One-line purpose]
> Generated: YYYY-MM-DD

---

## [Content organized by concern, not by file]
```

**Rules:**
- Number sequentially (`09_`, `10_`, etc.)
- Reference layer artifacts by relative link: `[routes_layer](routes_layer.md)`
- Tables over prose — scannable beats readable
- Always update `00_index.md` when adding a new synthesis artifact

---

## How to Update an Existing Artifact

### When code changes
1. **Locate the affected artifact** — use `00_index.md` to find it
2. **Re-read the changed files** — don't patch blindly, re-read
3. **Update the artifact** — modify in place, don't append "UPDATE:" blocks
4. **Update the date** — change the read date in the header
5. **Update `00_index.md`** — if new issues were found, add them to the top issues table

### When adding a new feature
1. Update the relevant **layer artifact** (add the new file to the inventory)
2. Update `02_feature_matrix.md` (add the feature row)
3. Update `01_call_graph.md` (add the new flow)
4. Update `05_config_env_map.md` if new env vars were introduced
5. Update `08_email_inventory.md` if new emails were added

---

## Quality Checklist

Before merging any Bible update, verify:

- [ ] **Accuracy**: Every method name, parameter, and return type matches the source code
- [ ] **Completeness**: No files in the layer were skipped
- [ ] **Links**: All cross-references between artifacts are valid
- [ ] **Index**: `00_index.md` reflects the new/changed artifact
- [ ] **Date**: Read date is updated in the artifact header
- [ ] **Issues**: Any new issues are added to both the layer artifact AND `00_index.md`

---

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Layer artifact | `{layer_name}_layer.md` | `workers_layer.md` |
| Synthesis artifact | `{NN}_{snake_case_name}.md` | `09_api_versioning.md` |
| This guide | `CONTRIBUTING.md` | — |
| Master index | `00_index.md` | — |

---

## What NOT to Put Here

- **Generated API docs** — Use Swagger/OpenAPI for that
- **Meeting notes or decisions** — Use an ADR (Architecture Decision Record) folder
- **Tutorials or how-tos** — This is a reference, not a guide
- **Opinions without evidence** — Every claim must trace to a file and line

---

## Maintenance Schedule

| Trigger | Action |
|---------|--------|
| New PR merged (feature) | Update affected layer + synthesis artifacts |
| New PR merged (refactor) | Re-read affected layer, update or delete obsolete entries |
| Monthly review | Scan `04_dead_code.md` — has any been cleaned up? Update. |
| Major release | Full re-read of changed layers, bump dates |

> **The Bible is only useful if it's current.** A stale Bible is worse than no Bible — it creates false confidence. When in doubt, re-read the source.

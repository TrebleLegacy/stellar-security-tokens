---
tags: [meta, conventions]
status: active
---

# Documentation Conventions

This document explains the Obsidian-compatible conventions used throughout the Source of Truth documentation.

---

## Frontmatter

Every file includes YAML frontmatter:

```yaml
---
tags: [backend, service, stellar]    # For Obsidian filtering
relates: [[file1]], [[file2]]        # Key dependencies
status: verified | needs_review | deprecated
last_verified: YYYY-MM-DD
---
```

### Status Values
| Status | Meaning |
|--------|---------|
| `verified` | Reviewed and matches current code |
| `needs_review` | May be outdated, needs verification |
| `deprecated` | File is deprecated or scheduled for removal |

---

## Wikilinks

Cross-references use Obsidian wikilink syntax:

```markdown
[[backend/services/stellar.service]]     # Link to file
[[stellar.service]]                       # Short form (if unique)
[[stellar.service#createAsset]]          # Link to heading
[[stellar.service|Stellar Service]]       # Custom display text
```

---

## File Naming

- Use **exact filenames** from the codebase (e.g., `stellar.service.md` for `stellar.service.js`)
- Index files are named `_INDEX.md` (underscore prefix sorts them first)

---

## Tags

Standard tags used throughout:

### Layer Tags
- `#backend` — Backend code
- `#frontend` — Frontend code
- `#infrastructure` — Docker, CI/CD, scripts

### Type Tags
- `#service` — Business logic services
- `#controller` — API controllers
- `#route` — Route definitions
- `#component` — React components
- `#hook` — React hooks
- `#page` — Page components

### Feature Tags
- `#stellar` — Stellar blockchain integration
- `#auth` — Authentication/authorization
- `#payment` — Payment processing
- `#wallet` — Wallet management

---

## File Documentation Template

Each file doc follows this structure:

```markdown
---
tags: [backend, service, stellar]
relates: [[stellar.config]], [[payment.service]]
status: verified
last_verified: 2026-02-05
---

# stellar.service.js

> **Path**: `backend/src/services/stellar.service.js`
> **Size**: 74KB | **Lines**: ~2000

## Purpose
One-paragraph description of what this file does.

## Key Functions

| Function | Description |
|----------|-------------|
| `createAsset()` | Creates a new Stellar asset |
| `transferTokens()` | Transfers tokens between accounts |

## Dependencies
- [[KeyManager]] — Key management
- [[prisma]] — Database access

## Used By
- [[tokenController]] — Token CRUD operations
- [[offerController]] — Offer management

## Notes
Any important caveats, gotchas, or context.
```

---

## Graph View

In Obsidian, use Graph View to visualize connections:

1. Open command palette (Cmd+P)
2. Search "Open graph view"
3. Filter by tags to focus on specific areas

---

## Searching

Use Obsidian search operators:

```
tag:#stellar          # Find files with stellar tag
path:backend/         # Find files in backend folder
line:createAsset      # Find files containing "createAsset"
```

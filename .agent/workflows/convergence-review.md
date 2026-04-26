# Convergence Review Workflow

> Self-looping adversarial review. Invoke once, get a fully hardened plan.

## When to Use

After an implementation plan exists, before execution. Replaces the manual loop of asking for "another review."

## How to Invoke

```
/convergence-review
```

Or with explicit depth:
```
ULTRATHINK @[/convergence-review] FULL — review the implementation plan
ULTRATHINK @[/convergence-review] FOCUSED — review changes to [feature]
ULTRATHINK @[/convergence-review] QUICK — sanity check on [refactor]
```

## What It Does

1. Reads the implementation plan
2. Auto-selects depth (FULL/FOCUSED/QUICK) based on what the plan touches
3. Runs review passes through 6 systematic layers, fixing the plan after each pass
4. Stops automatically when convergence is reached (no new findings above INFO)
5. Produces a Convergence Report with ship/no-ship decision

## Key Difference from Manual Reviews

| Manual | Convergence Review |
|--------|-------------------|
| User asks "review again" after each pass | Loops autonomously |
| Reviewer re-reads the same files | Each pass uses a different lens (6 layers) |
| Stops when user stops asking | Stops when mathematically converged |
| Findings scattered across chat | All findings tracked in registry with IDs |
| No kill chain analysis | Chains findings into breach scenarios |

## Steps

1. Read the skill: `~/.gemini/antigravity/skills/convergence-review/SKILL.md`
2. Read the implementation plan artifact
3. Execute the convergence loop per the skill protocol
4. Write the Convergence Report artifact
5. Present ship/no-ship decision

## The 6 Layers (quick reference)

```
L1: Code Correctness     — Does the logic work?
L2: Cross-Fix Conflicts  — Do the fixes fight each other?
L3: Error Propagation     — Does the fix work service → route → client?
L4: Adjacent Systems      — Same bug pattern in other services?
L5: Operational Readiness — Deploy, rollback, monitor, recover?
L6: Blast Radius          — What breaks 30/60/90 days from now?
```

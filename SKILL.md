---
name: claw-sync
description: Sync OpenClaw workspace files between multiple machines via GitHub PRs with intelligent deduplication. Use when the user says "sync", "sync workspaces", or asks to merge/harmonize changes between OpenClaw installations.
---

# claw-sync

Sync your OpenClaw workspace across multiple machines using GitHub PRs.

## Sync Workflow

When the user asks to sync:

### 1. Commit & push current branch

```bash
branch=$(git config openclaw.branch)
git checkout "$branch"
git add -A && git commit -m "Sync $(date +%Y-%m-%d)" && git push origin "$branch"
```

### 2. Fetch all branches

```bash
git fetch origin
```

### 3. Check what needs merging

```bash
# List all openclaw branches (exclude main)
git branch -r | grep -v 'origin/main' | grep -v HEAD

# For each branch, check if ahead of main:
git log --oneline main..origin/BRANCH_NAME
```

### 4. Create PR for each branch with changes

```bash
gh pr create --base main --head "$branch" --title "Sync $branch → main ($(date +%Y-%m-%d))"
```

### 5. Review & resolve conflicts

For each PR:
- **New files** → merge directly
- **Modified, no overlap** → auto-merge
- **Conflicts** → apply deduplication rules (see below)

### 6. Merge PRs

```bash
gh pr merge <number> --merge
```

### 7. Reset all branches to main

After all PRs merged:

```bash
git checkout main && git pull origin main

# Push main to all machine branches
for branch in $(git branch -r | grep -v main | grep -v HEAD | sed 's|origin/||'); do
  git push origin main:"$branch"
done
```

## Deduplication Rules

When resolving conflicts in workspace files:

| Situation | Resolution |
|-----------|------------|
| Same event described twice | Keep the more detailed version |
| Same fact in MEMORY.md | Keep one copy, prefer more recent/accurate |
| Different events on same date | Combine under labeled sections (`## macbook` / `## server`) |
| Conflicting information | **Ask the user** — don't guess |
| Environment-specific content | Keep both, clearly labeled per machine |
| Uncertain about anything | **Ask the user** — never silently discard |

## Requirements

- `git` configured with SSH access to GitHub
- `gh` CLI authenticated (`gh auth login`)
- Each machine's branch configured via `git config openclaw.branch`

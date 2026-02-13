---
name: claw-sync
description: Sync OpenClaw workspace files between multiple machines via GitHub PRs with intelligent deduplication. Use when the user says "sync", "sync workspaces", or asks to merge/harmonize changes between OpenClaw installations.
---

# claw-sync

Sync your OpenClaw workspace across multiple machines using GitHub PRs.

## Overview

Each machine has its own branch. Changes merge into `main` via PRs. After merging, all branches reset to `main` — keeping every installation in sync.

## Setup

### 1. Create a private GitHub repo for your workspace

```bash
cd ~/.openclaw/workspace
git init
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

### 2. Configure each machine's branch identity

On each machine, set a unique branch name:

```bash
git config openclaw.branch "macbook"    # on your MacBook
git config openclaw.branch "server"     # on your server
git config openclaw.branch "work-pc"    # on your work PC
```

### 3. Create and push each branch

```bash
branch=$(git config openclaw.branch)
git checkout -b "$branch"
git add -A && git commit -m "Initial commit"
git push -u origin "$branch"
```

### 4. Create main branch

```bash
git checkout -b main
git push -u origin main
```

### 5. (Optional) Auto-pull main at session start

Add to your OpenClaw hooks to stay current:

```yaml
# config.yaml
hooks:
  workspace-pull:
    enabled: true
```

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
git push origin main:macbook main:server main:work-pc
# Or dynamically:
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

## Tips

- **Commit often** — small commits are easier to merge
- **Sync regularly** — reduces conflict complexity
- **Memory files** — most amenable to "combine both" resolution
- **Config files** — most likely to need machine-specific sections

## Requirements

- `git` configured with SSH access to GitHub
- `gh` CLI authenticated (`gh auth login`)
- Each machine's branch configured via `git config openclaw.branch`

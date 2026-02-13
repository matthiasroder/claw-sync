# claw-sync

An [OpenClaw](https://openclaw.ai) skill that syncs your workspace across multiple machines using git branches and GitHub PRs.

Your OpenClaw workspace holds memory files, notes, and configuration that accumulate over time. If you run OpenClaw on more than one machine, those workspaces diverge. This skill gives your agent a workflow to merge them back together — with intelligent deduplication for memory files and human confirmation for real conflicts.

## How it works

Each machine gets its own git branch (e.g., `macbook`, `server`). During normal use, the agent commits workspace changes to its machine's branch. When you want to sync, the agent creates a PR for each branch into `main`, merges them, and resets all branches to the merged state. Next time any machine starts a session, it pulls `main` and has the combined workspace.

```
macbook ──commits──► origin/macbook ──PR──► main ◄──PR── origin/server ◄──commits── server
                                             │
                                    all branches reset
                                             │
                                     ┌───────┴───────┐
                                  macbook          server
                                  (in sync)        (in sync)
```

## Installation

You'll need:
- **git** with SSH access to GitHub
- **[GitHub CLI](https://cli.github.com/)** (`gh`) — authenticated via `gh auth login`
- A **private GitHub repo** to store your workspace

Clone the skill into your workspace:

```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/matthiasroder/claw-sync.git
```

## Setup

Do this once on each machine.

### 1. Initialize your workspace as a git repo

```bash
cd ~/.openclaw/workspace
git init
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

### 2. Create the main branch

From whichever machine you set up first:

```bash
git add -A
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

### 3. Configure each machine's branch name

On each machine, set a unique name:

```bash
cd ~/.openclaw/workspace
git config openclaw.branch "macbook"    # on your laptop
git config openclaw.branch "server"     # on your server
```

### 4. Create and push each machine's branch

```bash
branch=$(git config openclaw.branch)
git checkout -b "$branch"
git push -u origin "$branch"
git checkout main
```

### 5. (Optional) Auto-pull at session start

If your OpenClaw installation supports the `workspace-pull` hook, enable it so the agent always starts with the latest `main`:

```yaml
# config.yaml
hooks:
  workspace-pull:
    enabled: true
```

## Configure your agent

Add a **Workspace Sync** section to your `AGENTS.md` (or equivalent agent instructions file). This tells the agent how to commit changes to its machine's branch during normal use, and where to find the sync skill when you ask for it.

```markdown
## Workspace Sync

This workspace is synced between installations via GitHub. Each installation
has its own branch. `main` is the merged canonical state.

- **Session start:** Automated via `workspace-pull` hook (fetches + checks out `main`)
- **After modifying workspace files:** Commit and push to your branch:
  ```bash
  branch=$(git config openclaw.branch)
  git checkout "$branch" && git add -A && git commit -m "Update $(date +%Y-%m-%d)" && git push origin "$branch" && git checkout main
  ```
- **To sync installations:** User says "sync workspaces" → see `skills/claw-sync/SKILL.md`
```

Without this, the agent won't know to commit workspace changes to the machine branch, and the sync skill won't have anything to merge.

## Worked example

You have OpenClaw on two machines: `macbook` and `server`. Both have been used independently for a few days.

### Step 1: Each machine commits to its branch

During normal sessions, the agent commits workspace changes to the machine's branch. This happens automatically (configured in your `AGENTS.md`), or you can do it manually:

```bash
# On macbook
cd ~/.openclaw/workspace
branch=$(git config openclaw.branch)   # "macbook"
git checkout "$branch"
git add -A
git commit -m "Update 2026-02-13"
git push origin "$branch"
git checkout main
```

```bash
# On server
cd ~/.openclaw/workspace
branch=$(git config openclaw.branch)   # "server"
git checkout "$branch"
git add -A
git commit -m "Update 2026-02-13"
git push origin "$branch"
git checkout main
```

At this point, `origin/macbook` and `origin/server` each have changes that `main` doesn't.

### Step 2: Trigger the sync

On either machine, tell your agent:

> "sync workspaces"

### Step 3: The agent runs the sync workflow

The agent (following `SKILL.md`) does the following:

1. **Commits and pushes** any uncommitted changes on the current machine's branch
2. **Fetches all branches** from origin
3. **Checks which branches are ahead of main:**
   ```
   git log --oneline main..origin/macbook   → 2 commits
   git log --oneline main..origin/server    → 3 commits
   ```
4. **Creates a PR for each branch** that has changes:
   ```
   gh pr create --base main --head macbook --title "Sync macbook → main (2026-02-13)"
   gh pr create --base main --head server  --title "Sync server → main (2026-02-13)"
   ```
5. **Merges each PR**, resolving conflicts using the deduplication rules below. If a conflict is ambiguous, the agent asks you.
6. **Resets all branches to main:**
   ```
   git checkout main && git pull origin main
   git push origin main:macbook main:server
   ```

### Step 4: Both machines are in sync

Next time either machine starts a session, the `workspace-pull` hook pulls `main` — which now contains the merged changes from both machines.

## Deduplication rules

When the agent encounters conflicts in workspace files during merge, it follows these rules:

| Situation | Resolution |
|---|---|
| Same event described twice | Keep the more detailed version |
| Same fact in MEMORY.md | Keep one copy, prefer more recent/accurate |
| Different events on same date | Combine under labeled sections (`## macbook` / `## server`) |
| Conflicting information | **Ask the user** |
| Environment-specific content | Keep both, clearly labeled per machine |
| Uncertain about anything | **Ask the user** |

## License

MIT

# claw-sync

An [OpenClaw](https://openclaw.ai) skill for syncing your workspace across multiple machines.

## What it does

Keeps your OpenClaw workspace (memory files, notes, config) synchronized between machines using GitHub PRs with intelligent conflict resolution.

- Each machine gets its own branch
- Changes merge into `main` via PRs
- AI-assisted deduplication for memory files
- Human confirmation for real conflicts

## Installation

Copy `SKILL.md` to your OpenClaw workspace skills directory:

```bash
# From your workspace
mkdir -p skills/claw-sync
curl -o skills/claw-sync/SKILL.md https://raw.githubusercontent.com/matthiasroder/claw-sync/main/SKILL.md
```

Or clone the whole repo:

```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/matthiasroder/claw-sync.git
```

## Requirements

- Git with SSH access to GitHub
- [GitHub CLI](https://cli.github.com/) (`gh`) authenticated
- A private repo for your workspace

## Usage

Just tell your OpenClaw assistant:

> "sync workspaces"

Or:

> "sync my workspace with other machines"

The skill handles the rest — committing, PRs, conflict resolution, and resetting branches.

## Setup

See [SKILL.md](SKILL.md) for detailed setup instructions.

## License

MIT

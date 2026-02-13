---
name: workspace-pull
description: Pull latest main branch before each session starts.
metadata:
  openclaw:
    emoji: "\u2B07\uFE0F"
    events: ["agent:bootstrap"]
    requires:
      bins: ["git"]
---

# Workspace Pull

Automatically pulls the latest `main` branch from GitHub before workspace files are injected into the agent. This ensures each session starts with the most recent synced state.

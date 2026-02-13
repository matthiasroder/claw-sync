import { execSync } from "node:child_process";

const handler = async (event) => {
	if (event.type !== "agent" || event.action !== "bootstrap") {
		return;
	}

	const workspaceDir = event.context?.workspaceDir;
	if (!workspaceDir) {
		console.error("[workspace-pull] No workspace directory in event context");
		return;
	}

	const execOpts = { cwd: workspaceDir, stdio: "pipe", timeout: 30000 };

	try {
		// Fetch latest from remote (may fail if offline)
		try {
			execSync("git fetch origin main", execOpts);
		} catch {
			console.error("[workspace-pull] Fetch failed (offline?), continuing with local state");
		}

		// Ensure we're on main with latest state
		execSync("git checkout main", execOpts);
		execSync("git pull origin main", execOpts);
	} catch (err) {
		console.error("[workspace-pull] Git pull failed:", err instanceof Error ? err.message : String(err));
	}
};

export default handler;

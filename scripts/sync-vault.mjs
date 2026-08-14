import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const message = process.argv.slice(2).join(" ") || `vault update: ${new Date().toISOString()}`;

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, ["scripts/verify-repo.mjs"]);
run("git", ["add", "-A"]);

const diff = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: root });
if (diff.status === 1) run("git", ["commit", "-m", message]);
else if (diff.status !== 0) process.exit(diff.status ?? 1);

run("git", ["pull", "--rebase"]);
run("git", ["push"]);

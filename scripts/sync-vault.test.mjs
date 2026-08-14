import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, cwd = root) {
  return execFileSync(command, args, { cwd, encoding: "utf8", stdio: "pipe" });
}

test("sync commits changes, pushes them, and skips empty commits", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "vault-sync-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const remote = join(dir, "remote.git");
  const work = join(dir, "work");
  run("git", ["clone", "--bare", root, remote]);
  run("git", ["clone", remote, work]);
  run("git", ["config", "user.name", "Sync Test"], work);
  run("git", ["config", "user.email", "sync@example.invalid"], work);
  copyFileSync(join(root, "scripts", "sync-vault.mjs"), join(work, "scripts", "sync-vault.mjs"));
  writeFileSync(join(work, "README.md"), `${readFileSync(join(work, "README.md"), "utf8")}\nSync test.\n`);

  run(process.execPath, ["scripts/sync-vault.mjs", "test sync"], work);
  assert.equal(run("git", ["log", "-1", "--format=%s"], work).trim(), "test sync");
  assert.match(run("git", ["--git-dir", remote, "show", "main:README.md"]), /Sync test\./);

  const before = run("git", ["rev-list", "--count", "HEAD"], work).trim();
  run(process.execPath, ["scripts/sync-vault.mjs", "should not commit"], work);
  assert.equal(run("git", ["rev-list", "--count", "HEAD"], work).trim(), before);
});

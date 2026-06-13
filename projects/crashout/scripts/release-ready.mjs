import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));
const expectedRemote =
  process.env.CRASHOUT_GIT_REMOTE || "https://github.com/VDentesano/crashout";
const expectedProductionBranch = process.env.CRASHOUT_PRODUCTION_BRANCH || "main";

function git(args) {
  try {
    return execFileSync("git", args, {
      cwd: projectDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function status(label, ok, detail) {
  const mark = ok ? "OK" : "BLOCKED";
  console.log(`${mark} ${label}${detail ? `: ${detail}` : ""}`);
  return ok;
}

function remoteHeadBranch() {
  const output = git(["ls-remote", "--symref", "origin", "HEAD"]);
  const match = output.match(/ref: refs\/heads\/([^\t\n ]+)/);
  return match?.[1] || "";
}

const repoRoot = git(["rev-parse", "--show-toplevel"]);
const branch = git(["branch", "--show-current"]);
const origin = git(["remote", "get-url", "origin"]);
const workflowPath = repoRoot
  ? join(repoRoot, ".github", "workflows", "crashout-ci.yml")
  : "";
const packagePath = join(projectDir, "package.json");
const remoteDefaultBranch = origin ? remoteHeadBranch() : "";
let packageJson = {};

try {
  packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
} catch {
  packageJson = {};
}

const checks = [
  status(
    "git repository",
    Boolean(repoRoot),
    repoRoot ? relative(projectDir, repoRoot) || "." : "not inside a git repo",
  ),
  status(
    "origin remote",
    Boolean(origin),
    origin || `missing; add ${expectedRemote}`,
  ),
  status(
    "origin target",
    !origin || origin === expectedRemote || origin.endsWith("/crashout.git"),
    origin || "not checked until origin exists",
  ),
  status(
    "current branch",
    Boolean(branch),
    branch || "detached HEAD or unborn branch",
  ),
  status(
    "production branch alignment",
    branch === expectedProductionBranch,
    `current=${branch || "unknown"}, production=${expectedProductionBranch}`,
  ),
  status(
    "remote default branch",
    !remoteDefaultBranch || remoteDefaultBranch === expectedProductionBranch,
    remoteDefaultBranch
      ? `remote=${remoteDefaultBranch}, production=${expectedProductionBranch}`
      : "not checked until origin exists",
  ),
  status(
    "Crashout CI workflow",
    Boolean(workflowPath && existsSync(workflowPath)),
    workflowPath ? relative(projectDir, workflowPath) : "repo root unknown",
  ),
  status(
    "package release gate",
    packageJson.scripts?.check === "pnpm lint && pnpm test && pnpm build",
    packageJson.scripts?.check || "missing check script",
  ),
];

console.log("");
console.log("Next commands when blockers are resolved:");
if (!origin) {
  console.log(`git remote add origin ${expectedRemote}`);
}
if (branch !== expectedProductionBranch) {
  console.log(`git branch -M ${expectedProductionBranch}`);
}
console.log(`git push -u origin ${expectedProductionBranch}`);
console.log(`gh repo edit VDentesano/crashout --default-branch ${expectedProductionBranch}`);
console.log(
  "Enable branch protection for Crashout CI / Lint, test, build in GitHub settings.",
);

if (checks.includes(false)) {
  process.exitCode = 1;
}

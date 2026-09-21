import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const installOnly = process.argv.includes("--install-only");
const vercelProjectRoot = process.cwd();

function findMonorepoRoot(startDir) {
  let dir = startDir;
  for (;;) {
    const pkgPath = path.join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        if (Array.isArray(pkg.workspaces)) {
          return dir;
        }
      } catch {
        // keep walking
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error(
    "Could not find monorepo root. Ensure package.json with npm workspaces exists above this project.",
  );
}

const monorepoRoot = findMonorepoRoot(scriptDir);
const sandboxDist = path.join(
  monorepoRoot,
  "artifacts",
  "mockup-sandbox",
  "dist",
);
const rootApiEntry = path.join(monorepoRoot, "api", "index.js");
const deployPublic = path.join(vercelProjectRoot, "public");
const deployApiDir = path.join(vercelProjectRoot, "api");
const deployApiEntry = path.join(deployApiDir, "index.js");

function run(command, cwd = monorepoRoot) {
  execSync(command, { cwd, stdio: "inherit", env: process.env });
}

run("npm install --workspaces --include=dev");

if (installOnly) {
  process.exit(0);
}

run("npm run build --workspace @workspace/mockup-sandbox");

if (!existsSync(path.join(sandboxDist, "index.html"))) {
  throw new Error(
    [
      "Frontend build did not produce artifacts/mockup-sandbox/dist.",
      `Looked for: ${sandboxDist}`,
      "Check Vercel logs above for Vite or dependency errors.",
    ].join("\n"),
  );
}

if (existsSync(deployPublic)) {
  rmSync(deployPublic, { recursive: true, force: true });
}
cpSync(sandboxDist, deployPublic, { recursive: true });

if (!existsSync(rootApiEntry)) {
  throw new Error(`Missing serverless API entry: ${rootApiEntry}`);
}
if (path.resolve(rootApiEntry) !== path.resolve(deployApiEntry)) {
  mkdirSync(deployApiDir, { recursive: true });
  cpSync(rootApiEntry, deployApiEntry);
}

console.log(`Vercel static output: ${deployPublic}`);
console.log(`Vercel API entry: ${deployApiEntry}`);

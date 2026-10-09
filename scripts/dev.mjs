import { spawn, spawnSync } from "node:child_process";
import { execPath } from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = resolve(root, "api-php");
const frontendDir = resolve(root, "artifacts", "mockup-sandbox");
const children = [];

function verifyPhpExtensions() {
  const modules = spawnSync("php", ["-m"], { encoding: "utf8" });
  if (modules.error) {
    console.error("PHP was not found. Install PHP or XAMPP, then make sure `php` is available in PATH.");
    process.exit(1);
  }
  const loaded = new Set(
    modules.stdout
      .split(/\r?\n/)
      .map((line) => line.trim().toLowerCase())
      .filter(Boolean),
  );
  const missing = ["pdo_mysql", "fileinfo"].filter((extension) => !loaded.has(extension));
  if (missing.length === 0) return;

  const ini = spawnSync("php", ["--ini"], { encoding: "utf8" });
  console.error(`PHP is missing required extension(s): ${missing.join(", ")}.`);
  console.error("Enable them in the active php.ini shown by `php --ini`, then restart this command.");
  if (ini.stdout.trim()) console.error(ini.stdout.trim());
  process.exit(1);
}

function start(label, command, args, cwd) {
  const childEnv = { ...process.env };
  if (label === "Vite") delete childEnv.REPL_ID;
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: childEnv,
  });
  children.push(child);
  child.on("error", (error) => console.error(`[${label}] ${error.message}`));
  child.on("exit", (code, signal) => {
    if (code && code !== 0) console.error(`[${label}] exited with code ${code}${signal ? ` (${signal})` : ""}`);
    if (label === "PHP API" && code !== null && code !== 0) {
      console.error("PHP API failed to start. Run `php --ini` and confirm the active php.ini enables pdo_mysql and fileinfo.");
    }
  });
  return child;
}

verifyPhpExtensions();
console.log("Starting PHP API at http://localhost:8000/index.php");
console.log("Starting Vite frontend...");
start("PHP API", "php", ["-S", "localhost:8000", "-t", apiDir], root);
start("Vite", execPath, [resolve(root, "node_modules", "vite", "bin", "vite.js"), "dev", "--configLoader", "runner"], frontendDir);

function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);

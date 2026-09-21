import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { execPath } from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = resolve(root, "api-php");
const frontendDir = resolve(root, "artifacts", "mockup-sandbox");
const phpIni = resolve(apiDir, "php.ini");
const children = [];

if (!existsSync(phpIni)) {
  console.error("Missing api-php/php.ini; cannot start the PHP API.");
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
      console.error("PHP API failed to start. Confirm PHP is installed and api-php/php.ini enables PDO MySQL.");
    }
  });
  return child;
}

console.log("Starting PHP API at http://localhost:8000/index.php");
console.log("Starting Vite frontend...");
start("PHP API", "php", ["-c", phpIni, "-S", "localhost:8000", "-t", apiDir], root);
start("Vite", execPath, [resolve(root, "node_modules", "vite", "bin", "vite.js"), "dev", "--configLoader", "runner"], frontendDir);

function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);

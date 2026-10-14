import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "node:url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const rawPort = process.env.PORT || "5000";

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";
const localApiProxy = () => ({
  target: process.env.LOCAL_API_PROXY_TARGET ?? "http://localhost:8000",
  changeOrigin: true,
  rewrite: (requestPath: string) => requestPath.replace(/^\/api(?=\/|$)/, "/index.php"),
});

function offlinePrecacheManifest(): Plugin {
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return {
    name: "offline-precache-manifest",
    apply: "build",
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter((file) => !file.endsWith(".map"))
        .map((file) => `${base}${file}`);
      this.emitFile({
        type: "asset",
        fileName: "precache-manifest.json",
        source: JSON.stringify({ assets }),
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    offlinePrecacheManifest(),
    mockupPreviewPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(configDir, ".."),
            }),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(configDir, "src"),
    },
  },
  root: path.resolve(configDir),
  build: {
    outDir: path.resolve(configDir, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: { "/api": localApiProxy() },
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: { "/api": localApiProxy() },
  },
});

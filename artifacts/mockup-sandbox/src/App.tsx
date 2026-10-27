import { Component, useEffect, useState, type ComponentType, type ErrorInfo, type ReactNode } from "react";

import { modules as discoveredModules } from "./.generated/mockup-components";
import { consumeSosShortcutLaunch } from "./lib/sosDevice";

type ModuleMap = Record<string, () => Promise<Record<string, unknown>>>;

class PreviewErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Preview page failed to render:", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-5 py-12 text-center">
          <section className="max-w-md rounded-2xl border border-[#dbe5f0] bg-white p-7 shadow-sm">
            <h1 className="text-xl font-extrabold text-[#163154]">This page couldn’t load.</h1>
            <p className="mt-2 text-sm leading-6 text-[#71859e]">Please reload the page. Your saved reports remain on this device.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-[#0c5bce] px-5 py-3 text-sm font-bold text-white">Reload page</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

function _resolveComponent(
  mod: Record<string, unknown>,
  name: string,
): ComponentType | undefined {
  const fns = Object.values(mod).filter(
    (v) => typeof v === "function",
  ) as ComponentType[];
  return (
    (mod.default as ComponentType) ||
    (mod.Preview as ComponentType) ||
    (mod[name] as ComponentType) ||
    fns[fns.length - 1]
  );
}

function PreviewRenderer({
  componentPath,
  modules,
}: {
  componentPath: string;
  modules: ModuleMap;
}) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setComponent(null);
    setError(null);

    async function loadComponent(): Promise<void> {
      const key = `./components/mockups/${componentPath}.tsx`;
      const loader = modules[key];
      if (!loader) {
        setError(`No component found at ${componentPath}.tsx`);
        return;
      }

      try {
        const mod = await loader();
        if (cancelled) {
          return;
        }
        const name = componentPath.split("/").pop()!;
        const comp = _resolveComponent(mod, name);
        if (!comp) {
          setError(
            `No exported React component found in ${componentPath}.tsx\n\nMake sure the file has at least one exported function component.`,
          );
          return;
        }
        setComponent(() => comp);
      } catch (e) {
        if (cancelled) {
          return;
        }

        const message = e instanceof Error ? e.message : String(e);
        setError(`Failed to load preview.\n${message}`);
      }
    }

    void loadComponent();

    return () => {
      cancelled = true;
    };
  }, [componentPath, modules]);

  if (error) {
    return (
      <pre style={{ color: "red", padding: "2rem", fontFamily: "system-ui" }}>
        {error}
      </pre>
    );
  }

  if (!Component) {
    return (
      <main role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-5 text-sm font-semibold text-[#607993]">
        Loading your page…
      </main>
    );
  }

  return <Component />;
}

function getBasePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}

function getPreviewExamplePath(): string {
  const basePath = getBasePath();
  return `${basePath}/preview/ComponentName`;
}

function Gallery() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">
          Component Preview Server
        </h1>
        <p className="text-gray-500 mb-4">
          This server renders individual components for the workspace canvas.
        </p>
        <p className="text-sm text-gray-400">
          Access component previews at{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
            {getPreviewExamplePath()}
          </code>
        </p>
      </div>
    </div>
  );
}

function getPreviewPath(): string | null {
  const basePath = getBasePath();
  const { pathname } = window.location;
  const local =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;
  if (local === "/admin" || local === "/admin/") {
    return "tricycle-reporting/AdminAccess";
  }
  const match = local.match(/^\/preview\/(.+)$/);
  return match ? match[1] : null;
}

function App() {
  useEffect(() => {
    const checkSosShortcut = () => void consumeSosShortcutLaunch().then(({ openSos, autoSend }) => {
      if (openSos) window.location.replace(`${getBasePath()}/preview/tricycle-reporting/EmergencySOS${autoSend ? "?widgetSend=1" : ""}`);
    }).catch((error: unknown) => console.error("Could not open the SOS shortcut:", error));
    const onVisible = () => { if (document.visibilityState === "visible") checkSosShortcut(); };
    window.addEventListener("focus", checkSosShortcut);
    document.addEventListener("visibilitychange", onVisible);
    checkSosShortcut();
    return () => { window.removeEventListener("focus", checkSosShortcut); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  const defaultPreviewPath = import.meta.env.MODE === "android"
    ? "tricycle-reporting/Auth"
    : "tricycle-reporting/Landing";
  const previewPath = getPreviewPath() ?? defaultPreviewPath;

  if (previewPath) {
    return <PreviewErrorBoundary key={previewPath}><PreviewRenderer componentPath={previewPath} modules={discoveredModules} /></PreviewErrorBoundary>;
  }

  return <Gallery />;
}

export default App;

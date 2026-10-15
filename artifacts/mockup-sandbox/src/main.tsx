import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Remove service workers and app-shell caches left by older web installs.
// Offline report drafts use IndexedDB and are intentionally kept.
async function removeLegacyWebAppCaching() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if ("caches" in window) {
    const appCaches = (await caches.keys()).filter((name) => name.startsWith("tricycle-conduct-"));
    await Promise.all(appCaches.map((name) => caches.delete(name)));
  }
}

void removeLegacyWebAppCaching().catch((error: unknown) => {
  console.warn("Could not remove legacy app-shell caching:", error);
});

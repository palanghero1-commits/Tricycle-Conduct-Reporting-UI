import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PWAInstallContextValue = {
  installPrompt: InstallPromptEvent | null;
  installed: boolean;
  install: () => Promise<void>;
};

const INSTALLED_KEY = "tricycle-pwa-installed";
const PWAInstallContext = createContext<PWAInstallContextValue | null>(null);

function isStandalone() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosNavigator.standalone === true
  );
}

function hasInstalledFlag() {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "true";
  } catch {
    return false;
  }
}

function markInstalled() {
  try {
    localStorage.setItem(INSTALLED_KEY, "true");
  } catch {
    // Display mode still detects the installed app when storage is unavailable.
  }
}

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone() || hasInstalledFlag());

  useEffect(() => {
    const onInstallAvailable = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      markInstalled();
      setInstalled(true);
      setInstallPrompt(null);
    };
    const onDisplayModeChange = () => {
      if (isStandalone()) {
        markInstalled();
        setInstalled(true);
      }
    };
    const displayMode = window.matchMedia("(display-mode: standalone)");

    window.addEventListener("beforeinstallprompt", onInstallAvailable);
    window.addEventListener("appinstalled", onInstalled);
    displayMode.addEventListener("change", onDisplayModeChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallAvailable);
      window.removeEventListener("appinstalled", onInstalled);
      displayMode.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") {
      markInstalled();
      setInstalled(true);
    }
  };

  return (
    <PWAInstallContext.Provider value={{ installPrompt, installed, install }}>
      {children}
    </PWAInstallContext.Provider>
  );
}

export function PWAInstallButton() {
  const context = useContext(PWAInstallContext);
  const [showInstructions, setShowInstructions] = useState(false);
  if (!context || context.installed) return null;

  const isIos = /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const onClick = () => {
    if (context.installPrompt) {
      void context.install();
    } else {
      setShowInstructions((current) => !current);
    }
  };

  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex w-full min-w-0 items-center justify-center gap-1 rounded-[13px] border border-[#cddfea] bg-white px-1 py-3 text-[11px] font-extrabold text-[#315271] shadow-[0_5px_18px_rgba(34,75,112,0.05)] transition-all duration-200 hover:-translate-y-1 hover:border-[#a5c3dd] hover:text-[#0c5bce] sm:w-auto sm:gap-2 sm:px-5 sm:py-3.5 sm:text-[14px]"
      >
        Install app
      </button>
      {showInstructions ? (
        <p className="w-[min(300px,calc(100vw-3rem))] rounded-xl border border-[#dbe5f0] bg-white p-3 text-xs leading-5 text-[#607996] shadow-sm">
          {!window.isSecureContext
            ? <>Native installation needs a secure HTTPS address. This HTTP address is for local testing; open the deployed HTTPS site to install.</>
            : isIos
            ? <>In Safari, tap <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>.</>
            : <>Open your browser menu and choose <strong>Install app</strong> or <strong>Create shortcut</strong>.</>}
        </p>
      ) : null}
    </div>
  );
}

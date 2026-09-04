import { useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CloudOff,
  CloudSun,
  FileSearch,
  FileText,
  Inbox,
  Info,
  LoaderCircle,
  MapPin,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UsersRound,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";

type StateKey = "install" | "offline" | "restored" | "loading" | "error" | "empty";
type EmptyKey = "reports" | "notifications" | "drivers" | "violations" | "activity";

type StateTab = {
  key: StateKey;
  label: string;
  icon: LucideIcon;
};

type EmptyOption = {
  key: EmptyKey;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
};

const stateTabs: StateTab[] = [
  { key: "install", label: "Install prompt", icon: Smartphone },
  { key: "offline", label: "Offline", icon: WifiOff },
  { key: "restored", label: "Connection restored", icon: Wifi },
  { key: "loading", label: "Loading", icon: LoaderCircle },
  { key: "error", label: "Error", icon: CircleAlert },
  { key: "empty", label: "Empty states", icon: Inbox },
];

const emptyOptions: EmptyOption[] = [
  {
    key: "reports",
    label: "No reports",
    title: "No reports yet",
    description: "Reports you submit will appear here with their current review status.",
    icon: FileText,
    iconClass: "bg-[#eaf2ff] text-[#0c5bce]",
  },
  {
    key: "notifications",
    label: "No notifications",
    title: "You are all caught up",
    description: "Updates about your reports and account will appear in this space.",
    icon: Bell,
    iconClass: "bg-[#fff0e9] text-[#d76b42]",
  },
  {
    key: "drivers",
    label: "No drivers",
    title: "No drivers to show",
    description: "Driver records will appear here when they are available to review.",
    icon: UsersRound,
    iconClass: "bg-[#eaf7f1] text-[#21845a]",
  },
  {
    key: "violations",
    label: "No confirmed violations",
    title: "No confirmed violations",
    description: "A report is not a confirmed violation. Confirmed records will appear here after review.",
    icon: ShieldCheck,
    iconClass: "bg-[#f1edff] text-[#6c55b8]",
  },
  {
    key: "activity",
    label: "No recent activity",
    title: "No recent activity",
    description: "Your recent actions and review updates will be listed here.",
    icon: Radio,
    iconClass: "bg-[#fff8df] text-[#b17d20]",
  },
];

function StatePill({ children, tone = "blue" }: { children: string; tone?: "blue" | "orange" | "green" }) {
  const tones = {
    blue: "bg-[#eaf2ff] text-[#0c5bce]",
    orange: "bg-[#fff0e9] text-[#c95f3a]",
    green: "bg-[#eaf7f1] text-[#21845a]",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

function PreviewFrame({ children, stateLabel }: { children: ReactNode; stateLabel: string }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#dbe5f0] bg-[#fbfdff] shadow-[0_18px_45px_rgba(34,67,107,0.08)]">
      <div className="flex items-center justify-between border-b border-[#e7eef5] bg-white px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#eaf2ff] text-[#0c5bce]">
            <ShieldCheck size={15} strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-[#23405f]">Tricycle Conduct</p>
            <p className="text-[9px] font-medium text-[#91a2b6]">SUNN • Old Sagay</p>
          </div>
        </div>
        <span className="rounded-full bg-[#f4f7fb] px-2 py-1 text-[9px] font-bold text-[#7890aa]">{stateLabel}</span>
      </div>
      <div className="min-h-[390px] p-4 sm:p-7">{children}</div>
    </div>
  );
}

function PreviewHeader({ label, title, description }: { label: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8ca0b6]">{label}</p>
      <h3 className="mt-2 text-[21px] font-extrabold tracking-[-0.04em] text-[#163154]">{title}</h3>
      <p className="mt-1.5 max-w-[500px] text-[12px] leading-5 text-[#71859e]">{description}</p>
    </div>
  );
}

function InstallPreview({ installed, dismissed, onInstall, onDismiss }: { installed: boolean; dismissed: boolean; onInstall: () => void; onDismiss: () => void }) {
  return (
    <PreviewFrame stateLabel="Install App Prompt">
      <div className="flex h-full min-h-[340px] flex-col justify-between">
        <div>
          <PreviewHeader
            label="A quicker way to report"
            title="Keep Tricycle Conduct close by"
            description="Install the app for quick access when you need to share a concern on your route."
          />
          <div className="relative mt-7 overflow-hidden rounded-[20px] border border-[#dce9f7] bg-[#eef6ff] p-5">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#d8eaff]" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-white text-[#0c5bce] shadow-[0_8px_20px_rgba(12,91,206,0.12)]">
                <Smartphone size={24} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-[#193a63]">Install on this device</p>
                <p className="mt-1 text-[11px] leading-4 text-[#66809f]">
                  The app will be available from your home screen. You can remove it at any time.
                </p>
              </div>
            </div>
            <div className="relative mt-5 flex items-center gap-2 text-[10px] font-bold text-[#5a7593]">
              <Check size={13} className="text-[#21845a]" />
              Uses no additional account information
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={onDismiss} className="rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#71859e] hover:bg-[#f1f5f9]">
            Not now
          </button>
          <button
            type="button"
            onClick={onInstall}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0c5bce] px-5 py-2.5 text-[12px] font-extrabold text-white shadow-[0_8px_18px_rgba(12,91,206,0.2)] transition hover:bg-[#084da9]"
          >
            {installed ? <Check size={15} /> : <Smartphone size={15} />}
            {installed ? "Installed for preview" : "Install"}
          </button>
        </div>
        {dismissed ? <p className="mt-3 text-center text-[10px] font-semibold text-[#8ca0b6]">Install prompt dismissed for this preview.</p> : null}
      </div>
    </PreviewFrame>
  );
}

function OfflinePreview({ onRestore }: { onRestore: () => void }) {
  return (
    <PreviewFrame stateLabel="Offline state">
      <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
        <div className="relative">
          <div className="flex h-[78px] w-[78px] items-center justify-center rounded-[26px] bg-[#fff0e9] text-[#d76b42]">
            <CloudOff size={35} strokeWidth={1.6} />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-[#fbfdff] bg-[#d76b42] text-white">
            <WifiOff size={13} />
          </span>
        </div>
        <h3 className="mt-6 text-[21px] font-extrabold tracking-[-0.04em] text-[#163154]">You are currently offline.</h3>
        <p className="mt-2 max-w-[350px] text-[12px] leading-5 text-[#71859e]">
          Your connection appears to be unavailable. You can review information already loaded, but new changes may not be available right now.
        </p>
        <button
          type="button"
          onClick={onRestore}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#cddceb] bg-white px-4 py-2.5 text-[12px] font-extrabold text-[#315475] shadow-sm hover:border-[#9db9d7] hover:bg-[#f7fbff]"
        >
          <RefreshCw size={14} />
          Check connection
        </button>
        <p className="mt-4 text-[10px] font-semibold text-[#9aabbe]">Last checked just now</p>
      </div>
    </PreviewFrame>
  );
}

function RestoredPreview({ onContinue }: { onContinue: () => void }) {
  return (
    <PreviewFrame stateLabel="Connection restored">
      <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
        <div className="flex h-[78px] w-[78px] items-center justify-center rounded-[26px] bg-[#eaf7f1] text-[#21845a]">
          <CloudSun size={36} strokeWidth={1.6} />
        </div>
        <h3 className="mt-6 text-[21px] font-extrabold tracking-[-0.04em] text-[#163154]">Connection restored</h3>
        <p className="mt-2 max-w-[350px] text-[12px] leading-5 text-[#71859e]">
          You are back online. You can continue browsing and submit a new report when you are ready.
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#21845a] px-4 py-2.5 text-[12px] font-extrabold text-white shadow-[0_8px_18px_rgba(33,132,90,0.16)] hover:bg-[#176c48]"
        >
          Continue to dashboard
          <ChevronRight size={14} />
        </button>
        <div className="mt-5 flex items-center gap-1.5 text-[10px] font-bold text-[#21845a]">
          <CheckCircle2 size={13} />
          Connection checked just now
        </div>
      </div>
    </PreviewFrame>
  );
}

function LoadingPreview() {
  return (
    <PreviewFrame stateLabel="Loading state">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="h-2.5 w-20 animate-pulse rounded-full bg-[#dbe5f0]" />
            <div className="mt-3 h-6 w-52 animate-pulse rounded-lg bg-[#dbe5f0]" />
          </div>
          <LoaderCircle size={22} className="animate-spin text-[#0c5bce]" strokeWidth={1.8} />
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {["one", "two", "three", "four"].map((item, index) => (
            <div key={item} className="rounded-2xl border border-[#e3ebf3] bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 animate-pulse rounded-xl bg-[#eaf2ff]" />
                <div className="h-2.5 w-12 animate-pulse rounded-full bg-[#edf2f7]" />
              </div>
              <div className="mt-5 h-3 w-3/4 animate-pulse rounded-full bg-[#dbe5f0]" />
              <div className="mt-2 h-2.5 w-full animate-pulse rounded-full bg-[#edf2f7]" />
              <div className={`mt-2 h-2.5 animate-pulse rounded-full bg-[#edf2f7] ${index % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#8498ae]">
          <LoaderCircle size={14} className="animate-spin" />
          Loading your dashboard
        </div>
      </div>
    </PreviewFrame>
  );
}

function ErrorPreview({ onRetry }: { onRetry: () => void }) {
  return (
    <PreviewFrame stateLabel="Error state">
      <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
        <div className="flex h-[78px] w-[78px] items-center justify-center rounded-[26px] bg-[#fff0e9] text-[#d76b42]">
          <XCircle size={36} strokeWidth={1.6} />
        </div>
        <h3 className="mt-6 text-[21px] font-extrabold tracking-[-0.04em] text-[#163154]">You are unable to load this information right now.</h3>
        <p className="mt-2 max-w-[390px] text-[12px] leading-5 text-[#71859e]">
          Something interrupted the request. Check your connection and try again. Your existing reports have not been changed.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0c5bce] px-5 py-2.5 text-[12px] font-extrabold text-white shadow-[0_8px_18px_rgba(12,91,206,0.18)] hover:bg-[#084da9]"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
        <p className="mt-4 text-[10px] font-semibold text-[#9aabbe]">Error code: DEMO-204</p>
      </div>
    </PreviewFrame>
  );
}

function EmptyPreview({ option, actionAcknowledged, onAction }: { option: EmptyOption; actionAcknowledged: boolean; onAction: () => void }) {
  const Icon = option.icon;

  return (
    <PreviewFrame stateLabel="Empty state">
      <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
        <div className={`flex h-[78px] w-[78px] items-center justify-center rounded-[26px] ${option.iconClass}`}>
          <Icon size={34} strokeWidth={1.6} />
        </div>
        <h3 className="mt-6 text-[21px] font-extrabold tracking-[-0.04em] text-[#163154]">{option.title}</h3>
        <p className="mt-2 max-w-[355px] text-[12px] leading-5 text-[#71859e]">{option.description}</p>
        {option.key === "reports" ? (
          <button type="button" onClick={onAction} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0c5bce] px-4 py-2.5 text-[12px] font-extrabold text-white shadow-[0_8px_18px_rgba(12,91,206,0.18)] hover:bg-[#084da9]">
            <FileText size={14} />
            {actionAcknowledged ? "Report form ready in preview" : "Submit a report"}
          </button>
        ) : option.key === "notifications" ? (
          <button type="button" onClick={onAction} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#cddceb] bg-white px-4 py-2.5 text-[12px] font-extrabold text-[#315475] shadow-sm hover:bg-[#f7fbff]">
            <Check size={14} />
            {actionAcknowledged ? "All notifications are read" : "Mark as read"}
          </button>
        ) : (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f4f7fb] px-3 py-1.5 text-[10px] font-bold text-[#7890aa]">
            <Info size={13} />
            Nothing needs your attention
          </div>
        )}
      </div>
    </PreviewFrame>
  );
}

function StateDetails({ activeState, emptyOption }: { activeState: StateKey; emptyOption: EmptyOption }) {
  const details: Record<StateKey, { label: string; title: string; description: string; accent: string }> = {
    install: {
      label: "Entry point",
      title: "Invite, don’t interrupt",
      description: "A lightweight install prompt gives students a clear benefit and leaves room to dismiss it.",
      accent: "bg-[#eaf2ff] text-[#0c5bce]",
    },
    offline: {
      label: "Network awareness",
      title: "Set the right expectation",
      description: "The offline state distinguishes available information from actions that need a connection.",
      accent: "bg-[#fff0e9] text-[#d76b42]",
    },
    restored: {
      label: "Recovery moment",
      title: "Make the return feel clear",
      description: "A brief confirmation helps students understand that the app is ready again without implying a report was sent.",
      accent: "bg-[#eaf7f1] text-[#21845a]",
    },
    loading: {
      label: "Progressive reveal",
      title: "Show the shape of what is coming",
      description: "Skeleton cards preserve the page rhythm while dashboard information is being prepared.",
      accent: "bg-[#eaf2ff] text-[#0c5bce]",
    },
    error: {
      label: "Recovery path",
      title: "Explain what happened",
      description: "The message stays neutral, confirms existing reports are safe, and gives the user one clear next step.",
      accent: "bg-[#fff0e9] text-[#d76b42]",
    },
    empty: {
      label: "First-use guidance",
      title: "An empty space can still help",
      description: `The ${emptyOption.label.toLowerCase()} variant gives context without treating an absence of data as a problem.`,
      accent: emptyOption.iconClass,
    },
  };
  const detail = details[activeState];

  return (
    <aside className="rounded-[24px] border border-[#dbe5f0] bg-white p-5 shadow-[0_14px_35px_rgba(34,67,107,0.05)] lg:p-6">
      <div className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${detail.accent}`}>
        <Info size={18} strokeWidth={1.9} />
      </div>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8ca0b6]">{detail.label}</p>
      <h2 className="mt-2 text-[20px] font-extrabold tracking-[-0.04em] text-[#163154]">{detail.title}</h2>
      <p className="mt-2 text-[12px] leading-5 text-[#71859e]">{detail.description}</p>

      <div className="mt-7 border-t border-[#e7eef5] pt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8ca0b6]">Design notes</p>
        <ul className="mt-3 space-y-3">
          {[
            "Neutral copy keeps a report separate from a confirmed violation.",
            "One primary action keeps recovery moments easy to scan.",
            "Soft color signals context without adding urgency.",
          ].map((note) => (
            <li key={note} className="flex gap-2.5 text-[11px] leading-4 text-[#607996]">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#7ca0c6]" />
              {note}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7 rounded-2xl bg-[#f4f8fc] p-4">
        <div className="flex items-center gap-2 text-[#315475]">
          <MapPin size={14} />
          <p className="text-[11px] font-extrabold">Old Sagay • SUNN</p>
        </div>
        <p className="mt-1.5 text-[10px] leading-4 text-[#8195aa]">Visual-only prototype state. No records are sent or changed.</p>
      </div>
    </aside>
  );
}

export function PWAStates() {
  const [activeState, setActiveState] = useState<StateKey>("install");
  const [activeEmpty, setActiveEmpty] = useState<EmptyKey>("reports");
  const [installed, setInstalled] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [emptyActionAcknowledged, setEmptyActionAcknowledged] = useState(false);

  const selectedEmpty = emptyOptions.find((option) => option.key === activeEmpty) ?? emptyOptions[0];

  const showLoadingThen = (nextState: StateKey) => {
    setActiveState("loading");
    window.setTimeout(() => setActiveState(nextState), 800);
  };

  const renderPreview = () => {
    if (activeState === "install") {
      return <InstallPreview installed={installed} dismissed={installDismissed} onInstall={() => setInstalled(true)} onDismiss={() => setInstallDismissed(true)} />;
    }
    if (activeState === "offline") {
      return <OfflinePreview onRestore={() => showLoadingThen("restored")} />;
    }
    if (activeState === "restored") {
      return <RestoredPreview onContinue={() => showLoadingThen("install")} />;
    }
    if (activeState === "loading") {
      return <LoadingPreview />;
    }
    if (activeState === "error") {
      return <ErrorPreview onRetry={() => showLoadingThen("restored")} />;
    }
    return <EmptyPreview option={selectedEmpty} actionAcknowledged={emptyActionAcknowledged} onAction={() => setEmptyActionAcknowledged(true)} />;
  };

  return (
    <AppLayout active="Dashboard" title="PWA state gallery" eyebrow="Interface states">
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[28px] bg-[#12305a] px-6 py-7 text-white shadow-[0_18px_40px_rgba(18,48,90,0.16)] lg:px-9 lg:py-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-white/5" />
          <div className="absolute right-24 top-10 h-16 w-16 rounded-full bg-[#e8794f]/20 blur-xl" />
          <div className="relative max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatePill tone="orange">Visual-only prototype</StatePill>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#adc4de]">State library / 06 views</span>
            </div>
            <h2 className="mt-5 max-w-2xl text-[30px] font-extrabold leading-[1.04] tracking-[-0.055em] lg:text-[42px]">
              Clear states for every connection moment.
            </h2>
            <p className="mt-4 max-w-2xl text-[13px] leading-6 text-[#c2d3e6]">
              A visual gallery for SUNN students and authorized personnel in Barangay Old Sagay. These states set expectations without treating a report as a confirmed violation.
            </p>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dbe5f0] bg-white p-3 shadow-[0_12px_30px_rgba(34,67,107,0.04)]">
          <div className="flex flex-wrap gap-1.5">
            {stateTabs.map(({ key, label, icon: Icon }) => {
              const isActive = activeState === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveState(key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[11px] font-extrabold transition ${
                    isActive ? "bg-[#eaf2ff] text-[#0c5bce]" : "text-[#71859e] hover:bg-[#f4f7fb] hover:text-[#315475]"
                  }`}
                >
                  <Icon size={14} className={key === "loading" && isActive ? "animate-spin" : ""} strokeWidth={isActive ? 2.2 : 1.8} />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {activeState === "empty" ? (
          <section className="rounded-[24px] border border-[#dbe5f0] bg-white p-4 shadow-[0_12px_30px_rgba(34,67,107,0.04)] lg:p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8ca0b6]">Empty state variants</p>
                <p className="mt-1 text-[12px] text-[#71859e]">Switch between friendly first-use and no-data moments.</p>
              </div>
              <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1">
                {emptyOptions.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveEmpty(key);
                      setEmptyActionAcknowledged(false);
                    }}
                    className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-extrabold ${
                      activeEmpty === key ? "bg-[#163154] text-white" : "bg-[#f4f7fb] text-[#71859e] hover:bg-[#eaf2ff] hover:text-[#0c5bce]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.65fr)]">
          {renderPreview()}
          <StateDetails activeState={activeState} emptyOption={selectedEmpty} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[20px] border border-[#dbe5f0] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8ca0b6]">Prompt</p>
              <Smartphone size={16} className="text-[#0c5bce]" />
            </div>
            <p className="mt-5 text-[24px] font-extrabold tracking-[-0.05em] text-[#163154]">1 clear action</p>
            <p className="mt-1 text-[11px] leading-4 text-[#71859e]">Install remains optional and easy to dismiss.</p>
          </div>
          <div className="rounded-[20px] border border-[#dbe5f0] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8ca0b6]">Recovery</p>
              <RefreshCw size={16} className="text-[#21845a]" />
            </div>
            <p className="mt-5 text-[24px] font-extrabold tracking-[-0.05em] text-[#163154]">3 moments</p>
            <p className="mt-1 text-[11px] leading-4 text-[#71859e]">Offline, restored, and retry paths stay distinct.</p>
          </div>
          <div className="rounded-[20px] border border-[#dbe5f0] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8ca0b6]">Empty space</p>
              <Inbox size={16} className="text-[#d76b42]" />
            </div>
            <p className="mt-5 text-[24px] font-extrabold tracking-[-0.05em] text-[#163154]">5 variants</p>
            <p className="mt-1 text-[11px] leading-4 text-[#71859e]">Every no-data view gives the student context.</p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  ClipboardList,
  FileCheck2,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

type AppLayoutProps = {
  children: ReactNode;
  active?: string;
  officer?: boolean;
  title?: string;
  eyebrow?: string;
};

const studentNav = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Submit report", icon: ClipboardList },
  { label: "My reports", icon: FileCheck2 },
  { label: "Notifications", icon: Bell },
  { label: "Profile", icon: UserRound },
];

const officerNav = [
  { label: "Dashboard", icon: Gauge },
  { label: "Reports", icon: ClipboardList },
  { label: "Drivers", icon: UsersRound },
  { label: "Violations", icon: ShieldCheck },
  { label: "Analytics", icon: BarChart3 },
];

export function AppLayout({
  children,
  active = "Dashboard",
  officer = false,
  title,
  eyebrow,
}: AppLayoutProps) {
  const navItems = officer ? officerNav : studentNav;
  const displayTitle = title ?? (officer ? "Officer workspace" : "Student workspace");

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#132238]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-[#dbe5f0] bg-white px-5 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#0c5bce] text-white shadow-[0_6px_18px_rgba(12,91,206,0.22)]">
              <ShieldCheck size={21} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[13px] font-extrabold tracking-[-0.02em] text-[#12305a]">Tricycle Conduct</p>
              <p className="text-[11px] font-medium text-[#7890aa]">Old Sagay • SUNN</p>
            </div>
          </div>

          <div className="mt-11">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9aabbe]">
              {officer ? "Review center" : "My space"}
            </p>
            <nav className="mt-3 space-y-1.5">
              {navItems.map(({ label, icon: Icon }) => {
                const isActive = active === label;
                return (
                  <button
                    key={label}
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                      isActive
                        ? "bg-[#eaf2ff] text-[#0c5bce]"
                        : "text-[#71859e] hover:bg-[#f4f7fb] hover:text-[#23405f]"
                    }`}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    {label}
                    {label === "Notifications" && !officer ? (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e8794f] px-1 text-[10px] font-extrabold text-white">
                        3
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto">
            <div className="mb-4 rounded-2xl bg-[#f0f7ff] p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9ebff] text-[#0c5bce]">
                  <ShieldCheck size={16} />
                </div>
                <span className="rounded-full bg-[#dcf5eb] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#20885d]">
                  Demo mode
                </span>
              </div>
              <p className="mt-3 text-[12px] font-bold text-[#23405f]">Prototype preview</p>
              <p className="mt-1 text-[11px] leading-4 text-[#71859e]">
                All records shown here are fictional sample data.
              </p>
            </div>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#71859e] hover:bg-[#f4f7fb]"
            >
              <LogOut size={17} strokeWidth={1.8} />
              Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-20 lg:pb-0">
          <header className="sticky top-0 z-10 flex h-[74px] items-center justify-between border-b border-[#dbe5f0]/80 bg-[#f4f7fb]/90 px-5 backdrop-blur lg:px-10">
            <div className="flex items-center gap-3">
              <button type="button" className="rounded-xl p-2 text-[#6f849d] hover:bg-white lg:hidden" aria-label="Open navigation">
                <Menu size={20} />
              </button>
              <div>
                {eyebrow ? (
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8ca0b6]">{eyebrow}</p>
                ) : null}
                <h1 className="text-[17px] font-extrabold tracking-[-0.02em] text-[#163154] lg:text-[20px]">{displayTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button type="button" className="relative rounded-xl border border-[#dbe5f0] bg-white p-2.5 text-[#6d8199] shadow-sm" aria-label="Notifications">
                <Bell size={17} strokeWidth={1.8} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#e8794f]" />
              </button>
              <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#d9ebff] text-[12px] font-extrabold text-[#0c5bce] sm:flex">
                {officer ? "AR" : "MC"}
              </div>
            </div>
          </header>
          <div className="mx-auto w-full max-w-[1460px] px-5 py-7 lg:px-10 lg:py-9">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-[72px] items-center justify-around border-t border-[#dbe5f0] bg-white/95 px-2 backdrop-blur lg:hidden">
        {navItems.slice(0, 5).map(({ label, icon: Icon }) => {
          const isActive = active === label;
          return (
            <button key={label} type="button" className={`flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold ${isActive ? "text-[#0c5bce]" : "text-[#8ca0b6]"}`}>
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{label === "Submit report" ? "Report" : label.replace("My ", "")}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function MobileCloseButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl p-2 text-[#6f849d] hover:bg-[#f4f7fb]" aria-label="Close">
      <X size={18} />
    </button>
  );
}
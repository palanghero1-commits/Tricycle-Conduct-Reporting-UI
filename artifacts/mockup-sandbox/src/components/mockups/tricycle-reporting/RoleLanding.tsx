import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  Gauge,
  GraduationCap,
  KeyRound,
  MapPin,
  Route,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type RoleKey = "student" | "driver" | "officer" | "pnp" | "admin";

type RoleLandingConfig = {
  role: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  secondaryAction: string;
  dashboardPath: string;
  authRole: "student" | "driver" | "personnel";
  icon: LucideIcon;
  accent: string;
  softAccent: string;
  stats: { label: string; value: string; icon: LucideIcon }[];
  workflow: { title: string; detail: string; icon: LucideIcon }[];
};

const roleConfig: Record<RoleKey, RoleLandingConfig> = {
  student: {
    role: "Student",
    eyebrow: "Student reporting portal",
    title: "Report a ride concern and follow every update.",
    description:
      "A calm starting point for SUNN students to submit a concern, check status, and keep their transport records organized.",
    primaryAction: "Go to student dashboard",
    secondaryAction: "Create student account",
    dashboardPath: "StudentDashboard",
    authRole: "student",
    icon: GraduationCap,
    accent: "bg-[#0c5bce]",
    softAccent: "bg-[#eaf2ff] text-[#0c5bce]",
    stats: [
      { label: "Open reports", value: "2", icon: FileSearch },
      { label: "Resolved", value: "2", icon: BadgeCheck },
      { label: "Unread updates", value: "3", icon: BellRing },
    ],
    workflow: [
      { title: "Submit a report", detail: "Capture route, time, driver, and concern details.", icon: ClipboardList },
      { title: "Track review", detail: "Use your private reference to see progress.", icon: Route },
      { title: "Receive updates", detail: "Read review notes without retelling the concern.", icon: BellRing },
    ],
  },
  driver: {
    role: "Driver",
    eyebrow: "Driver information portal",
    title: "Keep your route profile and review notices clear.",
    description:
      "A driver-focused entry page for profile accuracy, association updates, and respectful handling of any concern linked to a vehicle record.",
    primaryAction: "Open driver profile",
    secondaryAction: "Sign in as driver",
    dashboardPath: "Profile",
    authRole: "driver",
    icon: Wrench,
    accent: "bg-[#237f7d]",
    softAccent: "bg-[#e5f5f2] text-[#237f7d]",
    stats: [
      { label: "Profile checks", value: "4", icon: UserRoundCheck },
      { label: "Route records", value: "2", icon: MapPin },
      { label: "Notices", value: "1", icon: BellRing },
    ],
    workflow: [
      { title: "Confirm details", detail: "Review name, plate, association, and route data.", icon: UserRoundCheck },
      { title: "View notices", detail: "See updates that need acknowledgment.", icon: BellRing },
      { title: "Respond fairly", detail: "Provide context only through authorized review.", icon: ClipboardCheck },
    ],
  },
  officer: {
    role: "TODA Officer",
    eyebrow: "TODA officer workspace",
    title: "See incoming reports before they become decisions.",
    description:
      "A focused entry page for association officers who need queue visibility, driver context, and careful routing.",
    primaryAction: "Go to officer dashboard",
    secondaryAction: "Sign in as officer",
    dashboardPath: "OfficerDashboard",
    authRole: "personnel",
    icon: Gauge,
    accent: "bg-[#1e638d]",
    softAccent: "bg-[#e8f1f7] text-[#1e638d]",
    stats: [
      { label: "New reports", value: "12", icon: FileSearch },
      { label: "In review", value: "7", icon: ClipboardCheck },
      { label: "Drivers listed", value: "144", icon: UsersRound },
    ],
    workflow: [
      { title: "Triage reports", detail: "Check recency, category, and route context.", icon: FileSearch },
      { title: "Review driver records", detail: "Match concerns to association records carefully.", icon: UsersRound },
      { title: "Route next steps", detail: "Escalate only when the review path requires it.", icon: Route },
    ],
  },
  pnp: {
    role: "PNP Reviewer",
    eyebrow: "Restricted review landing",
    title: "Open the review queue with privacy boundaries in place.",
    description:
      "A restricted starting point for authorized PNP personnel reviewing submitted reports, evidence, and internal notes.",
    primaryAction: "Open PNP review",
    secondaryAction: "Authorized sign in",
    dashboardPath: "PNPReview",
    authRole: "personnel",
    icon: ShieldCheck,
    accent: "bg-[#557ba4]",
    softAccent: "bg-[#edf3f8] text-[#557ba4]",
    stats: [
      { label: "For review", value: "2", icon: FileSearch },
      { label: "Follow-up", value: "1", icon: ClipboardList },
      { label: "Resolved", value: "1", icon: BadgeCheck },
    ],
    workflow: [
      { title: "Verify context", detail: "Review report details before recording any observation.", icon: FileSearch },
      { title: "Add notes", detail: "Keep the internal review trail clear and limited.", icon: ClipboardCheck },
      { title: "Close carefully", detail: "Separate reports from confirmed findings.", icon: ShieldCheck },
    ],
  },
  admin: {
    role: "Administrator",
    eyebrow: "System administration portal",
    title: "Manage users, queues, and record quality in one place.",
    description:
      "An administrative landing page for keeping access, reports, driver records, and system activity visible.",
    primaryAction: "Open admin console",
    secondaryAction: "Admin sign in",
    dashboardPath: "AdminDashboard",
    authRole: "personnel",
    icon: KeyRound,
    accent: "bg-[#806c8f]",
    softAccent: "bg-[#f1edf5] text-[#806c8f]",
    stats: [
      { label: "Users", value: "1,284", icon: UsersRound },
      { label: "Pending", value: "12", icon: FileSearch },
      { label: "System events", value: "24", icon: Gauge },
    ],
    workflow: [
      { title: "Manage access", detail: "Keep role permissions and accounts aligned.", icon: KeyRound },
      { title: "Monitor records", detail: "Audit report queues and driver directory quality.", icon: ClipboardCheck },
      { title: "Review activity", detail: "Track administrative changes without implying outcomes.", icon: Gauge },
    ],
  },
};

function previewUrl(component: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/preview/tricycle-reporting/${component}`;
}

function goTo(component: string) {
  window.location.href = previewUrl(component);
}

function goToAuth(mode: "login" | "register", role: RoleLandingConfig["authRole"]) {
  window.location.href = `${previewUrl("Auth")}?mode=${mode}&role=${role}`;
}

function RoleLandingView({ roleKey }: { roleKey: RoleKey }) {
  const config = roleConfig[roleKey];
  const Icon = config.icon;

  return (
    <div className="min-h-[100dvh] bg-[#f6f9fc] text-[#142d4d]">
      <header className="border-b border-[#dce7ef] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1220px] items-center justify-between px-5 lg:px-8">
          <button type="button" onClick={() => goTo("Landing")} className="flex items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#0c5bce] text-white">
              <ShieldCheck size={20} />
            </span>
            <span>
              <span className="block text-[13px] font-extrabold text-[#15375e]">Tricycle Conduct</span>
              <span className="block text-[11px] font-semibold text-[#8197ad]">Old Sagay / SUNN</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => goToAuth("login", config.authRole)}
            className="rounded-xl border border-[#d5e2ec] bg-white px-4 py-2 text-[12px] font-extrabold text-[#55708b] hover:border-[#aec6da] hover:text-[#0c5bce]"
          >
            Sign in
          </button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1220px] gap-10 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_430px] lg:px-8 lg:py-16">
          <div>
            <div className={`mb-6 inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] ${config.softAccent}`}>
              <Icon size={14} />
              {config.eyebrow}
            </div>
            <h1 className="max-w-[760px] text-[clamp(2.25rem,5vw,4.8rem)] font-extrabold leading-[1.02] tracking-[-0.055em] text-[#15375e]">
              {config.title}
            </h1>
            <p className="mt-6 max-w-[610px] text-[16px] leading-7 text-[#668199]">{config.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => goTo(config.dashboardPath)}
                className={`inline-flex items-center justify-center gap-2 rounded-[13px] px-5 py-3.5 text-[13px] font-extrabold text-white shadow-[0_12px_24px_rgba(27,74,116,0.16)] ${config.accent}`}
              >
                {config.primaryAction}
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => goToAuth(roleKey === "student" ? "register" : "login", config.authRole)}
                className="inline-flex items-center justify-center gap-2 rounded-[13px] border border-[#cfdeea] bg-white px-5 py-3.5 text-[13px] font-extrabold text-[#315271] hover:border-[#acc9e3] hover:text-[#0c5bce]"
              >
                {config.secondaryAction}
              </button>
            </div>
          </div>

          <aside className="rounded-[24px] border border-[#d5e2ec] bg-white p-5 shadow-[0_18px_44px_rgba(33,75,116,0.08)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8ca0b6]">Role view</p>
                <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.035em] text-[#173858]">{config.role}</h2>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-[16px] text-white ${config.accent}`}>
                <Icon size={22} />
              </span>
            </div>
            <div className="mt-6 grid gap-3">
              {config.stats.map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center justify-between rounded-2xl bg-[#f5f8fb] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${config.softAccent}`}>
                        <StatIcon size={16} />
                      </span>
                      <span className="text-[12px] font-bold text-[#607b94]">{stat.label}</span>
                    </div>
                    <span className="font-mono text-[18px] font-bold tracking-[-0.04em] text-[#173858]">{stat.value}</span>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>

        <section className="border-y border-[#dce7ef] bg-white">
          <div className="mx-auto grid max-w-[1220px] gap-3 px-5 py-8 md:grid-cols-3 lg:px-8">
            {config.workflow.map((item, index) => {
              const ItemIcon = item.icon;
              return (
                <article key={item.title} className="rounded-[18px] border border-[#dce7ef] bg-[#fbfdff] p-5">
                  <div className="flex items-center justify-between">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${config.softAccent}`}>
                      <ItemIcon size={18} />
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#a3b4c5]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-[15px] font-extrabold text-[#244665]">{item.title}</h3>
                  <p className="mt-2 text-[12px] leading-5 text-[#7b91a6]">{item.detail}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export function StudentLanding() {
  return <RoleLandingView roleKey="student" />;
}

export function DriverLanding() {
  return <RoleLandingView roleKey="driver" />;
}

export function OfficerLanding() {
  return <RoleLandingView roleKey="officer" />;
}

export function PNPLanding() {
  return <RoleLandingView roleKey="pnp" />;
}

export function AdminLanding() {
  return <RoleLandingView roleKey="admin" />;
}

export default RoleLandingView;

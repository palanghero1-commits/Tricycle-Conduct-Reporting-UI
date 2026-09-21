import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Database,
  Filter,
  Gauge,
  Info,
  ListFilter,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRoundCheck,
  UserRoundCog,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { apiRequest, formatPhilippineDateTime, getCurrentUser } from "../../../lib/api";

type ReportStatus = "Pending review" | "In review" | "Resolved";
type ActivityKind = "All activity" | "Reports" | "Users" | "System";

type Report = {
  id: string;
  subject: string;
  location: string;
  category: string;
  status: ReportStatus;
  received: string;
  reference: string;
};

type ActivityItem = {
  label: string;
  detail: string;
  kind: Exclude<ActivityKind, "All activity">;
  tone: string;
};

const reports: Report[] = [
  {
    id: "RPT-2418",
    subject: "Fare concern submitted for review",
    location: "Old Sagay Public Market",
    category: "Fare concern",
    status: "Pending review",
    received: "18 min ago",
    reference: "SUNN-0841",
  },
  {
    id: "RPT-2417",
    subject: "Conduct concern linked to route record",
    location: "SUNN Gate 2",
    category: "Conduct",
    status: "In review",
    received: "1 hr ago",
    reference: "SUNN-0839",
  },
  {
    id: "RPT-2416",
    subject: "Possible route deviation noted",
    location: "Sagay Wharf Road",
    category: "Route concern",
    status: "Pending review",
    received: "2 hrs ago",
    reference: "SUNN-0837",
  },
  {
    id: "RPT-2415",
    subject: "Vehicle identification card concern",
    location: "SUNN Student Center",
    category: "Vehicle condition",
    status: "Resolved",
    received: "Yesterday",
    reference: "SUNN-0828",
  },
  {
    id: "RPT-2414",
    subject: "Peak-hour fare clarification requested",
    location: "Old Sagay Terminal",
    category: "Fare concern",
    status: "In review",
    received: "Yesterday",
    reference: "SUNN-0824",
  },
];

const activity: ActivityItem[] = [
  {
    label: "Report RPT-2417 moved to in review",
    detail: "A. Reyes · 34 min ago",
    kind: "Reports",
    tone: "bg-[#347caf]",
  },
  {
    label: "New student account added to directory",
    detail: "System · 1 hr ago",
    kind: "Users",
    tone: "bg-[#6d9a82]",
  },
  {
    label: "Follow-up note added to RPT-2415",
    detail: "M. Cabal · 1 hr ago",
    kind: "Reports",
    tone: "bg-[#c28a4b]",
  },
  {
    label: "Weekly data snapshot completed",
    detail: "System · 2 hrs ago",
    kind: "System",
    tone: "bg-[#806f92]",
  },
  {
    label: "Authorized personnel record updated",
    detail: "J. Dela Cruz · 3 hrs ago",
    kind: "Users",
    tone: "bg-[#568e96]",
  },
  {
    label: "Review queue assignment changed",
    detail: "System · Yesterday",
    kind: "System",
    tone: "bg-[#8e9cab]",
  },
];

const statDefinitions = [
  {
    key: "totalUsers",
    label: "Total users",
    value: "0",
    detail: "Live count",
    icon: UsersRound,
    accent: "bg-[#2c78ad]",
    direction: "up" as const,
  },
  {
    key: "students",
    label: "SUNN students",
    value: "0",
    detail: "Live count",
    icon: UserRoundCheck,
    accent: "bg-[#5b8e84]",
    direction: "up" as const,
  },
  {
    key: "personnel",
    label: "Authorized personnel",
    value: "0",
    detail: "Live count",
    icon: UserRoundCog,
    accent: "bg-[#806c8f]",
    direction: "up" as const,
  },
  {
    key: "drivers",
    label: "Registered drivers",
    value: "0",
    detail: "Active records",
    icon: ClipboardCheck,
    accent: "bg-[#bd7e3e]",
    direction: "up" as const,
  },
  {
    key: "reports",
    label: "Reports received",
    value: "0",
    detail: "Live count",
    icon: Activity,
    accent: "bg-[#397ca5]",
    direction: "up" as const,
  },
  {
    key: "pendingReports",
    label: "Pending reports",
    value: "0",
    detail: "Needs review",
    icon: Clock3,
    accent: "bg-[#c18542]",
    direction: "up" as const,
  },
  {
    key: "resolvedReports",
    label: "Resolved reports",
    value: "0",
    detail: "Resolved or closed",
    icon: CheckCircle2,
    accent: "bg-[#5c937c]",
    direction: "up" as const,
  },
  {
    key: "violations",
    label: "Confirmed violations",
    value: "0",
    detail: "Separate finding record",
    icon: ShieldAlert,
    accent: "bg-[#87677f]",
    direction: "down" as const,
  },
];

function previewUrl(component: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/preview/tricycle-reporting/${component}`;
}

function navigateTo(component: string) {
  window.location.href = previewUrl(component);
}

function StatusPill({ status }: { status: ReportStatus }) {
  const styles: Record<ReportStatus, string> = {
    "Pending review": "border-[#f0d6b7] bg-[#fff8ef] text-[#a3672d]",
    "In review": "border-[#c8d9ea] bg-[#f1f6fb] text-[#2c6595]",
    Resolved: "border-[#cbe3d5] bg-[#f0f8f3] text-[#4d8065]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
  direction,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent: string;
  direction: "up" | "down";
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d9e3ec] bg-white p-4 shadow-[0_5px_20px_rgba(39,67,93,0.04)] sm:p-5">
      <div
        className={`absolute right-0 top-0 h-20 w-20 translate-x-7 -translate-y-7 rounded-full ${accent} opacity-[0.09]`}
      />
      <div className="flex items-start justify-between gap-2">
        <p className="max-w-[130px] text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-[#8193a8]">
          {label}
        </p>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${accent} text-white`}
        >
          <Icon size={16} strokeWidth={2} />
        </div>
      </div>
      <p className="mt-5 font-mono text-[25px] font-bold tracking-[-0.06em] text-[#183654]">
        {value}
      </p>
      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#71859c]">
        {direction === "up" ? (
          <ArrowUpRight size={12} className="text-[#528770]" />
        ) : (
          <ArrowDownRight size={12} className="text-[#528770]" />
        )}
        <span className="text-[#528770]">{detail}</span>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  useEffect(() => {
    if (getCurrentUser()?.role !== "SUPERADMIN") {
      window.location.replace(previewUrl("AdminAccess"));
    }
  }, []);

  const [activePanel, setActivePanel] = useState<
    "Overview" | "Activity" | "People"
  >("Overview");
  const [statusFilter, setStatusFilter] = useState<
    "All reports" | ReportStatus
  >("All reports");
  const [activityFilter, setActivityFilter] =
    useState<ActivityKind>("All activity");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("RPT-2418");
  const [notice, setNotice] = useState("");
  const [directory, setDirectory] = useState<{
    students: Array<Record<string, string>>;
    drivers: Array<Record<string, string>>;
    personnel: Array<Record<string, string>>;
    presidents: Array<Record<string, string>>;
  }>({ students: [], drivers: [], personnel: [], presidents: [] });
  const [liveStats, setLiveStats] = useState<Record<string, number> | null>(
    null,
  );
  const [liveReports, setLiveReports] = useState<Report[]>([]);
  const [liveActivity, setLiveActivity] = useState<ActivityItem[]>([]);
  const [showPersonnelForm, setShowPersonnelForm] = useState(false);
  const [isCreatingPersonnel, setIsCreatingPersonnel] = useState(false);
  const [personnelForm, setPersonnelForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "AUTHORIZED_PERSONNEL",
    personnelType: "BARANGAY_STAFF",
    officeName: "",
    positionTitle: "",
  });

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const exportSnapshot = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      stats: liveStats ?? {},
      reports: liveReports,
      activity: liveActivity,
      directory,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tricycle-conduct-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    announce("Live snapshot exported.");
  };

  const loadDashboard = () =>
    apiRequest<{
      stats: Record<string, number>;
      reports: Array<{
        id: string;
        location: string;
        category: string;
        status: string;
        received: string;
        reference: string;
        subject: string;
      }>;
      activity: Array<{
        action: string;
        targetType: string | null;
        createdAt: string;
        actor: string;
      }>;
    }>("/admin/dashboard").then((data) => {
      setLiveStats(data.stats);
      setLiveReports(
        data.reports.map(
          (report) =>
            ({
              ...report,
              status:
                report.status === "RESOLVED" || report.status === "CLOSED"
                  ? "Resolved"
                  : report.status === "UNDER_REVIEW" ||
                      report.status === "REFERRED"
                    ? "In review"
                    : "Pending review",
            }) as Report,
        ),
      );
      setLiveActivity(
        data.activity.map((item) => ({
          label: item.action.replaceAll("_", " "),
          detail: `${item.actor} · ${formatPhilippineDateTime(item.createdAt)}`,
          kind:
            item.targetType === "users"
              ? "Users"
              : item.targetType === "complaints"
                ? "Reports"
                : "System",
          tone:
            item.targetType === "users"
              ? "bg-[#6d9a82]"
              : item.targetType === "complaints"
                ? "bg-[#347caf]"
                : "bg-[#806f92]",
        })),
      );
    });

  const createPersonnel = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreatingPersonnel(true);
    apiRequest("/users/authorized-personnel", {
      method: "POST",
      body: JSON.stringify(personnelForm),
    })
      .then(() => {
        setPersonnelForm({
          fullName: "",
          email: "",
          password: "",
          role: "AUTHORIZED_PERSONNEL",
          personnelType: "BARANGAY_STAFF",
          officeName: "",
          positionTitle: "",
        });
        setShowPersonnelForm(false);
        announce("Authorized personnel account created.");
        return loadDashboard();
      })
      .catch((error) =>
        announce(
          error instanceof Error
            ? error.message
            : "Unable to create the account.",
        ),
      )
      .finally(() => setIsCreatingPersonnel(false));
  };

  const deactivateAccount = (id: string, name: string) => {
    if (
      !window.confirm(
        `Permanently delete ${name}'s account? Audit history and reports will be preserved without the account.`,
      )
    )
      return;
    apiRequest(`/admin/users/${id}`, { method: "DELETE" })
      .then(() => {
        announce("Account deleted.");
        return loadDashboard();
      })
      .then(() =>
        apiRequest<typeof directory>("/admin/directory").then(setDirectory),
      )
      .catch((error) =>
        announce(
          error instanceof Error
            ? error.message
            : "Unable to delete the account.",
        ),
      );
  };

  useEffect(() => {
    void loadDashboard().catch(() =>
      announce("Unable to load live dashboard data."),
    );
    const timer = window.setInterval(() => {
      void loadDashboard().catch(() => undefined);
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activePanel !== "People") return;
    apiRequest<typeof directory>("/admin/directory")
      .then(setDirectory)
      .catch(() => announce("Unable to load the account directory."));
  }, [activePanel]);

  const filteredReports = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return liveReports.filter((report) => {
      const matchesStatus =
        statusFilter === "All reports" || report.status === statusFilter;
      const matchesSearch =
        !term ||
        `${report.id} ${report.subject} ${report.location} ${report.category}`
          .toLowerCase()
          .includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [searchTerm, statusFilter]);

  const filteredActivity = useMemo(
    () =>
      liveActivity.filter(
        (item) =>
          activityFilter === "All activity" || item.kind === activityFilter,
      ),
    [activityFilter, liveActivity],
  );

  const selectedReport = liveReports.find(
    (report) => report.id === selectedReportId,
  );

  return (
    <AppLayout
      officer
      active="Dashboard"
      title="Administrator console"
      eyebrow="System administration · Old Sagay / SUNN"
    >
      <div className="space-y-7">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b9d4cf] bg-[#edf7f4] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#39766c]">
                <ShieldCheck size={12} /> Administrator
              </span>
              <span className="rounded-full border border-[#d8e1eb] bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#66809b]">
                Admin access
              </span>
            </div>
            <h2 className="max-w-[760px] text-[29px] font-extrabold leading-[1.05] tracking-[-0.045em] text-[#173554] sm:text-[36px]">
              Operations, kept in view.
            </h2>
            <p className="mt-3 max-w-[690px] text-[13px] leading-6 text-[#6f8399]">
              A system overview for managing people, review queues, and record
              quality across the SUNN civic reporting program.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                loadDashboard()
                  .then(() => announce("Administrator snapshot refreshed"))
                  .catch(() => announce("Unable to refresh dashboard data."))
              }
              className="inline-flex items-center gap-2 rounded-xl border border-[#d5e0ea] bg-white px-3.5 py-2.5 text-[12px] font-bold text-[#55708d] transition hover:border-[#a9c2d8] hover:text-[#245d8e]"
            >
              <RefreshCw size={15} /> Refresh view
            </button>
            <button
              type="button"
              onClick={exportSnapshot}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1e638d] px-3.5 py-2.5 text-[12px] font-bold text-white shadow-[0_5px_14px_rgba(30,99,141,0.2)] transition hover:bg-[#194f72]"
            >
              <Database size={15} /> Export snapshot
            </button>
          </div>
        </section>

        <div className="flex items-center gap-1 border-b border-[#dbe5ed]">
          {(["Overview", "People", "Activity"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActivePanel(tab)}
              className={`relative px-3 pb-3 pt-1 text-[12px] font-extrabold transition ${activePanel === tab ? "text-[#1f638d]" : "text-[#8b9caf] hover:text-[#4f6e89]"}`}
            >
              {tab === "Activity" ? (
                <Activity size={14} className="mr-1.5 inline" />
              ) : (
                <Gauge size={14} className="mr-1.5 inline" />
              )}
              {tab}
              {activePanel === tab ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#2d759c]" />
              ) : null}
            </button>
          ))}
        </div>

        {activePanel === "People" ? (
          <section className="space-y-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h3 className="text-[20px] font-extrabold text-[#1a3856]">
                  Registered account directory
                </h3>
                <p className="mt-1 text-[12px] text-[#8396a9]">
                  All students, drivers, authorized personnel, and TODA
                  presidents currently registered in the system.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPersonnelForm((open) => !open)}
                className="rounded-xl bg-[#1e638d] px-3.5 py-2.5 text-[11px] font-extrabold text-white hover:bg-[#194f72]"
              >
                {showPersonnelForm
                  ? "Close form"
                  : "Create authorized personnel"}
              </button>
            </div>
            {showPersonnelForm ? (
              <form
                onSubmit={createPersonnel}
                className="grid gap-3 rounded-2xl border border-[#cfe0ea] bg-[#f5fafc] p-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                <input
                  required
                  autoComplete="off"
                  placeholder="Full name"
                  value={personnelForm.fullName}
                  onChange={(event) =>
                    setPersonnelForm({
                      ...personnelForm,
                      fullName: event.target.value,
                    })
                  }
                  className="rounded-xl border border-[#d7e3eb] bg-white px-3 py-2.5 text-[12px] outline-none"
                />
                <input
                  required
                  autoComplete="off"
                  type="email"
                  placeholder="Email"
                  value={personnelForm.email}
                  onChange={(event) =>
                    setPersonnelForm({
                      ...personnelForm,
                      email: event.target.value,
                    })
                  }
                  className="rounded-xl border border-[#d7e3eb] bg-white px-3 py-2.5 text-[12px] outline-none"
                />
                <input
                  required
                  minLength={8}
                  autoComplete="new-password"
                  type="password"
                  placeholder="Temporary password"
                  value={personnelForm.password}
                  onChange={(event) =>
                    setPersonnelForm({
                      ...personnelForm,
                      password: event.target.value,
                    })
                  }
                  className="rounded-xl border border-[#d7e3eb] bg-white px-3 py-2.5 text-[12px] outline-none"
                />
                <div className="flex items-center rounded-xl border border-[#d7e3eb] bg-[#eaf4f8] px-3 py-2.5 text-[12px] font-bold text-[#315d7c]">
                  Authorized personnel account
                </div>
                <input
                  placeholder="Office name"
                  value={personnelForm.officeName}
                  onChange={(event) =>
                    setPersonnelForm({
                      ...personnelForm,
                      officeName: event.target.value,
                    })
                  }
                  className="rounded-xl border border-[#d7e3eb] bg-white px-3 py-2.5 text-[12px] outline-none"
                />
                <input
                  placeholder="Position title"
                  value={personnelForm.positionTitle}
                  onChange={(event) =>
                    setPersonnelForm({
                      ...personnelForm,
                      positionTitle: event.target.value,
                    })
                  }
                  className="rounded-xl border border-[#d7e3eb] bg-white px-3 py-2.5 text-[12px] outline-none"
                />
                <button
                  disabled={isCreatingPersonnel}
                  className="rounded-xl bg-[#2b8f81] px-3 py-2.5 text-[11px] font-extrabold text-white disabled:opacity-60 sm:col-span-2 lg:col-span-3"
                >
                  {isCreatingPersonnel
                    ? "Creating PNP account…"
                    : "Create account"}
                </button>
              </form>
            ) : null}
            <div className="grid gap-5 xl:grid-cols-2">
              {(
                [
                  [
                    "Students",
                    directory.students,
                    ["studentId", "program", "yearLevel"],
                  ],
                  [
                    "Drivers",
                    directory.drivers,
                    ["driverCode", "tricycleIdentifier", "todaName"],
                  ],
                  [
                    "Authorized personnel",
                    directory.personnel,
                    ["personnelType", "officeName", "positionTitle"],
                  ],
                  ["TODA presidents", directory.presidents, ["todaName"]],
                ] as const
              ).map(([title, records, fields]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[14px] font-extrabold text-[#1a3856]">
                      {title}
                    </h4>
                    <span className="rounded-full bg-[#eef5f9] px-2 py-1 text-[10px] font-bold text-[#55758f]">
                      {records.length}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {records.length ? (
                      records.map((record) => (
                        <div
                          key={record.id}
                          className="rounded-xl border border-[#edf1f5] bg-[#fbfcfd] px-3 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[12px] font-extrabold text-[#315574]">
                                {record.fullName}
                              </p>
                              <p className="mt-1 text-[11px] text-[#71869b]">
                                {record.email || "No email"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold ${record.status === "ACTIVE" ? "text-[#4d8065]" : "text-[#a36b35]"}`}
                              >
                                {record.status}
                              </span>
                              {record.status === "ACTIVE" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    deactivateAccount(
                                      record.id,
                                      record.fullName,
                                    )
                                  }
                                  className="rounded-lg px-2 py-1 text-[10px] font-bold text-[#b05b4c] hover:bg-[#fff1ee]"
                                >
                          Delete
                                </button>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#8497a8]">
                            {fields.map((field) =>
                              record[field] ? (
                                <span key={field}>{record[field]}</span>
                              ) : null,
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl bg-[#f7f9fa] p-4 text-[11px] text-[#8294a4]">
                        No registered accounts yet.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : activePanel === "Overview" ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {statDefinitions.map(({ key: statKey, ...stat }) => (
                <MetricCard
                  key={stat.label}
                  {...stat}
                  value={
                    liveStats ? String(liveStats[statKey] ?? 0) : stat.value
                  }
                />
              ))}
            </section>

            <section className="rounded-2xl border border-[#cfdfeb] bg-[#eaf4f8] px-4 py-3.5 sm:px-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d2e7ef] text-[#397a91]">
                  <Info size={15} />
                </div>
                <p className="text-[11px] leading-5 text-[#527184]">
                  <span className="font-extrabold text-[#28586c]">
                    Administrative view, not a finding.
                  </span>{" "}
                  Submitted reports describe concerns for review. A report or
                  complaint is not a confirmed violation; confirmed findings are
                  recorded separately after due process.
                </p>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
              <div className="min-w-0 rounded-2xl border border-[#d9e3ec] bg-white shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
                <div className="border-b border-[#e6edf3] px-5 pb-4 pt-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-extrabold tracking-[-0.02em] text-[#1a3856]">
                          Recent reports
                        </h3>
                        <span className="rounded-full bg-[#f1f5f8] px-2 py-0.5 font-mono text-[10px] font-bold text-[#778da3]">
                          {filteredReports.length} shown
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#8396a9]">
                        Newest submissions across the review center.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-2.5 top-2.5 text-[#93a5b7]"
                        />
                        <input
                          aria-label="Search recent reports"
                          value={searchTerm}
                          onChange={(event) =>
                            setSearchTerm(event.target.value)
                          }
                          placeholder="Search reports"
                          className="h-9 w-full rounded-lg border border-[#dce5ed] bg-[#fbfcfd] pl-8 pr-3 text-[11px] font-medium text-[#36536f] outline-none placeholder:text-[#9aaaba] focus:border-[#8fb6cf] sm:w-[145px]"
                        />
                      </div>
                      <div className="relative">
                        <Filter
                          size={13}
                          className="pointer-events-none absolute left-2.5 top-2.5 text-[#8398aa]"
                        />
                        <select
                          aria-label="Filter reports by status"
                          value={statusFilter}
                          onChange={(event) =>
                            setStatusFilter(
                              event.target.value as
                                "All reports" | ReportStatus,
                            )
                          }
                          className="h-9 appearance-none rounded-lg border border-[#dce5ed] bg-[#fbfcfd] py-1 pl-8 pr-7 text-[10px] font-bold text-[#658098] outline-none"
                        >
                          <option>All reports</option>
                          <option>Pending review</option>
                          <option>In review</option>
                          <option>Resolved</option>
                        </select>
                        <ChevronDown
                          size={13}
                          className="pointer-events-none absolute right-2 top-2.5 text-[#8195a8]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden grid-cols-[0.82fr_1.15fr_0.78fr_0.55fr] gap-3 border-b border-[#edf1f5] px-5 py-2.5 text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#9aaaba] md:grid">
                  <span>Reference</span>
                  <span>Location / topic</span>
                  <span>Status</span>
                  <span className="text-right">Received</span>
                </div>
                <div className="divide-y divide-[#edf1f5]">
                  {filteredReports.length ? (
                    filteredReports.map((report) => (
                      <button
                        key={report.id}
                        type="button"
                        onClick={() => setSelectedReportId(report.id)}
                        className={`grid w-full gap-3 px-5 py-4 text-left transition hover:bg-[#f8fbfd] md:grid-cols-[0.82fr_1.15fr_0.78fr_0.55fr] md:items-center ${selectedReportId === report.id ? "bg-[#f5f9fc]" : "bg-white"}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${report.status === "Pending review" ? "bg-[#d58b3d]" : report.status === "In review" ? "bg-[#4381ad]" : "bg-[#65a07e]"}`}
                            />
                            <span className="font-mono text-[11px] font-bold text-[#2b5576]">
                              {report.id}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[10px] font-semibold text-[#9aabba]">
                            {report.reference}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-bold text-[#345570]">
                            {report.location}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-[#8a9bac]">
                            {report.category} · {report.subject}
                          </p>
                        </div>
                        <div>
                          <StatusPill status={report.status} />
                        </div>
                        <div className="flex items-center justify-between md:block md:text-right">
                          <span className="text-[10px] font-semibold text-[#71869b]">
                            {report.received}
                          </span>
                          <ChevronRight
                            size={15}
                            className="inline text-[#b1bfcb] md:hidden"
                          />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-5 py-12 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f5f8] text-[#8297a9]">
                        <Search size={18} />
                      </div>
                      <p className="mt-3 text-[12px] font-bold text-[#4a667e]">
                        No reports match this view
                      </p>
                      <p className="mt-1 text-[11px] text-[#8c9eaf]">
                        Try another status or search term.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-[#edf1f5] px-5 py-3.5">
                  <p className="text-[10px] font-semibold text-[#97a7b6]">
                    Live database records · no outcome implied
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo("ReviewWorkspace")}
                    className="text-[11px] font-extrabold text-[#2d6e9b] hover:text-[#1d5278]"
                  >
                    Open reports{" "}
                    <ChevronRight size={13} className="ml-1 inline" />
                  </button>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a5b5]">
                        Selected report
                      </p>
                      <h3 className="mt-1.5 font-mono text-[15px] font-bold text-[#214765]">
                        {selectedReport?.id ?? "—"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      aria-label="Clear selected report"
                      onClick={() => setSelectedReportId("")}
                      className="rounded-lg p-1 text-[#9aacba] hover:bg-[#f2f6f8] hover:text-[#52708b]"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  {selectedReport ? (
                    <>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <StatusPill status={selectedReport.status} />
                        <span className="text-[10px] font-semibold text-[#91a1af]">
                          {selectedReport.received}
                        </span>
                      </div>
                      <p className="mt-4 text-[12px] font-bold leading-5 text-[#355570]">
                        {selectedReport.subject}
                      </p>
                      <div className="mt-4 space-y-2 border-t border-[#edf1f5] pt-3">
                        <p className="text-[10px] text-[#8193a4]">
                          {selectedReport.location}
                        </p>
                        <p className="text-[10px] text-[#8193a4]">
                          {selectedReport.category} · {selectedReport.reference}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateTo("ReviewWorkspace")}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#edf4f8] px-3 py-2.5 text-[11px] font-extrabold text-[#2d6e91] hover:bg-[#e1eef4]"
                      >
                        <ClipboardCheck size={14} /> Open review context
                      </button>
                    </>
                  ) : (
                    <p className="mt-5 rounded-xl bg-[#f7f9fa] p-4 text-[11px] leading-5 text-[#8294a4]">
                      Select a report from the list to see its administrative
                      context.
                    </p>
                  )}
                </div>
              </aside>
            </section>
          </>
        ) : (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.75fr)]">
            <div className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
              <div className="flex flex-col justify-between gap-3 border-b border-[#edf1f5] pb-5 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-extrabold text-[#1a3856]">
                      System activity
                    </h3>
                    <span className="rounded-full bg-[#f1f5f8] px-2 py-0.5 font-mono text-[10px] font-bold text-[#778da3]">
                      {filteredActivity.length} events
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#8396a9]">
                    Administrative actions and routing changes.
                  </p>
                </div>
                <div className="relative">
                  <ListFilter
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-2.5 text-[#8398aa]"
                  />
                  <select
                    aria-label="Filter activity"
                    value={activityFilter}
                    onChange={(event) =>
                      setActivityFilter(event.target.value as ActivityKind)
                    }
                    className="h-9 appearance-none rounded-lg border border-[#dce5ed] bg-[#fbfcfd] py-1 pl-8 pr-7 text-[10px] font-bold text-[#658098] outline-none"
                  >
                    <option>All activity</option>
                    <option>Reports</option>
                    <option>Users</option>
                    <option>System</option>
                  </select>
                  <ChevronDown
                    size={13}
                    className="pointer-events-none absolute right-2 top-2.5 text-[#8195a8]"
                  />
                </div>
              </div>
              <div className="divide-y divide-[#edf1f5]">
                {filteredActivity.map((item) => (
                  <div
                    key={`${item.label}-${item.detail}`}
                    className="flex items-start gap-3 py-4"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.tone}`}
                    />
                    <div>
                      <p className="text-[12px] font-bold text-[#49667f]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-[10px] text-[#98a7b4]">
                        {item.kind} · {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f1f7] text-[#377a9e]">
                    <BellRing size={16} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-extrabold text-[#254865]">
                      User and system activity
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-[#8396a9]">
                      Keep account changes visible without implying report
                      outcomes.
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-3 border-t border-[#edf1f5] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#71869b]">
                      Directory changes
                    </span>
                    <span className="font-mono text-[13px] font-bold text-[#315d7c]">
                      7
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#71869b]">
                      Review assignments
                    </span>
                    <span className="font-mono text-[13px] font-bold text-[#315d7c]">
                      12
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#71869b]">
                      Data quality notices
                    </span>
                    <span className="font-mono text-[13px] font-bold text-[#315d7c]">
                      3
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#d9e3ec] bg-[#f7fafc] p-5">
                <div className="flex items-center gap-2 text-[#4b7187]">
                  <ShieldCheck size={16} />
                  <h3 className="text-[13px] font-extrabold">
                    Access boundary
                  </h3>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-[#7d91a3]">
                  This activity feed is restricted to superadmin access and
                  reflects recorded system actions.
                </p>
              </div>
            </div>
          </section>
        )}

        <footer className="flex flex-col justify-between gap-2 border-t border-[#dbe5ed] pt-4 text-[10px] font-semibold text-[#93a4b3] sm:flex-row">
          <span>Old Sagay · SUNN administrator console</span>
          <span>Live database · Auto-refreshes every 10 seconds</span>
        </footer>
      </div>
      {notice ? (
        <div className="fixed bottom-[84px] right-5 z-30 flex items-center gap-2 rounded-xl border border-[#c8dce7] bg-[#214f6a] px-4 py-3 text-[11px] font-bold text-white shadow-[0_8px_24px_rgba(29,72,97,0.22)] lg:bottom-6">
          <Check size={14} className="text-[#a8d7c0]" /> {notice}
        </div>
      ) : null}
    </AppLayout>
  );
}

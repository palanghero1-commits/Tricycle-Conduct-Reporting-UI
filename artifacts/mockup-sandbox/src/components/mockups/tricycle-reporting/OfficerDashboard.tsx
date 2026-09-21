import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  FileCheck2,
  Flag,
  Gauge,
  Info,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  TimerReset,
  TrendingUp,
  UsersRound,
  X,
  UserPlus,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { apiRequest, formatPhilippineDate, formatPhilippineDateTime, getCurrentUser } from "../../../lib/api";

type ReportStatus = "Needs review" | "In review" | "Resolved";
type Report = {
  id: string;
  time: string;
  relative: string;
  location: string;
  category: string;
  status: ReportStatus;
  reference: string;
  summary: string;
  reports: string;
};

function previewUrl(component: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/preview/tricycle-reporting/${component}`;
}

function navigateTo(component: string) {
  window.location.href = previewUrl(component);
}

const reports: Report[] = [
  {
    id: "RPT-2418",
    time: "Today, 10:42 AM",
    relative: "18 min ago",
    location: "Old Sagay Public Market",
    category: "Fare concern",
    status: "Needs review",
    reference: "TODA-OS-118",
    summary: "Passenger reported a fare that differed from the posted route rate.",
    reports: "1 report",
  },
  {
    id: "RPT-2417",
    time: "Today, 9:56 AM",
    relative: "1 hr ago",
    location: "SUNN Gate 2",
    category: "Conduct",
    status: "In review",
    reference: "TODA-SN-044",
    summary: "Report describes a concern about tone and communication during a trip.",
    reports: "2 reports",
  },
  {
    id: "RPT-2416",
    time: "Today, 8:31 AM",
    relative: "2 hrs ago",
    location: "Sagay Wharf Road",
    category: "Route concern",
    status: "Needs review",
    reference: "TODA-OS-092",
    summary: "Passenger noted a possible route deviation and requested a review of trip details.",
    reports: "1 report",
  },
  {
    id: "RPT-2415",
    time: "Yesterday, 4:18 PM",
    relative: "Yesterday",
    location: "SUNN Student Center",
    category: "Vehicle condition",
    status: "Resolved",
    reference: "TODA-SN-031",
    summary: "Report about a missing vehicle identification card; officer follow-up recorded.",
    reports: "1 report",
  },
  {
    id: "RPT-2414",
    time: "Yesterday, 2:07 PM",
    relative: "Yesterday",
    location: "Old Sagay Terminal",
    category: "Fare concern",
    status: "In review",
    reference: "TODA-OS-079",
    summary: "Passenger requested clarification on a fare collected during peak hours.",
    reports: "3 reports",
  },
];

const activity = [
  { label: "Report RPT-2417 moved to in review", meta: "A. Reyes · 34 min ago", color: "bg-[#2b76c5]" },
  { label: "Follow-up note added to RPT-2415", meta: "M. Cabal · 1 hr ago", color: "bg-[#d18a3c]" },
  { label: "New report received from SUNN", meta: "System · 2 hrs ago", color: "bg-[#6b9b83]" },
  { label: "Review queue assigned to your desk", meta: "Dispatch · 3 hrs ago", color: "bg-[#8998aa]" },
];

const categories = [
  { label: "Fare concern", count: 18, width: "78%", color: "bg-[#2f78bd]" },
  { label: "Conduct", count: 11, width: "48%", color: "bg-[#d18a3c]" },
  { label: "Route concern", count: 8, width: "35%", color: "bg-[#5c8e86]" },
  { label: "Vehicle condition", count: 6, width: "27%", color: "bg-[#9b7b91]" },
];

const ranges = ["Last 7 days", "Last 30 days", "This semester"];

function StatusPill({ status }: { status: ReportStatus }) {
  const styles: Record<ReportStatus, string> = {
    "Needs review": "border-[#f3d6b9] bg-[#fff8ef] text-[#a4662b]",
    "In review": "border-[#c9d9eb] bg-[#f1f6fb] text-[#2b6394]",
    Resolved: "border-[#cce4d7] bg-[#f0f8f3] text-[#4a8062]",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  accent,
  icon: Icon,
  direction,
}: {
  label: string;
  value: string;
  detail: string;
  accent: string;
  icon: typeof FileCheck2;
  direction: "up" | "down";
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
      <div className={`absolute right-0 top-0 h-20 w-20 translate-x-7 -translate-y-7 rounded-full ${accent} opacity-10`} />
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#8193a8]">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${accent} text-white`}>
          <Icon size={16} strokeWidth={2} />
        </div>
      </div>
      <p className="mt-5 font-mono text-[27px] font-bold tracking-[-0.06em] text-[#183654]">{value}</p>
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#71859c]">
        {direction === "up" ? <ArrowUpRight size={13} className="text-[#4f8b72]" /> : <ArrowDownRight size={13} className="text-[#4f8b72]" />}
        <span className="text-[#4f8b72]">{detail}</span>
        <span>vs prior period</span>
      </div>
    </div>
  );
}

export function OfficerDashboard() {
  const currentUser = getCurrentUser();
  const isAuthorizedPersonnel = currentUser?.role === "AUTHORIZED_PERSONNEL";
  const isTodaPresident = currentUser?.role === "TODA_PRESIDENT";
  const isPnpReviewer = currentUser?.role === "PNP";
  const [activeSection, setActiveSection] = useState(() => window.location.hash === "#todas" ? "TODAs" : "Dashboard");
  const [activePanel, setActivePanel] = useState<"Overview" | "People" | "Activity">(() => window.location.hash === "#todas" ? "People" : "Overview");
  const [statusFilter, setStatusFilter] = useState<"All" | ReportStatus>("All");
  const [timeRange, setTimeRange] = useState("Last 7 days");
  const [selectedId, setSelectedId] = useState("RPT-2418");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [notice, setNotice] = useState("");
  const [liveReports, setLiveReports] = useState<Report[]>([]);
  const [showPresidentForm, setShowPresidentForm] = useState(false);
  const [showTodaForm, setShowTodaForm] = useState(false);
  const [todaForm, setTodaForm] = useState({ name: "", barangay: "", city: "Sagay City", province: "Negros Occidental" });
  const [todas, setTodas] = useState<Array<{ id: number; name: string; barangay: string; city: string; province: string; presidentUserId: string | null }>>([]);
  const [presidentForm, setPresidentForm] = useState<{ fullName: string; email: string; password: string; todaId: string; status?: string }>({ fullName: "", email: "", password: "", todaId: "1", status: "ACTIVE" });
  const [presidents, setPresidents] = useState<Array<{ id: string; fullName: string; email: string; todaId: number; todaName: string; status: string }>>([]);
  const [editingPresidentId, setEditingPresidentId] = useState<string | null>(null);

  const loadReports = () =>
    apiRequest<{ complaints: Array<{ referenceNumber: string; status: string; location: string; categoryName: string; description: string; createdAt: string; driverName: string }> }>("/complaints")
      .then(({ complaints }) => setLiveReports(complaints.map((item) => ({
        id: item.referenceNumber,
        time: formatPhilippineDateTime(item.createdAt),
        relative: formatPhilippineDate(item.createdAt),
        location: item.location,
        category: item.categoryName,
        status: item.status === "RESOLVED" || item.status === "CLOSED" ? "Resolved" : item.status === "UNDER_REVIEW" || item.status === "REFERRED" ? "In review" : "Needs review",
        reference: item.driverName,
        summary: item.description,
        reports: "1 report",
      } as Report))));

  useEffect(() => {
    void loadReports().catch(() => setLiveReports([]));
    const timer = window.setInterval(() => { void loadReports().catch(() => undefined); }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncSection = () => {
      const isTODASection = window.location.hash === "#todas";
      setActiveSection(isTODASection ? "TODAs" : "Dashboard");
      if (isTODASection) setActivePanel("People");
    };
    syncSection();
    window.addEventListener("hashchange", syncSection);
    return () => window.removeEventListener("hashchange", syncSection);
  }, []);

  const loadTodaAdministration = async () => {
    const [todaData, presidentData] = await Promise.all([
      apiRequest<{ todas: Array<{ id: number; name: string; barangay: string; city: string; province: string; presidentUserId: string | null }> }>("/todas"),
      apiRequest<{ presidents: Array<{ id: string; fullName: string; email: string; todaId: number; todaName: string; status: string }> }>("/users/toda-presidents"),
    ]);
    setTodas(todaData.todas);
    setPresidents(presidentData.presidents);
    if (todaData.todas[0]) setPresidentForm((form) => ({ ...form, todaId: String(todaData.todas[0].id) }));
  };

  useEffect(() => {
    if (isAuthorizedPersonnel) {
      void loadTodaAdministration().catch(() => { setTodas([]); setPresidents([]); });
    } else if (isTodaPresident) {
      void apiRequest<{ todas: Array<{ id: number; name: string; barangay: string; city: string; province: string; presidentUserId: string | null }> }>("/todas")
        .then(({ todas: assignedTodas }) => setTodas(assignedTodas))
        .catch(() => setTodas([]));
    }
  }, [isAuthorizedPersonnel, isTodaPresident]);

  const createPresident = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await apiRequest(editingPresidentId ? `/users/toda-presidents/${editingPresidentId}` : "/users/toda-presidents", { method: editingPresidentId ? "PATCH" : "POST", body: JSON.stringify({ ...presidentForm, todaId: Number(presidentForm.todaId) }) });
      await loadTodaAdministration();
      setPresidentForm({ fullName: "", email: "", password: "", todaId: todas[0] ? String(todas[0].id) : "1", status: "ACTIVE" });
      setEditingPresidentId(null);
      setShowPresidentForm(false);
      announce(editingPresidentId ? "TODA President account updated." : "TODA President account created.");
    } catch (error) {
      announce(error instanceof Error ? error.message : "Unable to save account.");
    }
  };

  const createToda = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await apiRequest("/todas", { method: "POST", body: JSON.stringify(todaForm) });
      await loadTodaAdministration();
      setTodaForm({ name: "", barangay: "", city: "Sagay City", province: "Negros Occidental" });
      setShowTodaForm(false);
      announce("Designated location saved.");
    } catch (error) {
      announce(error instanceof Error ? error.message : "Unable to save TODA.");
    }
  };

  const filteredReports = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return liveReports.filter((report) => {
      const matchesStatus = statusFilter === "All" || report.status === statusFilter;
      const matchesSearch =
        !term ||
        `${report.id} ${report.location} ${report.category} ${report.summary}`.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const awaiting = liveReports.filter((report) => report.status === "Needs review").length;
    const inReview = liveReports.filter((report) => report.status === "In review").length;
    const resolved = liveReports.filter((report) => report.status === "Resolved").length;
    return { total: liveReports.length, awaiting, inReview, resolved };
  }, [liveReports]);

  const categoryMetrics = useMemo(() => {
    const counts = liveReports.reduce<Record<string, number>>((accumulator, report) => {
      accumulator[report.category] = (accumulator[report.category] ?? 0) + 1;
      return accumulator;
    }, {});
    const colors = ["bg-[#2e78ad]", "bg-[#6c9a7d]", "bg-[#c18a48]", "bg-[#7b6b93]", "bg-[#d16f5b]"];
    const total = Math.max(liveReports.length, 1);
    return Object.entries(counts)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 5)
      .map(([label, count], index) => ({
        label,
        count,
        color: colors[index % colors.length],
        width: `${Math.max(8, Math.round((count / total) * 100))}%`,
      }));
  }, [liveReports]);

  const liveActivity = useMemo(
    () =>
      liveReports.slice(0, 6).map((report) => ({
        label: `${report.id} ${report.status.toLowerCase()}`,
        meta: `${report.category} / ${report.relative}`,
        color:
          report.status === "Resolved"
            ? "bg-[#65a07e]"
            : report.status === "In review"
              ? "bg-[#4381ad]"
              : "bg-[#d58b3d]",
      })),
    [liveReports],
  );

  const dailyMetrics = useMemo(() => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array.from({ length: 7 }, () => 0);
    liveReports.forEach((report) => {
      const created = new Date(report.time);
      if (!Number.isNaN(created.getTime())) {
        counts[created.getDay()] += 1;
      }
    });
    const max = Math.max(...counts, 1);
    return counts.map((count, index) => ({
      label: labels[index],
      count,
      height: `${Math.max(count ? 12 : 3, Math.round((count / max) * 100))}%`,
    }));
  }, [liveReports]);

  const selectedReport = liveReports.find((report) => report.id === selectedId) ?? filteredReports[0];
  const selectedToda = todas.find((toda) => String(toda.id) === presidentForm.todaId);
  const visibleActivity = showAllActivity ? liveActivity : liveActivity.slice(0, 3);

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const exportView = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      statusFilter,
      timeRange,
      reports: filteredReports,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `officer-report-view-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    announce("Live report view exported.");
  };

  return (
    <AppLayout officer active={isAuthorizedPersonnel ? activeSection : "Dashboard"} title={isAuthorizedPersonnel && activeSection === "TODAs" ? "TODA administration" : isPnpReviewer ? "PNP review dashboard" : "TODA officer dashboard"} eyebrow={isAuthorizedPersonnel && activeSection === "TODAs" ? "TODA accounts · Authorized personnel" : isPnpReviewer ? "PNP review center · Old Sagay" : "TODA operations · Old Sagay / SUNN"}>
      <div className="space-y-7">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b9d4cf] bg-[#edf7f4] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#39766c]">
                <ShieldCheck size={12} /> Authorized access
              </span>
              <span className="text-[11px] font-semibold text-[#8396ab]">Review center / Overview</span>
            </div>
            <h2 className="max-w-[700px] text-[29px] font-extrabold leading-[1.05] tracking-[-0.045em] text-[#173554] sm:text-[36px]">
              A clear view of what needs attention.
            </h2>
            <p className="mt-3 max-w-[660px] text-[13px] leading-6 text-[#6f8399]">
              Monitor community reports across Old Sagay and SUNN, then review context before any action is taken.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                loadReports()
                  .then(() => announce("Dashboard refreshed."))
                  .catch(() => announce("Unable to refresh dashboard data."))
              }
              className="inline-flex items-center gap-2 rounded-xl border border-[#d5e0ea] bg-white px-3.5 py-2.5 text-[12px] font-bold text-[#55708d] transition hover:border-[#a9c2d8] hover:text-[#245d8e]"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              type="button"
              onClick={exportView}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1e638d] px-3.5 py-2.5 text-[12px] font-bold text-white shadow-[0_5px_14px_rgba(30,99,141,0.2)] transition hover:bg-[#194f72]"
            >
              <Download size={15} /> Export view
            </button>
          </div>
        </section>

        {isTodaPresident ? (
          <section className="rounded-2xl border border-[#c9ddec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf4ff] text-[#2671b1]"><MapPin size={17} /></div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#6e8ca8]">Assigned TODA account</p>
                <h3 className="mt-1 text-[19px] font-extrabold text-[#173f50]">{todas[0]?.name ?? "No TODA assignment"}</h3>
                <p className="mt-1 text-[12px] text-[#6d8499]">Your TODA and designated location are assigned by Authorized Personnel and cannot be edited from this account.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 border-t border-[#e5edf3] pt-4 sm:grid-cols-3">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8a9daf]">Barangay</p><p className="mt-1 text-[12px] font-bold text-[#345570]">{todas[0]?.barangay ?? "Not assigned"}</p></div>
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8a9daf]">City</p><p className="mt-1 text-[12px] font-bold text-[#345570]">{todas[0]?.city ?? "Not assigned"}</p></div>
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8a9daf]">Province</p><p className="mt-1 text-[12px] font-bold text-[#345570]">{todas[0]?.province ?? "Not assigned"}</p></div>
            </div>
          </section>
        ) : null}

        {isAuthorizedPersonnel ? (
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
                ) : tab === "People" ? (
                  <UsersRound size={14} className="mr-1.5 inline" />
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
        ) : null}

        {isAuthorizedPersonnel && activePanel === "People" ? (
          <>
            {activeSection === "TODAs" ? (
              <>
                <div className="mb-5 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Registered locations", value: todas.length, tone: "text-[#256c8d]", background: "bg-[#eaf5fa]" },
                    { label: "Assigned presidents", value: presidents.length, tone: "text-[#2d8478]", background: "bg-[#eaf8f4]" },
                    { label: "Needs assignment", value: Math.max(todas.filter((toda) => !toda.presidentUserId).length, 0), tone: "text-[#ad7332]", background: "bg-[#fff6e9]" },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-[#d9e3ec] bg-white p-4 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
                      <div className={`mb-4 flex h-8 w-8 items-center justify-center rounded-xl ${metric.background} ${metric.tone}`}><UsersRound size={16} /></div>
                      <p className="font-mono text-[25px] font-bold tracking-[-0.05em] text-[#183654]">{metric.value}</p>
                      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8193a8]">{metric.label}</p>
                    </div>
                  ))}
                </div>
                <section className="mb-5 rounded-2xl border border-[#c9ddec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#397a91]">Designated location directory</p>
                      <h3 className="mt-1 text-[18px] font-extrabold text-[#173f50]">Register a location in Sagay City</h3>
                      <p className="mt-1 text-[12px] text-[#6d8499]">Choose the city first, then record the barangay where the TODA operates.</p>
                    </div>
                    <button type="button" onClick={() => setShowTodaForm((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e638d] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#194f72]"><MapPin size={15} /> {showTodaForm ? "Close form" : "Add location"}</button>
                  </div>
                  {showTodaForm ? (
                    <form onSubmit={createToda} className="mt-5 grid gap-3 border-t border-[#dbe8ef] pt-5 sm:grid-cols-2">
                      <input required value={todaForm.city} onChange={(event) => setTodaForm({ ...todaForm, city: event.target.value })} placeholder="City / Municipality" className="rounded-xl border border-[#c7dfdc] bg-white px-3 py-2.5 text-[12px]" />
                      <input required value={todaForm.barangay} onChange={(event) => setTodaForm({ ...todaForm, barangay: event.target.value })} placeholder="Barangay under the city" className="rounded-xl border border-[#c7dfdc] bg-white px-3 py-2.5 text-[12px]" />
                      <input required value={todaForm.province} onChange={(event) => setTodaForm({ ...todaForm, province: event.target.value })} placeholder="Province" className="rounded-xl border border-[#c7dfdc] bg-white px-3 py-2.5 text-[12px]" />
                      <button type="submit" className="rounded-xl bg-[#1e638d] px-4 py-2.5 text-[12px] font-bold text-white sm:col-span-2">Save location</button>
                    </form>
                  ) : null}
                </section>
              </>
            ) : null}
          <section className="rounded-2xl border border-[#b9dcd4] bg-[#effaf7] p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#398178]">Personnel administration</p>
                <h3 className="mt-1 text-[18px] font-extrabold text-[#173f50]">Manage TODA leadership accounts</h3>
                <p className="mt-1 text-[12px] text-[#5a7f83]">Create a live TODA President account and assign it to a registered TODA.</p>
              </div>
              <button type="button" onClick={() => { setEditingPresidentId(null); setPresidentForm({ fullName: "", email: "", password: "", todaId: todas[0] ? String(todas[0].id) : "1", status: "ACTIVE" }); setShowPresidentForm((value) => !value); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#238d80] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#1b756b]"><UserPlus size={15} /> {showPresidentForm ? "Close form" : "Create TODA President"}</button>
            </div>
            {showPresidentForm ? (
              <form onSubmit={createPresident} className="mt-5 grid gap-3 border-t border-[#cde8e2] pt-5 sm:grid-cols-2">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#6b8b8d] sm:col-span-2">User account data</p>
                <input required value={presidentForm.fullName} onChange={(event) => setPresidentForm({ ...presidentForm, fullName: event.target.value })} placeholder="Full name" className="rounded-xl border border-[#c7dfdc] bg-white px-3 py-2.5 text-[12px]" />
                <input required type="email" value={presidentForm.email} onChange={(event) => setPresidentForm({ ...presidentForm, email: event.target.value })} placeholder="Email address" className="rounded-xl border border-[#c7dfdc] bg-white px-3 py-2.5 text-[12px]" />
                <input required={!editingPresidentId} minLength={8} type="password" value={presidentForm.password} onChange={(event) => setPresidentForm({ ...presidentForm, password: event.target.value })} placeholder={editingPresidentId ? "New password (optional)" : "Temporary password"} className="rounded-xl border border-[#c7dfdc] bg-white px-3 py-2.5 text-[12px]" />
                <select required value={presidentForm.status} onChange={(event) => setPresidentForm({ ...presidentForm, status: event.target.value })} className="rounded-xl border border-[#c7dfdc] bg-white px-3 py-2.5 text-[12px]"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#6b8b8d]">Designated location</p>
                  <select required disabled={!todas.length} value={todas.length ? presidentForm.todaId : ""} onChange={(event) => setPresidentForm({ ...presidentForm, todaId: event.target.value })} className="w-full rounded-xl border border-[#c7dfdc] bg-white px-3 py-2.5 text-[12px] disabled:cursor-not-allowed disabled:bg-[#f3f7f7]">{todas.length ? todas.map((toda) => <option key={toda.id} value={toda.id}>{toda.name}{toda.presidentUserId ? " · replace president" : ""}</option>) : <option value="">No TODA assignments available</option>}</select>
                  <div className="mt-2 rounded-xl border border-[#cde8e2] bg-[#f7fcfb] px-3 py-2.5 text-[11px] text-[#52777a]">
                    <span className="font-extrabold text-[#35686a]">Read-only designated location:</span>{" "}
                    {selectedToda ? `${selectedToda.barangay}, ${selectedToda.city}, ${selectedToda.province}` : "No address available"}
                  </div>
                </div>
                <button type="submit" className="rounded-xl bg-[#238d80] px-4 py-2.5 text-[12px] font-bold text-white sm:col-span-2">{editingPresidentId ? "Save changes" : "Create account"}</button>
              </form>
            ) : null}
            <div className="mt-5 space-y-2 border-t border-[#cde8e2] pt-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#6b8b8d]">Current TODA presidents ({presidents.length})</p>
              {presidents.length ? presidents.map((president) => <div key={president.id} className="flex flex-col justify-between gap-2 rounded-xl bg-white px-3 py-2.5 text-[12px] sm:flex-row sm:items-center"><span><strong className="text-[#244b5d]">{president.fullName}</strong><span className="ml-2 text-[#789397]">{president.todaName} · {president.email}</span></span><span className="flex gap-3"><button type="button" onClick={() => { setEditingPresidentId(president.id); setPresidentForm({ fullName: president.fullName, email: president.email, password: "", todaId: String(todas.find((toda) => toda.name === president.todaName)?.id ?? "1") }); setShowPresidentForm(true); }} className="font-bold text-[#287b78] hover:underline">Edit</button><button type="button" onClick={() => { if (window.confirm(`Delete ${president.fullName}'s account?`)) void apiRequest(`/users/toda-presidents/${president.id}`, { method: "DELETE" }).then(() => setPresidents((items) => items.filter((item) => item.id !== president.id))).catch((error) => announce(error instanceof Error ? error.message : "Unable to delete account.")); }} className="font-bold text-[#b45e55] hover:underline">Delete</button></span></div>) : <p className="text-[12px] text-[#6c898d]">No TODA President accounts registered yet.</p>}
            </div>
          </section>
          </>
        ) : null}

        {(!isAuthorizedPersonnel || activePanel === "Overview") ? <>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Reports received" value={String(metrics.total)} detail="Live complaints" accent="bg-[#2675b7]" icon={FileCheck2} direction="up" />
          <MetricCard label="Awaiting review" value={String(metrics.awaiting)} detail="Needs action" accent="bg-[#bc7a35]" icon={TimerReset} direction="up" />
          <MetricCard label="In review" value={String(metrics.inReview)} detail="Active review" accent="bg-[#5c8b83]" icon={Search} direction="up" />
          <MetricCard label="Resolved" value={String(metrics.resolved)} detail="Closed or resolved" accent="bg-[#806c8f]" icon={Clock3} direction="up" />
        </section>

        <section className="rounded-2xl border border-[#cfdfeb] bg-[#eaf4f8] px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d2e7ef] text-[#397a91]">
                <Info size={15} />
              </div>
              <p className="text-[11px] leading-5 text-[#527184]">
                <span className="font-extrabold text-[#28586c]">Reports are community submissions, not findings.</span>{" "}
                A report or complaint is not a confirmed violation. Confirmation is recorded separately after due review.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo("Violations")}
              className="shrink-0 self-start rounded-lg px-2 py-1 text-[11px] font-bold text-[#35758c] hover:bg-[#d9edf2] sm:self-center"
            >
              Review guidance <ChevronRight size={13} className="ml-1 inline" />
            </button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.85fr)]">
          <div className="min-w-0 rounded-2xl border border-[#d9e3ec] bg-white shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
            <div className="border-b border-[#e6edf3] px-5 pb-4 pt-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-extrabold tracking-[-0.02em] text-[#1a3856]">Review queue</h3>
                    <span className="rounded-full bg-[#f1f5f8] px-2 py-0.5 font-mono text-[10px] font-bold text-[#778da3]">{filteredReports.length} shown</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#8396a9]">Prioritized by recency, not by assumed outcome.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-[#93a5b7]" />
                    <input
                      aria-label="Search reports"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search queue"
                      className="h-9 w-full rounded-lg border border-[#dce5ed] bg-[#fbfcfd] pl-8 pr-3 text-[11px] font-medium text-[#36536f] outline-none placeholder:text-[#9aaaba] focus:border-[#8fb6cf] sm:w-[145px]"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 overflow-x-auto">
                {(["All", "Needs review", "In review", "Resolved"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                      statusFilter === filter ? "bg-[#e7f0f7] text-[#245e8a]" : "text-[#8a9bac] hover:bg-[#f5f8fa] hover:text-[#52708b]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden grid-cols-[1.05fr_1fr_0.8fr_0.75fr] gap-3 border-b border-[#edf1f5] px-5 py-2.5 text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#9aaaba] md:grid">
              <span>Report</span>
              <span>Location / category</span>
              <span>Status</span>
              <span className="text-right">Received</span>
            </div>
            <div className="divide-y divide-[#edf1f5]">
              {filteredReports.length ? (
                filteredReports.map((report) => (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => setSelectedId(report.id)}
                    className={`grid w-full gap-3 px-5 py-4 text-left transition hover:bg-[#f8fbfd] md:grid-cols-[1.05fr_1fr_0.8fr_0.75fr] md:items-center ${
                      selectedId === report.id ? "bg-[#f5f9fc]" : "bg-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${report.status === "Needs review" ? "bg-[#d58b3d]" : report.status === "In review" ? "bg-[#4381ad]" : "bg-[#65a07e]"}`} />
                        <span className="font-mono text-[11px] font-bold text-[#2b5576]">{report.id}</span>
                      </div>
                      <p className="mt-1 truncate text-[11px] leading-4 text-[#778ca0] md:hidden">{report.summary}</p>
                      <p className="mt-1 text-[10px] font-semibold text-[#9aabba]">{report.reports} linked to this reference</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-bold text-[#345570]">{report.location}</p>
                      <p className="mt-1 text-[10px] text-[#8a9bac]">{report.category}</p>
                    </div>
                    <div><StatusPill status={report.status} /></div>
                    <div className="flex items-center justify-between md:block md:text-right">
                      <span className="text-[10px] font-semibold text-[#71869b]">{report.relative}</span>
                      <ChevronRight size={15} className="inline text-[#b1bfcb] md:hidden" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f5f8] text-[#8297a9]"><Search size={18} /></div>
                  <p className="mt-3 text-[12px] font-bold text-[#4a667e]">No reports match this view</p>
                  <p className="mt-1 text-[11px] text-[#8c9eaf]">Try another status or search term.</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[#edf1f5] px-5 py-3.5">
              <p className="text-[10px] font-semibold text-[#97a7b6]">Showing recent activity from the review system</p>
              <button type="button" onClick={() => navigateTo("PNPReview")} className="text-[11px] font-extrabold text-[#2d6e9b] hover:text-[#1d5278]">
                Open reports <ChevronRight size={13} className="ml-1 inline" />
              </button>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a5b5]">Selected report</p>
                  <h3 className="mt-1.5 font-mono text-[15px] font-bold text-[#214765]">{selectedReport?.id ?? "—"}</h3>
                </div>
                <button type="button" onClick={() => setSelectedId("")} className="rounded-lg p-1 text-[#9aacba] hover:bg-[#f2f6f8] hover:text-[#52708b]" aria-label="Clear selected report">
                  <X size={15} />
                </button>
              </div>
              {selectedReport ? (
                <>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <StatusPill status={selectedReport.status} />
                    <span className="text-[10px] font-semibold text-[#91a1af]">{selectedReport.time}</span>
                  </div>
                  <p className="mt-4 text-[12px] font-bold leading-5 text-[#355570]">{selectedReport.summary}</p>
                  <div className="mt-4 space-y-2 border-t border-[#edf1f5] pt-3">
                    <div className="flex items-center gap-2 text-[10px] text-[#8193a4]"><MapPin size={13} className="text-[#6c99ad]" /> {selectedReport.location}</div>
                    <div className="flex items-center gap-2 text-[10px] text-[#8193a4]"><Flag size={13} className="text-[#b88759]" /> {selectedReport.category} · {selectedReport.reports}</div>
                  </div>
                  <button type="button" onClick={() => navigateTo("PNPReview")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#edf4f8] px-3 py-2.5 text-[11px] font-extrabold text-[#2d6e91] hover:bg-[#e1eef4]">
                    <FileCheck2 size={14} /> Open review details
                  </button>
                </>
              ) : (
                <p className="mt-5 rounded-xl bg-[#f7f9fa] p-4 text-[11px] leading-5 text-[#8294a4]">Select a report from the queue to see its review context.</p>
              )}
            </div>

          </aside>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.85fr_0.85fr]">
          <div className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-extrabold tracking-[-0.02em] text-[#1a3856]">Reporting pulse</h3>
                  <TrendingUp size={15} className="text-[#548b84]" />
                </div>
                <p className="mt-1 text-[11px] text-[#8396a9]">Incoming reports by day</p>
              </div>
              <div className="relative">
                <select value={timeRange} onChange={(event) => setTimeRange(event.target.value)} className="h-8 appearance-none rounded-lg border border-[#dce5ed] bg-[#fbfcfd] py-1 pl-2.5 pr-7 text-[10px] font-bold text-[#658098] outline-none">
                  {ranges.map((range) => <option key={range}>{range}</option>)}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2 top-2.5 text-[#8195a8]" />
              </div>
            </div>
            <div className="mt-7 flex h-[126px] items-end gap-2.5 border-b border-[#e5edf2] px-1 sm:gap-4">
              {dailyMetrics.map((day, index) => (
                <div key={day.label} className="group flex h-full flex-1 flex-col justify-end">
                  <div className="relative flex flex-1 items-end">
                    <div className={`w-full rounded-t-[5px] transition group-hover:opacity-80 ${index === new Date().getDay() ? "bg-[#d18a3c]" : "bg-[#8db8ca]"}`} style={{ height: day.height }}>
                      <span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 rounded bg-[#264d69] px-1.5 py-0.5 font-mono text-[9px] text-white group-hover:block">{day.count}</span>
                    </div>
                  </div>
                  <span className="mt-2 text-center text-[9px] font-semibold text-[#9aaaba]">{day.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-[#889aaa]"><span className="h-2 w-2 rounded-sm bg-[#d18a3c]" /> Today / {dailyMetrics[new Date().getDay()]?.count ?? 0} reports</div>
          </div>

          <div className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[15px] font-extrabold tracking-[-0.02em] text-[#1a3856]">Report categories</h3>
                <p className="mt-1 text-[11px] text-[#8396a9]">By submitted topic</p>
              </div>
              <BarChart3 size={17} className="text-[#87a0b4]" />
            </div>
            <div className="mt-6 space-y-4">
              {categoryMetrics.length ? categoryMetrics.map((category) => (
                <div key={category.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-[#617b92]">{category.label}</span>
                    <span className="font-mono text-[#8a9cac]">{category.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#edf2f5]"><div className={`h-full rounded-full ${category.color}`} style={{ width: category.width }} /></div>
                </div>
              )) : (
                <p className="rounded-xl bg-[#f7f9fb] p-4 text-[11px] text-[#8294a4]">No report categories recorded yet.</p>
              )}
            </div>
            <button type="button" onClick={() => navigateTo("Analytics")} className="mt-5 text-[11px] font-extrabold text-[#2d6e9b] hover:text-[#1d5278]">See category detail <ChevronRight size={13} className="ml-1 inline" /></button>
          </div>

          <div className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[15px] font-extrabold tracking-[-0.02em] text-[#1a3856]">Recent activity</h3>
                <p className="mt-1 text-[11px] text-[#8396a9]">Desk updates and routing</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {visibleActivity.length ? visibleActivity.map((item) => (
                <div key={item.label} className="flex gap-2.5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.color}`} />
                  <div>
                    <p className="text-[11px] font-bold leading-4 text-[#5c748b]">{item.label}</p>
                    <p className="mt-1 text-[10px] text-[#9aaaba]">{item.meta}</p>
                  </div>
                </div>
              )) : (
                <p className="rounded-xl bg-[#f7f9fb] p-4 text-[11px] text-[#8294a4]">No report activity recorded yet.</p>
              )}
            </div>
            <button type="button" onClick={() => setShowAllActivity((current) => !current)} className="mt-5 text-[11px] font-extrabold text-[#2d6e9b] hover:text-[#1d5278]">
              {showAllActivity ? "Show less" : "View all activity"} <ChevronRight size={13} className="ml-1 inline" />
            </button>
          </div>
        </section>
        </> : null}

        {isAuthorizedPersonnel && activePanel === "Activity" ? (
          <section className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[15px] font-extrabold tracking-[-0.02em] text-[#1a3856]">System activity</h3>
                <p className="mt-1 text-[11px] text-[#8396a9]">Recent report and review updates from the desk</p>
              </div>
              <Activity size={17} className="text-[#87a0b4]" />
            </div>
            <div className="mt-5 divide-y divide-[#edf1f5]">
              {liveActivity.length ? liveActivity.map((item) => (
                <div key={item.label} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.color}`} />
                  <div>
                    <p className="text-[11px] font-bold leading-4 text-[#5c748b]">{item.label}</p>
                    <p className="mt-1 text-[10px] text-[#9aaaba]">{item.meta}</p>
                  </div>
                </div>
              )) : <p className="rounded-xl bg-[#f7f9fb] p-4 text-[11px] text-[#8294a4]">No report activity recorded yet.</p>}
            </div>
          </section>
        ) : null}

        <footer className="flex flex-col justify-between gap-2 border-t border-[#dbe5ed] pt-4 text-[10px] font-semibold text-[#93a4b3] sm:flex-row">
          <span>Old Sagay · SUNN transport conduct review center</span>
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} /> Snapshot: {formatPhilippineDateTime(new Date())}</span>
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

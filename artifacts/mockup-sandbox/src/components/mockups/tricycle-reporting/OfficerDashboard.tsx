import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  FileCheck2,
  Flag,
  Info,
  ListFilter,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  TimerReset,
  TrendingUp,
  X,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";

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
  const [statusFilter, setStatusFilter] = useState<"All" | ReportStatus>("All");
  const [timeRange, setTimeRange] = useState("Last 7 days");
  const [selectedId, setSelectedId] = useState("RPT-2418");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [notice, setNotice] = useState("");

  const filteredReports = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesStatus = statusFilter === "All" || report.status === statusFilter;
      const matchesSearch =
        !term ||
        `${report.id} ${report.location} ${report.category} ${report.summary}`.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [searchTerm, statusFilter]);

  const selectedReport = reports.find((report) => report.id === selectedId) ?? filteredReports[0];
  const visibleActivity = showAllActivity ? activity : activity.slice(0, 3);

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <AppLayout officer active="Dashboard" title="Officer dashboard" eyebrow="Authorized review · Old Sagay / SUNN">
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
              onClick={() => announce("Dashboard snapshot refreshed")}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d5e0ea] bg-white px-3.5 py-2.5 text-[12px] font-bold text-[#55708d] transition hover:border-[#a9c2d8] hover:text-[#245d8e]"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => announce("Export prepared for this prototype view")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1e638d] px-3.5 py-2.5 text-[12px] font-bold text-white shadow-[0_5px_14px_rgba(30,99,141,0.2)] transition hover:bg-[#194f72]"
            >
              <Download size={15} /> Export view
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Reports received" value="43" detail="+8.4%" accent="bg-[#2675b7]" icon={FileCheck2} direction="up" />
          <MetricCard label="Awaiting review" value="12" detail="+2.1%" accent="bg-[#bc7a35]" icon={TimerReset} direction="up" />
          <MetricCard label="In review" value="7" detail="−11.3%" accent="bg-[#5c8b83]" icon={Search} direction="down" />
          <MetricCard label="Average first review" value="1h 42m" detail="−18 min" accent="bg-[#806c8f]" icon={Clock3} direction="down" />
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
              onClick={() => announce("Review guidance opened")}
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
                  <button
                    type="button"
                    onClick={() => announce("Queue filters are shown in the status control")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dce5ed] bg-[#fbfcfd] px-2.5 text-[11px] font-bold text-[#658098] hover:border-[#aac2d4]"
                  >
                    <ListFilter size={14} /> Filter
                  </button>
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
              <p className="text-[10px] font-semibold text-[#97a7b6]">Showing recent activity · fictional data</p>
              <button type="button" onClick={() => announce("Reports workspace opened")} className="text-[11px] font-extrabold text-[#2d6e9b] hover:text-[#1d5278]">
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
                  <button type="button" onClick={() => announce(`${selectedReport.id} marked ready for review`)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#edf4f8] px-3 py-2.5 text-[11px] font-extrabold text-[#2d6e91] hover:bg-[#e1eef4]">
                    <FileCheck2 size={14} /> Open review details
                  </button>
                </>
              ) : (
                <p className="mt-5 rounded-xl bg-[#f7f9fa] p-4 text-[11px] leading-5 text-[#8294a4]">Select a report from the queue to see its review context.</p>
              )}
            </div>

            <div className="rounded-2xl border border-[#e2d9e1] bg-[#faf7fa] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eadde8] text-[#806178]"><ShieldAlert size={16} /></div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#987f94]">Separate record type</p>
                  <h3 className="mt-1 text-[14px] font-extrabold text-[#5e4660]">Confirmed violations</h3>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-[#806f7e]">Only findings completed through the authorized review process appear here. This is separate from ordinary reports and complaints.</p>
              <div className="mt-4 flex items-center justify-between border-t border-[#eadfe8] pt-3">
                <span className="font-mono text-[20px] font-bold tracking-[-0.04em] text-[#604b61]">4</span>
                <button type="button" onClick={() => announce("Confirmed violations workspace opened")} className="text-[11px] font-extrabold text-[#806178] hover:text-[#644c66]">View separate record <ChevronRight size={13} className="ml-1 inline" /></button>
              </div>
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
              {[28, 44, 37, 63, 48, 74, 57, 82, 65, 91, 72, 86].map((height, index) => (
                <div key={`${height}-${index}`} className="group flex h-full flex-1 flex-col justify-end">
                  <div className="relative flex flex-1 items-end">
                    <div className={`w-full rounded-t-[5px] transition group-hover:opacity-80 ${index === 9 ? "bg-[#d18a3c]" : "bg-[#8db8ca]"}`} style={{ height: `${height}%` }}>
                      <span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 rounded bg-[#264d69] px-1.5 py-0.5 font-mono text-[9px] text-white group-hover:block">{Math.round(height / 4)}</span>
                    </div>
                  </div>
                  <span className="mt-2 text-center text-[9px] font-semibold text-[#9aaaba]">{["M", "T", "W", "T", "F", "S", "S", "M", "T", "W", "T", "F"][index]}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-[#889aaa]"><span className="h-2 w-2 rounded-sm bg-[#d18a3c]" /> Selected day · 9 reports</div>
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
              {categories.map((category) => (
                <div key={category.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-[#617b92]">{category.label}</span>
                    <span className="font-mono text-[#8a9cac]">{category.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#edf2f5]"><div className={`h-full rounded-full ${category.color}`} style={{ width: category.width }} /></div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => announce("Category analytics opened")} className="mt-5 text-[11px] font-extrabold text-[#2d6e9b] hover:text-[#1d5278]">See category detail <ChevronRight size={13} className="ml-1 inline" /></button>
          </div>

          <div className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[15px] font-extrabold tracking-[-0.02em] text-[#1a3856]">Recent activity</h3>
                <p className="mt-1 text-[11px] text-[#8396a9]">Desk updates and routing</p>
              </div>
              <button type="button" onClick={() => announce("Activity filters opened")} className="rounded-lg p-1.5 text-[#89a0b2] hover:bg-[#f2f6f8] hover:text-[#4c718e]" aria-label="Filter recent activity"><SlidersHorizontal size={15} /></button>
            </div>
            <div className="mt-5 space-y-4">
              {visibleActivity.map((item) => (
                <div key={item.label} className="flex gap-2.5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.color}`} />
                  <div>
                    <p className="text-[11px] font-bold leading-4 text-[#5c748b]">{item.label}</p>
                    <p className="mt-1 text-[10px] text-[#9aaaba]">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setShowAllActivity((current) => !current)} className="mt-5 text-[11px] font-extrabold text-[#2d6e9b] hover:text-[#1d5278]">
              {showAllActivity ? "Show less" : "View all activity"} <ChevronRight size={13} className="ml-1 inline" />
            </button>
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-2 border-t border-[#dbe5ed] pt-4 text-[10px] font-semibold text-[#93a4b3] sm:flex-row">
          <span>Old Sagay · SUNN transport conduct review center</span>
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} /> Snapshot: 14 June 2024, 11:00 AM</span>
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

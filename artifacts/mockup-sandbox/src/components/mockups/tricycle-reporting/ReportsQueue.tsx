import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Clock3, FileSearch, MapPin, Search, ShieldCheck } from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { apiRequest, formatPhilippineDate } from "../../../lib/api";

type ReportStatus = "Received" | "Under Review" | "Verified" | "Referred" | "Resolved" | "Closed";
type QueueFilter = "All reports" | "Needs review" | "Verified" | "Completed";
type Report = {
  id: string;
  category: string;
  submittedAt: string;
  incidentDate: string;
  location: string;
  status: ReportStatus;
};

const statusLabels: Record<string, ReportStatus> = {
  SUBMITTED: "Received",
  RECEIVED: "Received",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  REFERRED: "Referred",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const statusStyle: Record<ReportStatus, string> = {
  Received: "border-[#d6e3f1] bg-[#f3f7fc] text-[#44617f]",
  "Under Review": "border-[#c6dafb] bg-[#eaf2ff] text-[#0c5bce]",
  Verified: "border-[#ddd4fa] bg-[#f4f0ff] text-[#6852b8]",
  Referred: "border-[#f2d9b4] bg-[#fff7e9] text-[#9b6011]",
  Resolved: "border-[#c4ead9] bg-[#ecfaf3] text-[#20885d]",
  Closed: "border-[#d7dde4] bg-[#eef1f4] text-[#58687a]",
};

function dateLabel(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : formatPhilippineDate(date);
}

function belongsToFilter(report: Report, filter: QueueFilter) {
  if (filter === "Needs review") return ["Received", "Under Review", "Referred"].includes(report.status);
  if (filter === "Verified") return report.status === "Verified";
  if (filter === "Completed") return ["Resolved", "Closed"].includes(report.status);
  return true;
}

export function ReportsQueue() {
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("All reports");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    let refreshing = false;
    let loaded = false;
    const refresh = async () => {
      if (!active || refreshing || document.visibilityState !== "visible") return;
      refreshing = true;
      try {
        const { complaints } = await apiRequest<{ complaints: Array<Record<string, any>> }>("/complaints");
        if (!active) return;
        setReports(complaints.map((item) => ({
          id: item.referenceNumber || item.reference_number || "Report",
          category: item.categoryName || item.category_name || "Uncategorized",
          submittedAt: item.createdAt || item.created_at || item.incidentDate || item.incident_date,
          incidentDate: item.incidentDate || item.incident_date,
          location: item.location || "Location not provided",
          status: statusLabels[String(item.status).toUpperCase()] ?? "Received",
        })));
        setLoadError("");
        loaded = true;
      } catch (error) {
        if (active && !loaded) setLoadError(error instanceof Error ? error.message : "Reports could not be loaded.");
      } finally {
        refreshing = false;
        if (active) setLoading(false);
      }
    };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 10_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => { active = false; window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  const counts = useMemo(() => ({
    all: reports.length,
    needsReview: reports.filter((report) => belongsToFilter(report, "Needs review")).length,
    verified: reports.filter((report) => report.status === "Verified").length,
    completed: reports.filter((report) => belongsToFilter(report, "Completed")).length,
  }), [reports]);

  const visibleReports = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return reports.filter((report) => belongsToFilter(report, filter) && (!query || [report.id, report.category, report.location, report.status].some((value) => value.toLocaleLowerCase().includes(query))));
  }, [filter, reports, search]);

  const openReport = (reference: string) => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    window.location.href = `${base}/preview/tricycle-reporting/ReviewWorkspace?reference=${encodeURIComponent(reference)}`;
  };

  const tabs: Array<{ label: QueueFilter; count: number }> = [
    { label: "All reports", count: counts.all },
    { label: "Needs review", count: counts.needsReview },
    { label: "Verified", count: counts.verified },
    { label: "Completed", count: counts.completed },
  ];

  return (
    <AppLayout officer active="Reports" title="Reports" eyebrow="Review center / Reports">
      <div className="mx-auto w-full max-w-[1180px] space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "All reports", value: counts.all, icon: FileSearch, color: "text-[#0c5bce]", tint: "bg-[#eaf2ff]" },
            { label: "Needs review", value: counts.needsReview, icon: Clock3, color: "text-[#a86d13]", tint: "bg-[#fff6e8]" },
            { label: "Verified", value: counts.verified, icon: ShieldCheck, color: "text-[#6852b8]", tint: "bg-[#f4f0ff]" },
            { label: "Completed", value: counts.completed, icon: CheckCircle2, color: "text-[#20885d]", tint: "bg-[#ecfaf3]" },
          ].map(({ label, value, icon: Icon, color, tint }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-[#dbe5f0] bg-white p-4 shadow-[0_5px_18px_rgba(36,72,111,0.035)]">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint} ${color}`}><Icon size={18} /></span>
              <div><p className="text-[11px] font-semibold text-[#8295aa]">{label}</p><p className="mt-0.5 text-[21px] font-extrabold leading-none text-[#23405f]">{value}</p></div>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-[22px] border border-[#d6e1ed] bg-white shadow-[0_7px_22px_rgba(35,64,95,0.045)]">
          <div className="border-b border-[#e5ecf3] px-5 py-5 sm:px-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div><h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-[#23405f]">Report queue</h2><p className="mt-1 text-[11px] text-[#8799ad]">Open a report to review evidence, update its status, or record a confirmed violation. Updates refresh every 10 seconds.</p></div>
              <label className="relative block w-full md:max-w-[300px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#92a2b4]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, category, location" className="w-full rounded-xl border border-[#dbe5f0] bg-[#fbfdff] py-2.5 pl-9 pr-3 text-[12px] text-[#294765] outline-none focus:border-[#86afe8] focus:ring-4 focus:ring-[#eaf2ff]" /></label>
            </div>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">{tabs.map((tab) => <button key={tab.label} type="button" onClick={() => setFilter(tab.label)} className={`shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-bold transition ${filter === tab.label ? "border-[#0c5bce] bg-[#0c5bce] text-white" : "border-[#dce6f0] bg-white text-[#627991] hover:bg-[#f5f9fd]"}`}>{tab.label}<span className={`ml-2 ${filter === tab.label ? "text-white/75" : "text-[#91a2b4]"}`}>{tab.count}</span></button>)}</div>
          </div>

          <div className="hidden grid-cols-[1.2fr_1fr_1fr_1fr_.7fr] items-center gap-4 border-b border-[#e5ecf3] bg-[#fbfdff] px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#8ba0b7] lg:grid"><span>Report</span><span>Category</span><span>Date submitted</span><span>Status</span><span className="text-right">Action</span></div>
          {loading ? <div className="flex items-center justify-center gap-2 px-6 py-16 text-[12px] font-semibold text-[#8295aa]"><Clock3 size={15} className="animate-pulse" />Loading reports…</div> : loadError ? <div className="mx-5 my-6 flex items-start gap-3 rounded-xl border border-[#f0d1d1] bg-[#fff7f7] p-4 text-[12px] text-[#9c4444]"><AlertCircle size={16} className="mt-0.5 shrink-0" /><div><p className="font-bold">Couldn’t load reports</p><p className="mt-1">{loadError}</p><button type="button" onClick={() => window.location.reload()} className="mt-2 font-bold underline">Try again</button></div></div> : visibleReports.length === 0 ? <div className="px-6 py-16 text-center"><FileSearch size={25} className="mx-auto text-[#9aacc0]" /><p className="mt-3 text-[13px] font-bold text-[#4d6783]">{reports.length ? "No reports match these filters" : "No reports yet"}</p><p className="mt-1 text-[11px] text-[#8a9caf]">New reports will appear here when they are submitted.</p></div> : (
            <div className="divide-y divide-[#e5ecf3]">{visibleReports.map((report) => (
              <div key={report.id} className="grid gap-4 px-5 py-4 transition hover:bg-[#fbfdff] sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr_1fr_.7fr] lg:items-center">
                <div className="min-w-0"><p className="truncate text-[13px] font-extrabold text-[#23405f]">{report.id}</p><p className="mt-1 flex items-center gap-1.5 truncate text-[11px] font-medium text-[#8499ae]"><MapPin size={12} className="shrink-0" />{report.location}</p><p className="mt-1 text-[10px] text-[#99a8b8]">Incident: {dateLabel(report.incidentDate)}</p></div>
                <p className="text-[12px] font-semibold text-[#34516f]">{report.category}</p>
                <p className="text-[12px] font-semibold text-[#34516f]">{dateLabel(report.submittedAt)}</p>
                <div><span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${statusStyle[report.status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{report.status}</span></div>
                <div className="flex justify-start lg:justify-end"><button type="button" onClick={() => openReport(report.id)} className="inline-flex items-center gap-2 rounded-lg border border-[#d4e0ee] bg-white px-3 py-2 text-[11px] font-bold text-[#075bc9] transition hover:border-[#9dbde3] hover:bg-[#eef6ff]">Review report <ChevronRight size={14} /></button></div>
              </div>
            ))}</div>
          )}
          {!loading && !loadError && visibleReports.length > 0 ? <p className="border-t border-[#e8eef4] px-6 py-3 text-[10px] font-semibold text-[#91a2b4]">Showing {visibleReports.length} of {reports.length} reports</p> : null}
        </section>
      </div>
    </AppLayout>
  );
}

export default ReportsQueue;

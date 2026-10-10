import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Clock3,
  FileSearch,
  FileText,
  Info,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { apiRequest, formatPhilippineDate, formatPhilippineDateTime, getCurrentUser } from "../../../lib/api";
import { getOfflineAccountData } from "../../../lib/offlineAccount";

type ReportStatus = "Received" | "Under Review" | "Verified" | "Referred" | "Resolved" | "Closed";
type ReportCategory = string;

type ReportRecord = {
  id: string;
  complaintId?: string;
  date: string;
  submittedAt: string;
  category: ReportCategory;
  status: ReportStatus;
  location: string;
  summary: string;
  lastUpdate: string;
  updateNote: string;
  confirmedViolation: boolean;
  reviewNotes?: Array<{ id: number; authorName: string; authorRole: string; description: string; createdAt: string }>;
};

const records: ReportRecord[] = [
  {
    id: "TRC-2026-00124",
    date: "2026-02-18",
    submittedAt: "February 18, 2026 · 8:42 AM",
    category: "Fare concern",
    status: "Under Review",
    location: "Old Sagay Public Market",
    summary: "Reported a fare amount that did not match the posted student rate.",
    lastUpdate: "Updated 2 days ago",
    updateNote: "The report is queued for an initial review.",
    confirmedViolation: false,
  },
  {
    id: "TRC-2026-00117",
    date: "2026-02-09",
    submittedAt: "February 9, 2026 · 4:16 PM",
    category: "Driver conduct",
    status: "Resolved",
    location: "Barangay Old Sagay Hall",
    summary: "Shared a concern about a driver declining a short student trip.",
    lastUpdate: "Updated February 13, 2026",
    updateNote: "The office contacted the route operator and recorded the resolution.",
    confirmedViolation: false,
  },
  {
    id: "TRC-2026-00098",
    date: "2026-01-22",
    submittedAt: "January 22, 2026 · 7:31 AM",
    category: "Vehicle condition",
    status: "Closed",
    location: "SUNN Main Gate",
    summary: "Noted a loose side panel on a tricycle waiting near the campus gate.",
    lastUpdate: "Updated January 28, 2026",
    updateNote: "The report was closed after the concern was documented and addressed.",
    confirmedViolation: false,
  },
  {
    id: "TRC-2026-00081",
    date: "2026-01-11",
    submittedAt: "January 11, 2026 · 6:58 PM",
    category: "Route concern",
    status: "Resolved",
    location: "Sagay City Transport Terminal",
    summary: "Reported that the evening trip did not follow the usual Old Sagay route.",
    lastUpdate: "Updated January 16, 2026",
    updateNote: "The route operator provided clarification and the record was resolved.",
    confirmedViolation: false,
  },
  {
    id: "TRC-2025-00342",
    date: "2025-12-14",
    submittedAt: "December 14, 2025 · 12:05 PM",
    category: "Fare concern",
    status: "Closed",
    location: "Sagay City Public Plaza",
    summary: "Asked the office to review an unclear fare collection during a holiday trip.",
    lastUpdate: "Updated December 19, 2025",
    updateNote: "The available details were recorded for reference and the report was closed.",
    confirmedViolation: false,
  },
];

const statusOptions: Array<"All statuses" | ReportStatus> = [
  "All statuses",
  "Received",
  "Under Review",
  "Verified",
  "Referred",
  "Resolved",
  "Closed",
];
const statusStyles: Record<ReportStatus, string> = {
  Received: "border-[#d6e3f1] bg-[#f3f7fc] text-[#44617f]",
  "Under Review": "border-[#f5dfaf] bg-[#fff8e7] text-[#9a6814]",
  Verified: "border-[#ddd4fa] bg-[#f4f0ff] text-[#6852b8]",
  Referred: "border-[#f2d9b4] bg-[#fff7e9] text-[#9b6011]",
  Resolved: "border-[#bde9d5] bg-[#edf9f3] text-[#207a53]",
  Closed: "border-[#d8e1eb] bg-[#f4f7fa] text-[#65788e]",
};

const statusDotStyles: Record<ReportStatus, string> = {
  Received: "bg-[#7390ae]",
  "Under Review": "bg-[#d99927]",
  Verified: "bg-[#8069cf]",
  Referred: "bg-[#d9972e]",
  Resolved: "bg-[#2e9c6a]",
  Closed: "bg-[#8ca0b6]",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function reportStatus(value: string): ReportStatus {
  const labels: Record<string, ReportStatus> = { SUBMITTED: "Received", RECEIVED: "Received", UNDER_REVIEW: "Under Review", VERIFIED: "Verified", REFERRED: "Referred", RESOLVED: "Resolved", CLOSED: "Closed" };
  return labels[String(value).toUpperCase()] ?? "Received";
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-[#dbe5f0] bg-[#fbfdff] px-3.5 pr-9 text-[12px] font-semibold text-[#38516d] outline-none transition focus:border-[#77a9e8] focus:ring-4 focus:ring-[#eaf2ff]"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba0b7]"
      />
    </label>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.01em] ${statusStyles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDotStyles[status]}`} />
      {status}
    </span>
  );
}

function ReportDetails({
  report,
  onClose,
}: {
  report: ReportRecord;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#132238]/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-details-title"
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[24px] border border-[#dbe5f0] bg-[#fbfdff] shadow-[0_20px_70px_rgba(19,34,56,0.2)] sm:max-w-[560px] sm:rounded-[24px]"
      >
        <div className="flex items-start justify-between border-b border-[#e4ebf3] px-5 py-5 sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8ca0b6]">Report record</p>
            <h2 id="report-details-title" className="mt-1.5 text-[19px] font-extrabold tracking-[-0.03em] text-[#163154]">
              {report.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#7287a0] transition hover:bg-[#eef4fb] hover:text-[#23405f]"
            aria-label="Close report details"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} />
            <span className="rounded-full border border-[#dbe5f0] bg-white px-2.5 py-1 text-[10px] font-bold text-[#6e8299]">
              {report.category}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f3f7fc] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8ca0b6]">Submitted</p>
              <p className="mt-2 text-[12px] font-semibold leading-5 text-[#38516d]">{report.submittedAt}</p>
            </div>
            <div className="rounded-2xl bg-[#f3f7fc] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8ca0b6]">Location</p>
              <p className="mt-2 text-[12px] font-semibold leading-5 text-[#38516d]">{report.location}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8ca0b6]">Your report</p>
            <p className="mt-2 text-[13px] leading-6 text-[#526981]">{report.summary}</p>
          </div>
          <div className="rounded-2xl border border-[#d6e5f4] bg-[#f0f7ff] p-4">
            <div className="flex gap-3">
              <Info size={17} className="mt-0.5 shrink-0 text-[#0c5bce]" />
              <div>
                <p className="text-[12px] font-extrabold text-[#234b7c]">Latest office update</p>
                <p className="mt-1 text-[12px] leading-5 text-[#56718f]">{report.updateNote}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d9ab8]">{report.lastUpdate}</p>
              </div>
            </div>
          </div>
          {report.reviewNotes?.length ? (
            <div className="rounded-2xl border border-[#dbe5f0] bg-white p-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#0c5bce]" />
                <p className="text-[12px] font-extrabold text-[#234b7c]">Authorized personnel notes</p>
              </div>
              <div className="mt-3 space-y-3">
                {report.reviewNotes.map((note) => (
                  <div key={note.id} className="border-t border-[#eef2f6] pt-3 first:border-0 first:pt-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#8295aa]">
                      <span className="font-bold text-[#4a6580]">{note.authorName || "Authorized reviewer"}</span>
                      <span>·</span>
                      <span>{note.authorRole.replaceAll("_", " ")}</span>
                      <span>·</span>
                      <span>{formatPhilippineDateTime(note.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-5 text-[#657d94]">{note.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex items-start gap-3 rounded-2xl border border-[#eadfc8] bg-[#fffaf0] p-4">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#a4762a]" />
            <p className="text-[11px] leading-5 text-[#735e37]">
              {report.confirmedViolation ? <><strong className="font-extrabold">A confirmed violation is recorded</strong> for this report following authorized review.</> : <>This record is a <strong className="font-extrabold">Report</strong>. It is not a confirmed violation. A separate review process is required before any violation can be established.</>}
            </p>
          </div>
          {report.complaintId ? <a href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/ReportTracking?reference=${encodeURIComponent(report.id)}`} className="inline-flex w-full items-center justify-center rounded-xl bg-[#0c5bce] px-4 py-3 text-[12px] font-extrabold text-white hover:bg-[#084da9]">Open full report tracking</a> : null}
        </div>
      </div>
    </div>
  );
}

export function MyReports() {
  const currentUser = getCurrentUser();
  const isDriver = currentUser?.role === "DRIVER";
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [category, setCategory] = useState("All categories");
  const [dateRange, setDateRange] = useState("Any date");
  const [sortDescending, setSortDescending] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [liveRecords, setLiveRecords] = useState<ReportRecord[]>([]);
  const [loadError, setLoadError] = useState("");
  const categoryOptions = useMemo(() => ["All categories", ...Array.from(new Set(liveRecords.map((report) => report.category).filter(Boolean)))], [liveRecords]);

  useEffect(() => {
    apiRequest<{ complaints: Array<{ id: string; referenceNumber: string; status: string; categoryName: string; incidentDate: string; incidentTime: string; location: string; description: string; createdAt: string; confirmedViolation?: boolean | number }> }>("/complaints")
      .then(({ complaints }) => {
        setLoadError("");
        setLiveRecords(complaints.map((item) => ({
        id: item.referenceNumber,
        complaintId: item.id,
        date: item.incidentDate,
        submittedAt: `${item.incidentDate} · ${item.incidentTime}`,
        category: item.categoryName as ReportCategory,
        status: reportStatus(item.status),
        location: item.location,
        summary: item.description,
        lastUpdate: formatPhilippineDate(item.createdAt),
        updateNote: "Current status is shown from the review record.",
        confirmedViolation: Boolean(item.confirmedViolation),
      } as ReportRecord)));
      })
      .catch(async () => {
        const cached = await getOfflineAccountData().catch(() => null);
        const belongsToCurrentAccount = Boolean(cached && currentUser && cached.user.id === currentUser.id && cached.user.role === currentUser.role);
        const cachedReports = cached && belongsToCurrentAccount ? cached.reports : [];
        setLoadError(cachedReports.length ? "Offline: showing your last saved reports; status changes may not be current." : "Could not load reports for this account. Check your connection and try again.");
        setLiveRecords(cachedReports.map((item) => ({
          id: String(item.referenceNumber ?? item.id ?? "Offline report"),
          complaintId: String(item.id ?? ""),
          date: String(item.incidentDate ?? ""),
          submittedAt: `${String(item.incidentDate ?? "")} · ${String(item.incidentTime ?? "")}`,
          category: String(item.categoryName ?? "Other") as ReportCategory,
          status: reportStatus(String(item.status ?? "SUBMITTED")),
          location: String(item.location ?? ""),
          summary: String(item.description ?? ""),
          lastUpdate: formatPhilippineDate(String(item.createdAt ?? new Date().toISOString())),
          updateNote: "Showing the last data downloaded while online.",
          confirmedViolation: Boolean(item.confirmedViolation),
        } as ReportRecord)));
      });
  }, []);

  useEffect(() => {
    let active = true;
    let refreshing = false;
    const refresh = async () => {
      if (!active || refreshing || document.visibilityState !== "visible") return;
      refreshing = true;
      try {
        const { complaints } = await apiRequest<{ complaints: Array<{ id: string; referenceNumber: string; status: string; categoryName: string; incidentDate: string; incidentTime: string; location: string; description: string; createdAt: string; confirmedViolation?: boolean | number }> }>("/complaints");
        if (!active) return;
        setLoadError("");
        setLiveRecords((current) => {
          const currentById = new Map(current.map((report) => [report.id, report]));
          const refreshed = complaints.map((item) => {
            const prior = currentById.get(item.referenceNumber);
            return {
              id: item.referenceNumber,
              complaintId: item.id,
              date: item.incidentDate,
              submittedAt: `${item.incidentDate} Â· ${item.incidentTime}`,
              category: item.categoryName as ReportCategory,
              status: reportStatus(item.status),
              location: item.location,
              summary: item.description,
              lastUpdate: formatPhilippineDate(item.createdAt),
              updateNote: "Current status is shown from the review record.",
              confirmedViolation: item.confirmedViolation === undefined ? (prior?.confirmedViolation ?? false) : Boolean(item.confirmedViolation),
              reviewNotes: prior?.reviewNotes,
            } as ReportRecord;
          });
          return refreshed;
        });
      } catch {
        // Keep the last successful response visible during brief connection interruptions.
      } finally {
        refreshing = false;
      }
    };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    const interval = window.setInterval(() => void refresh(), 10_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => { active = false; window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [selectedReport?.id]);

  useEffect(() => {
    if (!selectedReport) return;
    const latest = liveRecords.find((report) => report.id === selectedReport.id);
    if (latest) setSelectedReport((current) => current ? { ...current, ...latest, reviewNotes: current.reviewNotes } : current);
  }, [liveRecords, selectedReport?.id]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const now = new Date();
    const cutoff =
      dateRange === "Last 30 days"
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        : dateRange === "Last 90 days"
          ? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          : null;

    return liveRecords
      .filter((report) => {
        const searchable = `${report.id} ${report.category} ${report.location} ${report.summary}`.toLowerCase();
        const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
        const matchesStatus = status === "All statuses" || report.status === status;
        const matchesCategory = category === "All categories" || report.category === category;
        const matchesDate = !cutoff || new Date(`${report.date}T00:00:00`) >= cutoff;
        return matchesQuery && matchesStatus && matchesCategory && matchesDate;
      })
      .sort((a, b) => {
        const difference = new Date(`${a.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime();
        return sortDescending ? -difference : difference;
      });
  }, [category, dateRange, liveRecords, query, sortDescending, status]);

  const activeFilterCount = [status !== "All statuses", category !== "All categories", dateRange !== "Any date"].filter(Boolean).length;
  const hasFilters = Boolean(query.trim()) || activeFilterCount > 0;

  const clearFilters = () => {
    setQuery("");
    setStatus("All statuses");
    setCategory("All categories");
    setDateRange("Any date");
  };

  const openReport = (report: ReportRecord) => {
    setSelectedReport({ ...report, reviewNotes: [] });
    if (!report.complaintId) return;
    apiRequest<{ actions: Array<{ id: number; description: string; authorName?: string; authorRole?: string; created_at: string; createdAt?: string }>; violation?: Record<string, unknown> | null }>(`/complaints/${report.complaintId}`)
      .then(({ actions, violation }) => {
        const confirmedViolation = Boolean(violation);
        setLiveRecords((current) => current.map((item) => item.id === report.id ? { ...item, confirmedViolation } : item));
        setSelectedReport((current) => current?.id === report.id ? {
          ...current,
          confirmedViolation,
          reviewNotes: actions.map((action) => ({
            id: action.id,
            authorName: action.authorName ?? "Authorized reviewer",
            authorRole: action.authorRole ?? "AUTHORIZED_PERSONNEL",
            description: action.description,
            createdAt: action.createdAt ?? action.created_at,
          })),
        } : current);
      })
      .catch(() => undefined);
  };

  return (
    <AppLayout active="My reports" title="My reports" eyebrow={isDriver ? "Driver workspace" : "Student workspace"}>
      <div className="mx-auto max-w-[1190px]">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-[#0c5bce]">
              <FileText size={16} strokeWidth={2.2} />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em]">Report history</span>
            </div>
            <h2 className="mt-2 text-[29px] font-extrabold tracking-[-0.045em] text-[#163154] sm:text-[34px]">
              Keep track of what you raised.
            </h2>
            <p className="mt-2 max-w-[590px] text-[13px] leading-6 text-[#71859e]">
              {isDriver ? "Review concerns linked to your driver and vehicle records in Barangay Old Sagay. Status updates refresh every 10 seconds." : "Review the concerns you submitted about tricycle conduct in Barangay Old Sagay. Status updates refresh every 10 seconds."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-[#dbe5f0] bg-white px-3.5 py-3 shadow-[0_4px_15px_rgba(26,63,99,0.04)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#0c5bce]">
              <FileSearch size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8ca0b6]">Total reports</p>
              <p className="mt-0.5 text-[17px] font-extrabold tracking-[-0.03em] text-[#23405f]">{liveRecords.length}</p>
            </div>
          </div>
        </div>

        {loadError ? <div role="status" className="mt-5 rounded-xl border border-[#eadfc8] bg-[#fffaf0] px-4 py-3 text-[11px] font-semibold text-[#80662e]">{loadError}</div> : null}
        <div className="mt-7 flex flex-col gap-3 rounded-[20px] border border-[#dbe5f0] bg-white p-3.5 shadow-[0_5px_20px_rgba(35,64,95,0.04)] lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search reports</span>
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a4b8]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by report ID, location, or keyword"
              className="h-11 w-full rounded-xl border border-[#dbe5f0] bg-[#fbfdff] pl-10 pr-3 text-[12px] font-medium text-[#294461] outline-none placeholder:text-[#9aabbe] transition focus:border-[#77a9e8] focus:ring-4 focus:ring-[#eaf2ff]"
            />
          </label>
          <div className="flex items-center gap-2">
            <div className="hidden h-8 w-px bg-[#e4ebf3] lg:block" />
            <span className="hidden items-center gap-1.5 px-1 text-[11px] font-bold text-[#7890aa] sm:flex">
              <SlidersHorizontal size={14} />
              Filter
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#eaf2ff] px-1 text-[10px] text-[#0c5bce]">{activeFilterCount}</span>
              ) : null}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[445px]">
            <SelectField label="Status" value={status} options={statusOptions} onChange={setStatus} />
            <SelectField label="Category" value={category} options={categoryOptions} onChange={setCategory} />
            <SelectField label="Date" value={dateRange} options={["Any date", "Last 30 days", "Last 90 days"]} onChange={setDateRange} />
          </div>
          <button
            type="button"
            onClick={() => setSortDescending((current) => !current)}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dbe5f0] bg-[#fbfdff] px-3 text-[11px] font-bold text-[#59708a] transition hover:border-[#b8cee7] hover:bg-[#f4f8fd] lg:w-[112px]"
            title={sortDescending ? "Showing newest first" : "Showing oldest first"}
          >
            {sortDescending ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
            {sortDescending ? "Newest" : "Oldest"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-[#8295aa]">
            Showing <span className="font-extrabold text-[#46617d]">{filteredRecords.length}</span> of {liveRecords.length} reports
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {hasFilters ? (
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-[#0c5bce] transition hover:bg-[#eaf2ff]">
                <RotateCcw size={13} />
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 rounded-[22px] border border-[#dbe5f0] bg-white shadow-[0_6px_24px_rgba(35,64,95,0.045)]">
          {filteredRecords.length > 0 ? (
            <>
              <div className="hidden grid-cols-[1.2fr_1fr_1fr_1.15fr_0.65fr] items-center gap-4 border-b border-[#e4ebf3] px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#91a3b7] lg:grid">
                <span>Report</span>
                <span>Category</span>
                <span>Date submitted</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>
              <div className="divide-y divide-[#e7edf4]">
                {filteredRecords.map((report) => (
                  <div key={report.id} className="group px-4 py-4 transition hover:bg-[#fbfdff] sm:px-6 lg:grid lg:grid-cols-[1.2fr_1fr_1fr_1.15fr_0.65fr] lg:items-center lg:gap-4 lg:py-5">
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3 lg:block">
                        <div>
                          <p className="truncate text-[13px] font-extrabold tracking-[-0.01em] text-[#23405f]">{report.id}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#8a9caf]">
                            <MapPin size={12} className="shrink-0" />
                            <span className="truncate">{report.location}</span>
                          </p>
                        </div>
                        <div className="lg:hidden">
                          <StatusBadge status={report.status} />
                        </div>
                      </div>
                      <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-[#667c94] lg:hidden">{report.summary}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between lg:mt-0 lg:block">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0afbf] lg:hidden">Category</p>
                        <p className="text-[12px] font-semibold text-[#506b87]">{report.category}</p>
                      </div>
                      <div className="lg:hidden">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0afbf]">Submitted</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-[#506b87]">{formatDate(report.date)}</p>
                      </div>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-[12px] font-semibold text-[#506b87]">{formatDate(report.date)}</p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-[#93a3b4]">
                        <Clock3 size={11} />
                        {report.lastUpdate}
                      </p>
                    </div>
                    <div className="mt-3 hidden lg:block">
                      <StatusBadge status={report.status} />
                    </div>
                    <div className="mt-4 flex items-center justify-between lg:mt-0 lg:justify-end">
                      <p className="flex items-center gap-1 text-[10px] text-[#93a3b4] lg:hidden">
                        <Clock3 size={11} />
                        {report.lastUpdate}
                      </p>
                      <button
                        type="button"
                        onClick={() => openReport(report)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbe5f0] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#0c5bce] transition hover:border-[#9dbde3] hover:bg-[#eaf2ff]"
                      >
                        View details
                        <ChevronDown size={13} className="-rotate-90" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[335px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-[22px] bg-[#eaf2ff] text-[#0c5bce]">
                <FileSearch size={29} strokeWidth={1.7} />
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-[#e8794f]" />
              </div>
              <h3 className="mt-5 text-[17px] font-extrabold tracking-[-0.025em] text-[#23405f]">
                {liveRecords.length === 0 ? "No reports yet" : "No matching reports"}
              </h3>
              <p className="mt-2 max-w-[390px] text-[12px] leading-5 text-[#8295aa]">
                {liveRecords.length === 0 && loadError ? "Your reports could not be confirmed. Try again after checking your connection." : liveRecords.length === 0 ? "Reports submitted from your account will appear here." : "Try a different keyword or remove one of your filters to see more report records."}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0c5bce] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_6px_16px_rgba(12,91,206,0.18)] transition hover:bg-[#084eaf]"
              >
                Clear filters
                <ChevronDown size={14} className="-rotate-90" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#d9e5f1] bg-[#f0f7ff] px-4 py-3.5 sm:px-5">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#0c5bce]" />
          <p className="text-[11px] leading-5 text-[#56718f]">
            <strong className="font-extrabold text-[#31577f]">A report is not a confirmed violation.</strong> Each submission is reviewed by authorized personnel. A confirmed violation, if any, is recorded separately after the appropriate review.
          </p>
        </div>
      </div>

      {selectedReport ? <ReportDetails report={selectedReport} onClose={() => setSelectedReport(null)} /> : null}
    </AppLayout>
  );
}

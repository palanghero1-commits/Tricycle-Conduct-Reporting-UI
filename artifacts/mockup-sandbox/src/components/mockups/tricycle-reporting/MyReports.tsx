import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Clock3,
  Eye,
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

type ReportStatus = "Under Review" | "Resolved" | "Closed";
type ReportCategory = "Fare concern" | "Route concern" | "Driver conduct" | "Vehicle condition";

type ReportRecord = {
  id: string;
  date: string;
  submittedAt: string;
  category: ReportCategory;
  status: ReportStatus;
  location: string;
  summary: string;
  lastUpdate: string;
  updateNote: string;
  confirmedViolation: boolean;
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
  "Under Review",
  "Resolved",
  "Closed",
];
const categoryOptions: Array<"All categories" | ReportCategory> = [
  "All categories",
  "Fare concern",
  "Route concern",
  "Driver conduct",
  "Vehicle condition",
];

const statusStyles: Record<ReportStatus, string> = {
  "Under Review": "border-[#f5dfaf] bg-[#fff8e7] text-[#9a6814]",
  Resolved: "border-[#bde9d5] bg-[#edf9f3] text-[#207a53]",
  Closed: "border-[#d8e1eb] bg-[#f4f7fa] text-[#65788e]",
};

const statusDotStyles: Record<ReportStatus, string> = {
  "Under Review": "bg-[#d99927]",
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
          <div className="flex items-start gap-3 rounded-2xl border border-[#eadfc8] bg-[#fffaf0] p-4">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#a4762a]" />
            <p className="text-[11px] leading-5 text-[#735e37]">
              This record is a <strong className="font-extrabold">Report</strong>. It is not a confirmed violation. A separate review process is required before any violation can be established.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyReports() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [category, setCategory] = useState("All categories");
  const [dateRange, setDateRange] = useState("Any date");
  const [sortDescending, setSortDescending] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const now = new Date("2026-02-24T00:00:00");
    const cutoff =
      dateRange === "Last 30 days"
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        : dateRange === "Last 90 days"
          ? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          : null;

    return records
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
  }, [category, dateRange, query, sortDescending, status]);

  const activeFilterCount = [status !== "All statuses", category !== "All categories", dateRange !== "Any date"].filter(Boolean).length;
  const hasFilters = Boolean(query.trim()) || activeFilterCount > 0;

  const clearFilters = () => {
    setQuery("");
    setStatus("All statuses");
    setCategory("All categories");
    setDateRange("Any date");
  };

  return (
    <AppLayout active="My reports" title="My reports" eyebrow="Student workspace">
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
              Review the concerns you submitted about tricycle conduct in Barangay Old Sagay. Updates here reflect the current record status.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-[#dbe5f0] bg-white px-3.5 py-3 shadow-[0_4px_15px_rgba(26,63,99,0.04)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#0c5bce]">
              <FileSearch size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8ca0b6]">Total reports</p>
              <p className="mt-0.5 text-[17px] font-extrabold tracking-[-0.03em] text-[#23405f]">{records.length}</p>
            </div>
          </div>
        </div>

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
            Showing <span className="font-extrabold text-[#46617d]">{showEmptyState ? 0 : filteredRecords.length}</span> of {records.length} reports
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {hasFilters ? (
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-[#0c5bce] transition hover:bg-[#eaf2ff]">
                <RotateCcw size={13} />
                Clear filters
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowEmptyState((current) => !current)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${showEmptyState ? "border-[#b7cfee] bg-[#eaf2ff] text-[#0c5bce]" : "border-[#dbe5f0] bg-white text-[#71859e] hover:bg-[#f4f8fd]"}`}
            >
              <Eye size={13} />
              {showEmptyState ? "Show sample records" : "Preview empty state"}
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-[22px] border border-[#dbe5f0] bg-white shadow-[0_6px_24px_rgba(35,64,95,0.045)]">
          {!showEmptyState && filteredRecords.length > 0 ? (
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
                        onClick={() => setSelectedReport(report)}
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
                {showEmptyState ? "No reports in this view" : "No matching reports"}
              </h3>
              <p className="mt-2 max-w-[390px] text-[12px] leading-5 text-[#8295aa]">
                {showEmptyState
                  ? "This is a local preview of the empty state students see before submitting their first report."
                  : "Try a different keyword or remove one of your filters to see more report records."}
              </p>
              <button
                type="button"
                onClick={showEmptyState ? () => setShowEmptyState(false) : clearFilters}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0c5bce] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_6px_16px_rgba(12,91,206,0.18)] transition hover:bg-[#084eaf]"
              >
                {showEmptyState ? "Show sample records" : "Clear filters"}
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
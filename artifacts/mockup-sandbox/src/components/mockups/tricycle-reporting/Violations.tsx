import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Eye,
  FileText,
  Filter,
  Info,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";

type ViolationStatus = "Action pending" | "Action recorded" | "Closed for review";

type Violation = {
  id: string;
  driver: string;
  driverInitials: string;
  relatedReport: string;
  type: string;
  date: string;
  dateValue: string;
  status: ViolationStatus;
  action: string;
  summary: string;
  evidence: string;
};

const initialViolations: Violation[] = [
  {
    id: "VIO-0427",
    driver: "Rogelio Manalo",
    driverInitials: "RM",
    relatedReport: "RPT-1842",
    type: "Passenger capacity",
    date: "20 Feb 2025",
    dateValue: "2025-02-20",
    status: "Action pending",
    action: "Written advisory",
    summary: "The confirmed record relates to a passenger capacity concern observed on the Old Sagay route.",
    evidence: "Officer review of the submitted account and route notes.",
  },
  {
    id: "VIO-0424",
    driver: "Edgar Villacorta",
    driverInitials: "EV",
    relatedReport: "RPT-1836",
    type: "Fare display",
    date: "18 Feb 2025",
    dateValue: "2025-02-18",
    status: "Action recorded",
    action: "Fare board update",
    summary: "The confirmed record relates to fare information not being visible at the time of the trip.",
    evidence: "Officer review and a follow-up check at the tricycle terminal.",
  },
  {
    id: "VIO-0419",
    driver: "Maribel Dizon",
    driverInitials: "MD",
    relatedReport: "RPT-1814",
    type: "Route conduct",
    date: "14 Feb 2025",
    dateValue: "2025-02-14",
    status: "Closed for review",
    action: "Record maintained",
    summary: "The confirmed record relates to a route conduct concern reported near the public market.",
    evidence: "Officer review of the account and the associated route log.",
  },
  {
    id: "VIO-0415",
    driver: "Nestor Salcedo",
    driverInitials: "NS",
    relatedReport: "RPT-1798",
    type: "Passenger safety",
    date: "10 Feb 2025",
    dateValue: "2025-02-10",
    status: "Action pending",
    action: "Safety orientation",
    summary: "The confirmed record relates to a passenger safety concern recorded during a school-day route.",
    evidence: "Officer review of the submitted account and route context.",
  },
  {
    id: "VIO-0408",
    driver: "Lorna Abesamis",
    driverInitials: "LA",
    relatedReport: "RPT-1772",
    type: "Vehicle identification",
    date: "06 Feb 2025",
    dateValue: "2025-02-06",
    status: "Action recorded",
    action: "Information update",
    summary: "The confirmed record relates to vehicle identification details being unclear in the submitted account.",
    evidence: "Officer review and an updated operator record.",
  },
];

const statusOptions: Array<"All statuses" | ViolationStatus> = [
  "All statuses",
  "Action pending",
  "Action recorded",
  "Closed for review",
];

const statusStyles: Record<ViolationStatus, string> = {
  "Action pending": "border-[#f4d8b1] bg-[#fff7ea] text-[#ad6817]",
  "Action recorded": "border-[#c5e8d8] bg-[#effaf4] text-[#277957]",
  "Closed for review": "border-[#d8dfeb] bg-[#f5f7fa] text-[#667990]",
};

function StatusBadge({ status }: { status: ViolationStatus }) {
  const icon = status === "Action pending" ? <Clock3 size={12} /> : status === "Action recorded" ? <CheckCircle2 size={12} /> : <ShieldCheck size={12} />;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-[0.02em] ${statusStyles[status]}`}>
      {icon}
      {status}
    </span>
  );
}

function InitialsAvatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#e4efff] text-[11px] font-extrabold text-[#2368bf]">
      {initials}
    </span>
  );
}

export function Violations() {
  const [violations, setViolations] = useState(initialViolations);
  const [activeTab, setActiveTab] = useState("All confirmed");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All statuses" | ViolationStatus>("All statuses");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState("");

  const types = useMemo(() => ["All types", ...Array.from(new Set(initialViolations.map((item) => item.type)))], []);

  const filteredViolations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return violations.filter((item) => {
      const matchesTab =
        activeTab === "All confirmed" ||
        (activeTab === "Needs action" && item.status === "Action pending") ||
        (activeTab === "Recorded" && item.status === "Action recorded") ||
        (activeTab === "Closed" && item.status === "Closed for review");
      const matchesStatus = statusFilter === "All statuses" || item.status === statusFilter;
      const matchesType = typeFilter === "All types" || item.type === typeFilter;
      const matchesSearch =
        !query ||
        [item.id, item.driver, item.relatedReport, item.type, item.action].some((value) => value.toLowerCase().includes(query));
      return matchesTab && matchesStatus && matchesType && matchesSearch;
    });
  }, [activeTab, search, statusFilter, typeFilter, violations]);

  const pendingCount = violations.filter((item) => item.status === "Action pending").length;
  const recordedCount = violations.filter((item) => item.status === "Action recorded").length;

  function recordAction(id: string) {
    setViolations((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "Action recorded" } : item)),
    );
    setSelectedViolation((current) => (current?.id === id ? { ...current, status: "Action recorded" } : current));
    setActionNotice("Authorized action recorded locally for this prototype.");
  }

  function closeForReview(id: string) {
    setViolations((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "Closed for review" } : item)),
    );
    setSelectedViolation((current) => (current?.id === id ? { ...current, status: "Closed for review" } : current));
    setActionNotice("Record marked closed for review locally.");
  }

  return (
    <AppLayout officer active="Violations" title="Confirmed violations" eyebrow="Review center">
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[24px] border border-[#d8e4f1] bg-white px-6 py-6 shadow-[0_14px_34px_rgba(33,66,106,0.05)] lg:px-8 lg:py-7">
          <div className="absolute right-[-34px] top-[-45px] h-44 w-44 rounded-full border-[22px] border-[#edf4ff]" />
          <div className="absolute right-14 top-10 h-8 w-8 rounded-full bg-[#fff3df]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div className="max-w-[720px]">
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#286bc2]">
                <BadgeCheck size={15} strokeWidth={2.2} />
                Authorized records
              </div>
              <h2 className="mt-3 max-w-[620px] text-[28px] font-black tracking-[-0.045em] text-[#12305a] lg:text-[35px]">
                Confirmed violation records, kept separate.
              </h2>
              <p className="mt-3 max-w-[650px] text-[13px] leading-6 text-[#6d8199]">
                A complaint record captures a submitted account for review. This section only shows records where an authorized officer has completed a separate confirmation step. A report is not a confirmed violation, and confirmation does not describe intent or assign blame.
              </p>
            </div>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setGuidanceOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#d7e4f2] bg-[#f8fbff] px-3.5 py-2.5 text-[12px] font-extrabold text-[#2d5f9b] transition hover:border-[#b7cde7] hover:bg-[#f0f6ff]"
              >
                <Info size={15} />
                Review guidance
                <ChevronDown size={14} className={`transition-transform ${guidanceOpen ? "rotate-180" : ""}`} />
              </button>
              {guidanceOpen ? (
                <div className="absolute right-0 top-12 z-10 w-[280px] rounded-2xl border border-[#d7e4f2] bg-white p-4 shadow-[0_16px_35px_rgba(31,65,106,0.15)]">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8aa0b7]">Record standard</p>
                  <p className="mt-2 text-[12px] leading-5 text-[#5d728c]">
                    Confirmed records are created after an authorized review step. Keep the related report visible for context and use only the action options available to your role.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.8fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[22px] bg-[#12305a] px-5 py-5 text-white shadow-[0_14px_30px_rgba(18,48,90,0.16)]">
            <div className="absolute bottom-[-42px] right-[-12px] h-36 w-36 rounded-full border-[18px] border-white/10" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#aac7ed]">Record overview</p>
                <p className="mt-2 text-[31px] font-black tracking-[-0.05em]">{violations.length}</p>
                <p className="mt-1 text-[12px] font-semibold text-[#c3d4ea]">confirmed records in the prototype</p>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5 text-[#b9d5ff]">
                <ClipboardCheck size={19} />
              </div>
            </div>
          </div>
          <div className="rounded-[22px] border border-[#f1dfc4] bg-[#fff9ef] px-5 py-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#aa7c44]">Needs action</p>
              <Clock3 size={18} className="text-[#c38b43]" />
            </div>
            <p className="mt-3 text-[28px] font-black tracking-[-0.04em] text-[#8e5d1f]">{pendingCount}</p>
            <p className="mt-1 text-[12px] font-semibold text-[#a67d4c]">awaiting an authorized response</p>
          </div>
          <div className="rounded-[22px] border border-[#d3eadf] bg-[#f2fbf6] px-5 py-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#52866d]">Action recorded</p>
              <CheckCircle2 size={18} className="text-[#42916f]" />
            </div>
            <p className="mt-3 text-[28px] font-black tracking-[-0.04em] text-[#297456]">{recordedCount}</p>
            <p className="mt-1 text-[12px] font-semibold text-[#5f9079]">with a local response noted</p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8ca0b6]">Record index</p>
              <h3 className="mt-1 text-[21px] font-black tracking-[-0.035em] text-[#163154]">Review confirmed records</h3>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <label className="relative block min-w-[260px]">
                <span className="sr-only">Search confirmed records</span>
                <Search size={16} className="pointer-events-none absolute left-3.5 top-3 text-[#8ca0b6]" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search ID, driver, or report"
                  className="h-10 w-full rounded-xl border border-[#d8e4f1] bg-white pl-10 pr-3 text-[12px] font-semibold text-[#28435f] outline-none transition placeholder:text-[#a5b4c4] focus:border-[#7eaddd] focus:ring-4 focus:ring-[#e8f2ff]"
                />
              </label>
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3.5 text-[12px] font-extrabold transition ${
                  filtersOpen || statusFilter !== "All statuses" || typeFilter !== "All types"
                    ? "border-[#a9c8ea] bg-[#edf5ff] text-[#1e65b8]"
                    : "border-[#d8e4f1] bg-white text-[#637991] hover:border-[#b7cde7]"
                }`}
              >
                <SlidersHorizontal size={15} />
                Filters
                {statusFilter !== "All statuses" || typeFilter !== "All types" ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2d75c9] px-1 text-[9px] text-white">!</span>
                ) : null}
              </button>
            </div>
          </div>

          {filtersOpen ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-[#d8e4f1] bg-[#f9fbfe] p-4 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8ca0b6]">Status</span>
                <span className="relative block">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as "All statuses" | ViolationStatus)}
                    className="h-10 w-full appearance-none rounded-xl border border-[#d8e4f1] bg-white px-3 text-[12px] font-bold text-[#35516e] outline-none focus:border-[#7eaddd]"
                  >
                    {statusOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-3 text-[#8ca0b6]" />
                </span>
              </label>
              <label className="flex-1">
                <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8ca0b6]">Violation type</span>
                <span className="relative block">
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-[#d8e4f1] bg-white px-3 text-[12px] font-bold text-[#35516e] outline-none focus:border-[#7eaddd]"
                  >
                    {types.map((option) => <option key={option}>{option}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-3 text-[#8ca0b6]" />
                </span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("All statuses");
                  setTypeFilter("All types");
                }}
                className="h-10 rounded-xl px-3 text-[11px] font-extrabold text-[#6d8199] hover:bg-white hover:text-[#2d5f9b]"
              >
                Clear filters
              </button>
            </div>
          ) : null}

          <div className="flex gap-1 overflow-x-auto border-b border-[#dce6f0]">
            {[
              { label: "All confirmed", count: violations.length },
              { label: "Needs action", count: pendingCount },
              { label: "Recorded", count: recordedCount },
              { label: "Closed", count: violations.filter((item) => item.status === "Closed for review").length },
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(tab.label)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 pt-1 text-[12px] font-extrabold transition ${
                  activeTab === tab.label ? "border-[#1768c5] text-[#1768c5]" : "border-transparent text-[#8296ad] hover:text-[#385674]"
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${activeTab === tab.label ? "bg-[#e8f2ff] text-[#1768c5]" : "bg-[#eef2f6] text-[#8296ad]"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[20px] border border-[#d8e4f1] bg-white shadow-[0_12px_28px_rgba(33,66,106,0.04)] md:block">
            <div className="grid grid-cols-[1.05fr_1.45fr_1fr_1.15fr_1fr_1.1fr_38px] gap-4 border-b border-[#e2e9f1] bg-[#f8fafd] px-5 py-3 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8ca0b6]">
              <span>Violation ID</span>
              <span>Driver</span>
              <span>Related report</span>
              <span>Violation type</span>
              <span>Date</span>
              <span>Status</span>
              <span />
            </div>
            {filteredViolations.length ? filteredViolations.map((item) => (
              <div key={item.id} className="grid grid-cols-[1.05fr_1.45fr_1fr_1.15fr_1fr_1.1fr_38px] items-center gap-4 border-b border-[#edf1f5] px-5 py-4 last:border-b-0">
                <button type="button" onClick={() => setSelectedViolation(item)} className="text-left text-[12px] font-black text-[#226bc2] hover:underline">
                  {item.id}
                </button>
                <div className="flex min-w-0 items-center gap-2.5">
                  <InitialsAvatar initials={item.driverInitials} />
                  <span className="truncate text-[12px] font-bold text-[#294661]">{item.driver}</span>
                </div>
                <span className="text-[12px] font-bold text-[#607792]">{item.relatedReport}</span>
                <span className="text-[12px] font-semibold text-[#607792]">{item.type}</span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#71859e]"><CalendarDays size={13} />{item.date}</span>
                <StatusBadge status={item.status} />
                <button type="button" onClick={() => setSelectedViolation(item)} className="rounded-lg p-2 text-[#8195ac] hover:bg-[#edf5ff] hover:text-[#216bc3]" aria-label={`Open ${item.id}`}>
                  <Eye size={16} />
                </button>
              </div>
            )) : (
              <div className="px-6 py-14 text-center">
                <Filter size={24} className="mx-auto text-[#9bb0c6]" />
                <p className="mt-3 text-[13px] font-extrabold text-[#34516e]">No records match these filters</p>
                <p className="mt-1 text-[12px] text-[#8296ad]">Try a different status, type, or search term.</p>
              </div>
            )}
          </div>

          <div className="space-y-3 md:hidden">
            {filteredViolations.length ? filteredViolations.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedViolation(item)} className="w-full rounded-[18px] border border-[#d8e4f1] bg-white p-4 text-left shadow-[0_8px_20px_rgba(33,66,106,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <InitialsAvatar initials={item.driverInitials} />
                    <div>
                      <p className="text-[12px] font-black text-[#294661]">{item.driver}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-[#226bc2]">{item.id}</p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#edf1f5] pt-3">
                  <div><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#9aacbd]">Type</p><p className="mt-1 text-[11px] font-bold text-[#607792]">{item.type}</p></div>
                  <div><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#9aacbd]">Related report</p><p className="mt-1 text-[11px] font-bold text-[#607792]">{item.relatedReport}</p></div>
                </div>
              </button>
            )) : (
              <div className="rounded-[18px] border border-[#d8e4f1] bg-white px-5 py-12 text-center">
                <Filter size={24} className="mx-auto text-[#9bb0c6]" />
                <p className="mt-3 text-[13px] font-extrabold text-[#34516e]">No records match these filters</p>
              </div>
            )}
          </div>
        </section>

        {actionNotice ? (
          <div className="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-[#c5e8d8] bg-[#effaf4] px-4 py-3 text-[12px] font-bold text-[#277957] shadow-[0_12px_28px_rgba(31,82,58,0.15)] lg:bottom-6">
            <Check size={15} />
            {actionNotice}
            <button type="button" onClick={() => setActionNotice("")} className="ml-2 rounded p-0.5 hover:bg-[#d8f1e5]" aria-label="Dismiss notice"><X size={14} /></button>
          </div>
        ) : null}

        {selectedViolation ? (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#183354]/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onClick={() => setSelectedViolation(null)}>
            <aside role="dialog" aria-modal="true" aria-label={`Details for ${selectedViolation.id}`} onClick={(event) => event.stopPropagation()} className="max-h-[92dvh] w-full max-w-[560px] overflow-y-auto rounded-t-[26px] border border-[#d8e4f1] bg-white p-6 shadow-[0_22px_60px_rgba(22,48,84,0.2)] sm:rounded-[26px] lg:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#286bc2]"><ShieldCheck size={15} /> Confirmed violation</div>
                  <h3 className="mt-2 text-[25px] font-black tracking-[-0.04em] text-[#12305a]">{selectedViolation.id}</h3>
                </div>
                <button type="button" onClick={() => setSelectedViolation(null)} className="rounded-xl p-2 text-[#7890aa] hover:bg-[#f1f5f9]" aria-label="Close record details"><X size={19} /></button>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#f7faff] p-4">
                <div className="flex items-center gap-3"><InitialsAvatar initials={selectedViolation.driverInitials} /><div><p className="text-[13px] font-extrabold text-[#294661]">{selectedViolation.driver}</p><p className="mt-0.5 text-[11px] text-[#7890aa]">Driver record</p></div></div>
                <StatusBadge status={selectedViolation.status} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5">
                <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9aacbd]">Related report</p><p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[#226bc2]"><FileText size={14} />{selectedViolation.relatedReport}</p></div>
                <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9aacbd]">Date confirmed</p><p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[#4c6580]"><CalendarDays size={14} />{selectedViolation.date}</p></div>
                <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9aacbd]">Violation type</p><p className="mt-1.5 text-[12px] font-bold text-[#4c6580]">{selectedViolation.type}</p></div>
                <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9aacbd]">Authorized action</p><p className="mt-1.5 text-[12px] font-bold text-[#4c6580]">{selectedViolation.action}</p></div>
              </div>
              <div className="mt-6 rounded-2xl border border-[#e0e9f3] bg-[#fbfdff] p-4">
                <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#34516e]"><Info size={14} className="text-[#397bc8]" />Record context</div>
                <p className="mt-2 text-[12px] leading-5 text-[#6d8199]">{selectedViolation.summary}</p>
                <p className="mt-3 border-t border-[#e8eef4] pt-3 text-[11px] leading-5 text-[#8497aa]"><span className="font-extrabold text-[#647b93]">Review basis:</span> {selectedViolation.evidence}</p>
              </div>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                {selectedViolation.status === "Action pending" ? (
                  <button type="button" onClick={() => recordAction(selectedViolation.id)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1768c5] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_8px_16px_rgba(23,104,197,0.2)] transition hover:bg-[#1258aa]"><CheckCircle2 size={15} />Record authorized action</button>
                ) : null}
                {selectedViolation.status !== "Closed for review" ? (
                  <button type="button" onClick={() => closeForReview(selectedViolation.id)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#d8e4f1] px-4 py-3 text-[12px] font-extrabold text-[#4d6781] transition hover:bg-[#f6f9fc]"><ArrowUpRight size={15} />Close for review</button>
                ) : null}
              </div>
              <p className="mt-4 flex items-start gap-2 text-[10px] leading-4 text-[#8a9caf]"><UserRound size={13} className="mt-0.5 shrink-0" />Actions shown here are local prototype interactions and do not change a live record.</p>
            </aside>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}

export default Violations;
import { useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CalendarDays,
  CarFront,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  Info,
  MapPin,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";

type DriverStatus = "Active" | "Review hold" | "On leave";

type Driver = {
  id: string;
  name: string;
  initials: string;
  vehicleId: string;
  plate: string;
  status: DriverStatus;
  association: string;
  route: string;
  phone: string;
  registered: string;
  lastReviewed: string;
  reports: number;
  confirmedViolations: number;
  reportsHistory: Array<{
    id: string;
    date: string;
    category: string;
    summary: string;
    status: "Received" | "Under review" | "Resolved";
  }>;
  violations: Array<{
    reference: string;
    date: string;
    finding: string;
    action: string;
  }>;
  activity: Array<{
    title: string;
    detail: string;
    date: string;
    tone: "blue" | "amber" | "green" | "slate";
  }>;
};

const drivers: Driver[] = [
  {
    id: "DRV-OS-0187",
    name: "Ramon L. Dela Cruz",
    initials: "RD",
    vehicleId: "TODA-OS-118",
    plate: "SAG 4821",
    status: "Active",
    association: "Old Sagay TODA",
    route: "Public Market ↔ Sagay Centro",
    phone: "+63 917 248 1096",
    registered: "11 January 2023",
    lastReviewed: "No prior review in the last 12 months",
    reports: 3,
    confirmedViolations: 0,
    reportsHistory: [
      {
        id: "TRC-2026-00124",
        date: "18 Feb 2026",
        category: "Passenger safety",
        summary: "Passenger capacity was observed near the Old Sagay Public Market.",
        status: "Under review",
      },
      {
        id: "TRC-2025-00318",
        date: "09 Dec 2025",
        category: "Fare concern",
        summary: "Student passenger requested a review of the fare collected on a market trip.",
        status: "Resolved",
      },
      {
        id: "TRC-2025-00271",
        date: "22 Oct 2025",
        category: "Driver conduct",
        summary: "Report described a brief disagreement about the destination of a trip.",
        status: "Resolved",
      },
    ],
    violations: [],
    activity: [
      { title: "Report TRC-2026-00124 received", detail: "Student reporting channel · Passenger safety", date: "18 Feb 2026 · 9:42 AM", tone: "blue" },
      { title: "Driver profile viewed", detail: "Alex R. Mendez · Authorized review staff", date: "18 Feb 2026 · 10:06 AM", tone: "slate" },
      { title: "Previous report resolved", detail: "TRC-2025-00318 · Follow-up recorded", date: "13 Dec 2025 · 3:18 PM", tone: "green" },
    ],
  },
  {
    id: "DRV-OS-0112",
    name: "Lorna Mae Villanueva",
    initials: "LV",
    vehicleId: "TODA-OS-074",
    plate: "SAG 3190",
    status: "Active",
    association: "Old Sagay TODA",
    route: "SUNN Gate 2 ↔ Old Sagay Terminal",
    phone: "+63 905 624 7820",
    registered: "04 June 2021",
    lastReviewed: "Reviewed 08 February 2026",
    reports: 6,
    confirmedViolations: 1,
    reportsHistory: [
      {
        id: "TRC-2026-00117",
        date: "09 Feb 2026",
        category: "Driver conduct",
        summary: "Passenger requested review after a trip was declined at the campus gate.",
        status: "Under review",
      },
      {
        id: "TRC-2025-00209",
        date: "18 Aug 2025",
        category: "Fare concern",
        summary: "Fare amount was reported as different from the posted student rate.",
        status: "Resolved",
      },
      {
        id: "TRC-2025-00142",
        date: "06 May 2025",
        category: "Route concern",
        summary: "Passenger asked the office to clarify a route change near Sagay Centro.",
        status: "Resolved",
      },
    ],
    violations: [
      {
        reference: "FND-2025-0018",
        date: "27 Aug 2025",
        finding: "Fare collection did not follow the approved student rate.",
        action: "Written reminder recorded",
      },
    ],
    activity: [
      { title: "Report TRC-2026-00117 moved to review", detail: "Review queue · Driver conduct", date: "09 Feb 2026 · 4:40 PM", tone: "amber" },
      { title: "Finding FND-2025-0018 confirmed", detail: "Authorized review panel · Separate finding record", date: "27 Aug 2025 · 2:15 PM", tone: "green" },
      { title: "Driver registration renewed", detail: "Old Sagay TODA desk", date: "04 Jan 2026 · 11:20 AM", tone: "slate" },
    ],
  },
  {
    id: "DRV-SN-0044",
    name: "Joel P. Manalo",
    initials: "JM",
    vehicleId: "TODA-SN-044",
    plate: "SAG 7642",
    status: "Review hold",
    association: "Sagay North TODA",
    route: "SUNN Main Gate ↔ Sagay City Plaza",
    phone: "+63 918 410 5631",
    registered: "19 September 2022",
    lastReviewed: "Review activity recorded 19 February 2026",
    reports: 4,
    confirmedViolations: 0,
    reportsHistory: [
      {
        id: "TRC-2026-00119",
        date: "10 Feb 2026",
        category: "Route concern",
        summary: "A route deviation was reported during an evening trip from SUNN.",
        status: "Under review",
      },
      {
        id: "TRC-2025-00304",
        date: "23 Nov 2025",
        category: "Vehicle condition",
        summary: "Passenger noted a loose side panel while waiting at the campus gate.",
        status: "Resolved",
      },
      {
        id: "TRC-2025-00190",
        date: "12 Jul 2025",
        category: "Fare concern",
        summary: "A passenger asked for clarification about an evening fare.",
        status: "Resolved",
      },
    ],
    violations: [],
    activity: [
      { title: "Profile placed on review hold", detail: "Linked to an active report review", date: "19 Feb 2026 · 8:20 AM", tone: "amber" },
      { title: "Report TRC-2026-00119 updated", detail: "Additional route details requested", date: "18 Feb 2026 · 1:05 PM", tone: "blue" },
      { title: "Vehicle record checked", detail: "TODA registry · No change recorded", date: "03 Jan 2026 · 9:10 AM", tone: "slate" },
    ],
  },
  {
    id: "DRV-OS-0092",
    name: "Nestor A. Salazar",
    initials: "NS",
    vehicleId: "TODA-OS-092",
    plate: "SAG 1908",
    status: "On leave",
    association: "Old Sagay TODA",
    route: "Old Sagay Terminal ↔ Barangay 3",
    phone: "+63 926 801 4472",
    registered: "15 March 2020",
    lastReviewed: "Reviewed 14 January 2026",
    reports: 2,
    confirmedViolations: 0,
    reportsHistory: [
      {
        id: "TRC-2025-00362",
        date: "20 Dec 2025",
        category: "Vehicle condition",
        summary: "A missing identification card was reported during a terminal visit.",
        status: "Resolved",
      },
      {
        id: "TRC-2025-00102",
        date: "16 Apr 2025",
        category: "Route concern",
        summary: "Passenger asked about a stop that was skipped on a short trip.",
        status: "Resolved",
      },
    ],
    violations: [],
    activity: [
      { title: "Leave status recorded", detail: "Old Sagay TODA desk · Local registry update", date: "02 Feb 2026 · 10:10 AM", tone: "slate" },
      { title: "Report TRC-2025-00362 resolved", detail: "Vehicle identification detail confirmed", date: "28 Dec 2025 · 4:25 PM", tone: "green" },
      { title: "Profile reviewed", detail: "Alex R. Mendez · Authorized review staff", date: "14 Jan 2026 · 9:30 AM", tone: "blue" },
    ],
  },
  {
    id: "DRV-SN-0026",
    name: "Maribel S. Yulo",
    initials: "MY",
    vehicleId: "TODA-SN-026",
    plate: "SAG 5526",
    status: "Active",
    association: "Sagay North TODA",
    route: "Sagay City Plaza ↔ Public Market",
    phone: "+63 919 335 1027",
    registered: "08 August 2023",
    lastReviewed: "No prior review in the last 12 months",
    reports: 1,
    confirmedViolations: 0,
    reportsHistory: [
      {
        id: "TRC-2025-00341",
        date: "14 Dec 2025",
        category: "Fare concern",
        summary: "Student passenger asked the office to review an unclear fare collection.",
        status: "Resolved",
      },
    ],
    violations: [],
    activity: [
      { title: "Report TRC-2025-00341 resolved", detail: "Fare record clarified with route operator", date: "19 Dec 2025 · 2:30 PM", tone: "green" },
      { title: "Profile registered", detail: "Sagay North TODA · Driver registry", date: "08 Aug 2023 · 9:00 AM", tone: "slate" },
    ],
  },
];

const statusOptions: Array<"All statuses" | DriverStatus> = ["All statuses", "Active", "Review hold", "On leave"];

const statusStyles: Record<DriverStatus, { badge: string; dot: string; icon: LucideIcon }> = {
  Active: { badge: "border-[#c8e7d7] bg-[#effaf4] text-[#287b55]", dot: "bg-[#2d9b6a]", icon: BadgeCheck },
  "Review hold": { badge: "border-[#f1d8b1] bg-[#fff8ea] text-[#986117]", dot: "bg-[#d5912f]", icon: CircleAlert },
  "On leave": { badge: "border-[#d9e1e9] bg-[#f4f7fa] text-[#65788d]", dot: "bg-[#8a9bad]", icon: Clock3 },
};

const toneStyles = {
  blue: { dot: "bg-[#2877bb]", icon: "bg-[#eaf3ff] text-[#2877bb]" },
  amber: { dot: "bg-[#d18b2d]", icon: "bg-[#fff4df] text-[#b2751f]" },
  green: { dot: "bg-[#32936d]", icon: "bg-[#eaf8f1] text-[#2f805f]" },
  slate: { dot: "bg-[#8a9cac]", icon: "bg-[#f0f4f7] text-[#72879b]" },
};

function StatusBadge({ status }: { status: DriverStatus }) {
  const meta = statusStyles[status];
  const Icon = meta.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${meta.badge}`}>
      <Icon size={12} strokeWidth={2.2} />
      {status}
    </span>
  );
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`rounded-[22px] border border-[#dbe5f0] bg-white shadow-[0_8px_26px_rgba(32,67,102,0.045)] ${className}`}>{children}</section>;
}

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
  detail,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#1768af]">
        <Icon size={17} strokeWidth={2} />
      </span>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8ca0b6]">{eyebrow}</p>
        <h2 className="mt-1 text-[15px] font-extrabold tracking-[-0.02em] text-[#183657]">{title}</h2>
        {detail ? <p className="mt-1 text-[11px] leading-5 text-[#8798aa]">{detail}</p> : null}
      </div>
    </div>
  );
}

function EmptyReports({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d9e4ed] bg-[#fafcfe] px-4 py-7 text-center">
      <FileText size={19} className="mx-auto text-[#9eb0c0]" strokeWidth={1.7} />
      <p className="mt-2 text-[11px] font-bold text-[#607991]">{message}</p>
      <p className="mt-1 text-[10px] text-[#96a6b5]">No finding is implied by an empty record.</p>
    </div>
  );
}

export function DriverDirectory() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All statuses" | DriverStatus>("All statuses");
  const [selectedId, setSelectedId] = useState(drivers[0].id);
  const [notice, setNotice] = useState("");
  const [showAllReports, setShowAllReports] = useState(false);

  const filteredDrivers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return drivers.filter((driver) => {
      const searchable = `${driver.name} ${driver.id} ${driver.vehicleId} ${driver.plate} ${driver.association} ${driver.route}`.toLowerCase();
      const matchesSearch = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesStatus = status === "All statuses" || driver.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [query, status]);

  const selectedDriver = drivers.find((driver) => driver.id === selectedId) ?? filteredDrivers[0] ?? null;
  const activeFilterCount = Number(status !== "All statuses") + Number(Boolean(query.trim()));
  const visibleReports = showAllReports ? selectedDriver?.reportsHistory ?? [] : selectedDriver?.reportsHistory.slice(0, 2) ?? [];

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const clearFilters = () => {
    setQuery("");
    setStatus("All statuses");
  };

  return (
    <AppLayout officer active="Drivers" title="TODA driver directory" eyebrow="Review center · Old Sagay / SUNN">
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bdded1] bg-[#eef9f3] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#287657]">
                <ShieldCheck size={12} strokeWidth={2.2} />
                Authorized directory
              </span>
              <span className="text-[11px] font-semibold text-[#8396ab]">Review center / Drivers</span>
            </div>
            <h2 className="max-w-[760px] text-[29px] font-extrabold leading-[1.05] tracking-[-0.045em] text-[#173554] sm:text-[37px]">
              Know the record before reviewing the report.
            </h2>
            <p className="mt-3 max-w-[700px] text-[13px] leading-6 text-[#71859e]">
              Browse fictional TODA registry profiles connected to student and community reports in Barangay Old Sagay. Report counts and confirmed findings are shown as separate records.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-[#dbe5f0] bg-white px-3.5 py-3 shadow-[0_5px_18px_rgba(33,68,101,0.04)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#1768af]">
              <UsersRound size={16} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8ca0b6]">Registered drivers</p>
              <p className="mt-0.5 font-mono text-[17px] font-bold tracking-[-0.04em] text-[#23405f]">{drivers.length}</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-[20px] border border-[#dbe5f0] bg-white p-3.5 shadow-[0_5px_20px_rgba(35,64,95,0.04)] lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search drivers</span>
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a4b8]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by driver, vehicle ID, plate, or route"
              className="h-11 w-full rounded-xl border border-[#dbe5f0] bg-[#fbfdff] pl-10 pr-3 text-[12px] font-medium text-[#294461] outline-none transition placeholder:text-[#9aabbe] focus:border-[#77a9e8] focus:ring-4 focus:ring-[#eaf2ff]"
            />
          </label>
          <div className="hidden h-8 w-px bg-[#e4ebf3] lg:block" />
          <span className="hidden items-center gap-1.5 px-1 text-[11px] font-bold text-[#7890aa] sm:flex">
            <SlidersHorizontal size={14} />
            Filter
            {activeFilterCount > 0 ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#eaf2ff] px-1 text-[10px] text-[#0c5bce]">{activeFilterCount}</span> : null}
          </span>
          <label className="relative min-w-0 sm:w-[165px]">
            <span className="sr-only">Filter by status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "All statuses" | DriverStatus)}
              className="h-11 w-full appearance-none rounded-xl border border-[#dbe5f0] bg-[#fbfdff] px-3.5 pr-9 text-[12px] font-semibold text-[#38516d] outline-none transition focus:border-[#77a9e8] focus:ring-4 focus:ring-[#eaf2ff]"
            >
              {statusOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba0b7]" />
          </label>
          {activeFilterCount > 0 ? (
            <button type="button" onClick={clearFilters} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-extrabold text-[#0c5bce] transition hover:bg-[#eaf2ff]">
              <X size={14} />
              Clear
            </button>
          ) : null}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-[#8295aa]">
            Showing <span className="font-extrabold text-[#46617d]">{filteredDrivers.length}</span> of {drivers.length} driver records
          </p>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#91a2b2]">
            <ShieldCheck size={13} className="text-[#2d9369]" />
            Fictional sample data · no live registry connection
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(390px,0.82fr)]">
          <Card className="min-w-0 overflow-hidden">
            <div className="border-b border-[#e4ebf3] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionTitle icon={UsersRound} eyebrow="Registry view" title="Drivers and vehicles" detail="Select a driver to review the linked records." />
                </div>
                <span className="rounded-full bg-[#f1f5f8] px-2.5 py-1 font-mono text-[10px] font-bold text-[#778da3]">{filteredDrivers.length} shown</span>
              </div>
            </div>
            <div className="hidden grid-cols-[1.5fr_0.95fr_0.8fr_0.62fr_0.62fr] gap-3 border-b border-[#edf1f5] px-5 py-3 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#9aaaba] lg:grid">
              <span>Driver</span>
              <span>Vehicle</span>
              <span>Status</span>
              <span>Reports</span>
              <span>Confirmed</span>
            </div>
            <div className="divide-y divide-[#edf1f5]">
              {filteredDrivers.length ? (
                filteredDrivers.map((driver) => (
                  <button
                    key={driver.id}
                    type="button"
                    onClick={() => setSelectedId(driver.id)}
                    className={`grid w-full gap-3 px-5 py-4 text-left transition hover:bg-[#f8fbfd] lg:grid-cols-[1.5fr_0.95fr_0.8fr_0.62fr_0.62fr] lg:items-center ${selectedDriver?.id === driver.id ? "bg-[#f3f8fc]" : "bg-white"}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold ${selectedDriver?.id === driver.id ? "bg-[#dcecff] text-[#0c5bce]" : "bg-[#eef3f7] text-[#627a92]"}`}>{driver.initials}</span>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-extrabold text-[#294765]">{driver.name}</p>
                        <p className="mt-1 truncate font-mono text-[10px] font-semibold text-[#91a2b2]">{driver.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0afbf] lg:hidden">Vehicle</p>
                        <p className="text-[11px] font-extrabold text-[#46627c]">{driver.vehicleId}</p>
                        <p className="mt-1 font-mono text-[10px] font-semibold text-[#8a9cae]">{driver.plate}</p>
                      </div>
                      <ChevronRight size={15} className="text-[#b4c1cc] lg:hidden" />
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0afbf] lg:hidden">Status</p>
                      <StatusBadge status={driver.status} />
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0afbf] lg:hidden">Reports</p>
                      <p className="font-mono text-[16px] font-bold tracking-[-0.05em] text-[#335873]">{driver.reports}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0afbf] lg:hidden">Confirmed violations</p>
                      <p className={`font-mono text-[16px] font-bold tracking-[-0.05em] ${driver.confirmedViolations ? "text-[#8b5a29]" : "text-[#6b8296]"}`}>{driver.confirmedViolations}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-5 py-14 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f4f7] text-[#8297a9]"><Search size={19} /></div>
                  <p className="mt-3 text-[12px] font-extrabold text-[#4a667e]">No driver records match</p>
                  <p className="mt-1 text-[11px] text-[#8c9eaf]">Try another name, vehicle ID, plate, or status.</p>
                  <button type="button" onClick={clearFilters} className="mt-4 rounded-xl bg-[#eaf2ff] px-3.5 py-2 text-[11px] font-extrabold text-[#0c5bce] hover:bg-[#deebff]">Clear filters</button>
                </div>
              )}
            </div>
            <div className="border-t border-[#edf1f5] px-5 py-3.5">
              <p className="text-[10px] leading-4 text-[#98a7b5]">Counts represent records in this fictional review workspace. A report is not a confirmed violation.</p>
            </div>
          </Card>

          {selectedDriver ? (
            <Card className="min-w-0 overflow-hidden">
              <div className="border-b border-[#e4ebf3] bg-[#fbfdff] px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8ca0b6]">Selected driver</p>
                    <p className="mt-1 font-mono text-[11px] font-bold text-[#7890a8]">{selectedDriver.id}</p>
                  </div>
                  <StatusBadge status={selectedDriver.status} />
                </div>
                <div className="mt-5 flex items-start gap-3.5">
                  <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[19px] bg-[#dcecff] text-[17px] font-extrabold tracking-[-0.04em] text-[#0c5bce]">{selectedDriver.initials}</div>
                  <div className="min-w-0">
                    <h2 className="truncate text-[19px] font-extrabold tracking-[-0.03em] text-[#193957]">{selectedDriver.name}</h2>
                    <p className="mt-1 text-[11px] font-semibold text-[#8194a8]">{selectedDriver.association}</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#59738d]"><Phone size={13} className="text-[#2473af]" />{selectedDriver.phone}</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-[#f4f8fb] p-3">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#91a2b2]">Vehicle ID</p>
                    <p className="mt-1.5 text-[11px] font-extrabold text-[#345570]">{selectedDriver.vehicleId}</p>
                  </div>
                  <div className="rounded-xl bg-[#f4f8fb] p-3">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#91a2b2]">Plate</p>
                    <p className="mt-1.5 font-mono text-[11px] font-extrabold text-[#345570]">{selectedDriver.plate}</p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-[#f4f8fb] p-3">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#91a2b2]">Assigned route</p>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#345570]"><MapPin size={13} className="text-[#2473af]" />{selectedDriver.route}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-y border-[#e8eef4] py-4">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#91a2b2]">Reports</p>
                    <p className="mt-1 font-mono text-[21px] font-bold tracking-[-0.06em] text-[#315873]">{selectedDriver.reports}</p>
                    <p className="text-[10px] font-semibold text-[#8c9dac]">linked records</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#91a2b2]">Confirmed violations</p>
                    <p className={`mt-1 font-mono text-[21px] font-bold tracking-[-0.06em] ${selectedDriver.confirmedViolations ? "text-[#8b5a29]" : "text-[#6b8296]"}`}>{selectedDriver.confirmedViolations}</p>
                    <p className="text-[10px] font-semibold text-[#8c9dac]">separate findings</p>
                  </div>
                </div>
                <div className="space-y-2.5 pt-4">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-[#8194a7]"><CalendarDays size={13} className="text-[#728ba3]" /> Registered {selectedDriver.registered}</div>
                  <div className="flex items-start gap-2 text-[10px] font-semibold leading-4 text-[#8194a7]"><ShieldCheck size={13} className="mt-0.5 text-[#2d9369]" /> {selectedDriver.lastReviewed}</div>
                </div>
                <button type="button" onClick={() => announce(`${selectedDriver.name}'s local profile view is already open`)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#edf5fb] px-3 py-2.5 text-[11px] font-extrabold text-[#286a96] transition hover:bg-[#e1eff8]">
                  <UserRound size={14} />
                  Profile details open
                </button>
              </div>
            </Card>
          ) : (
            <Card className="flex min-h-[370px] items-center justify-center p-6 text-center">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4f8] text-[#8399ac]"><UsersRound size={21} /></div>
                <p className="mt-3 text-[13px] font-extrabold text-[#4a667e]">Select a driver record</p>
                <p className="mt-1 max-w-[250px] text-[11px] leading-5 text-[#8c9eaf]">Choose a row from the directory to review profile details and associated records.</p>
              </div>
            </Card>
          )}
        </div>

        {selectedDriver ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
            <Card className="min-w-0 p-5 lg:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <SectionTitle icon={FileText} eyebrow="Complaint history · reports" title="Report history" detail="Submitted reports are listed here for context, separate from findings." />
                {selectedDriver.reportsHistory.length > 2 ? (
                  <button type="button" onClick={() => setShowAllReports((current) => !current)} className="inline-flex shrink-0 items-center gap-1 text-[11px] font-extrabold text-[#286e9d] hover:text-[#1d5278]">
                    {showAllReports ? "Show less" : `View all ${selectedDriver.reports}`}
                    <ChevronRight size={14} />
                  </button>
                ) : null}
              </div>
              <div className="mt-6 space-y-3">
                {visibleReports.length ? visibleReports.map((report) => (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => announce(`${report.id} context opened in this local preview`)}
                    className="group w-full rounded-2xl border border-[#e2eaf1] bg-[#fbfdff] p-4 text-left transition hover:border-[#bcd5e9] hover:bg-[#f5faff]"
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-extrabold text-[#2c607f]">{report.id}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${report.status === "Under review" ? "bg-[#fff4df] text-[#a66a1c]" : report.status === "Resolved" ? "bg-[#edf8f2] text-[#2c805c]" : "bg-[#f0f4f7] text-[#6d8296]"}`}>{report.status}</span>
                        </div>
                        <p className="mt-2 text-[12px] font-extrabold text-[#385a74]">{report.category}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-[#91a2b2]">{report.date}</span>
                    </div>
                    <p className="mt-2 max-w-[640px] text-[11px] leading-5 text-[#71859e]">{report.summary}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-extrabold text-[#2b73a1] opacity-80 transition group-hover:opacity-100">View report context <ChevronRight size={12} /></span>
                  </button>
                )) : <EmptyReports message="No reports are linked to this profile" />}
              </div>
            </Card>

            <Card className="min-w-0 p-5 lg:p-6">
              <SectionTitle icon={ShieldAlert} eyebrow="Separate record type" title="Confirmed violations" detail="Only findings completed through authorized review appear in this section." />
              <div className="mt-6">
                {selectedDriver.violations.length ? (
                  <div className="space-y-3">
                    {selectedDriver.violations.map((violation) => (
                      <button key={violation.reference} type="button" onClick={() => announce(`${violation.reference} finding details opened in this local preview`)} className="w-full rounded-2xl border border-[#eadbc5] bg-[#fffaf1] p-4 text-left transition hover:border-[#dfc79f] hover:bg-[#fff7e7]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-[11px] font-extrabold text-[#89602e]">{violation.reference}</p>
                            <p className="mt-2 text-[12px] font-extrabold leading-5 text-[#6f512d]">{violation.finding}</p>
                          </div>
                          <ChevronRight size={15} className="mt-1 shrink-0 text-[#bd9864]" />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#efdfc9] pt-3 text-[10px] font-semibold text-[#9a7b53]">
                          <span>{violation.date}</span>
                          <span>{violation.action}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#e6ddcf] bg-[#fffaf3] px-4 py-7 text-center">
                    <ShieldAlert size={20} className="mx-auto text-[#b99b6f]" strokeWidth={1.7} />
                    <p className="mt-2 text-[11px] font-extrabold text-[#805f35]">No confirmed violations recorded</p>
                    <p className="mt-1 text-[10px] leading-4 text-[#a18766]">This empty section does not change the status of any report.</p>
                  </div>
                )}
              </div>
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#e9dfcf] bg-[#fffaf3] px-3.5 py-3 text-[10px] leading-4 text-[#907657]">
                <Info size={14} className="mt-0.5 shrink-0 text-[#b18a55]" />
                A submitted report or complaint is not a confirmed violation. These record types are intentionally kept apart.
              </div>
            </Card>
          </div>
        ) : null}

        {selectedDriver ? (
          <Card className="p-5 lg:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <SectionTitle icon={Clock3} eyebrow="Recent record activity" title="Short activity timeline" detail={`Latest local updates connected to ${selectedDriver.name}.`} />
              <button type="button" onClick={() => announce("Full activity history is represented by this short prototype timeline")} className="inline-flex shrink-0 items-center gap-1 text-[11px] font-extrabold text-[#286e9d] hover:text-[#1d5278]">View activity note <ChevronRight size={14} /></button>
            </div>
            <div className="relative mt-7 grid gap-6 md:grid-cols-3 md:gap-5">
              <div className="absolute left-[14px] right-[14px] top-3 hidden h-px bg-[#dce7ef] md:block" />
              {selectedDriver.activity.map((item, index) => {
                const tone = toneStyles[item.tone];
                return (
                  <div key={`${item.title}-${index}`} className="relative flex gap-3 md:block">
                    <div className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-4 border-white ${tone.icon}`}>
                      {index === 0 ? <CircleAlert size={11} /> : <span className={`h-2 w-2 rounded-full ${tone.dot}`} />}
                    </div>
                    <div className="min-w-0 md:mt-3">
                      <p className="text-[11px] font-extrabold leading-4 text-[#45627a]">{item.title}</p>
                      <p className="mt-1 text-[10px] leading-4 text-[#8295a8]">{item.detail}</p>
                      <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.08em] text-[#a0afbc]">{item.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : null}

        <footer className="flex flex-col justify-between gap-2 border-t border-[#dbe5ed] pt-4 text-[10px] font-semibold text-[#93a4b3] sm:flex-row">
          <span>Old Sagay · SUNN transport conduct review center</span>
          <span className="inline-flex items-center gap-1.5"><CarFront size={12} /> Registry snapshot · fictional sample</span>
        </footer>
      </div>

      {notice ? (
        <div className="fixed bottom-[84px] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#c8dce7] bg-[#214f6a] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_8px_24px_rgba(29,72,97,0.22)] lg:bottom-7">
          <BadgeCheck size={14} className="text-[#a8d7c0]" />
          {notice}
        </div>
      ) : null}
    </AppLayout>
  );
}
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  Info,
  RefreshCcw,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";

type ReportStatus = "Open" | "In review" | "Resolved";
type ReportCategory = "Unsafe driving" | "Overcharging" | "Route concern" | "Vehicle condition";
type PeriodFilter = "30d" | "90d" | "year";

type MockReport = {
  id: string;
  date: string;
  category: ReportCategory;
  status: ReportStatus;
  driver: string;
  resolutionDays: number | null;
};

const reports: MockReport[] = [
  { id: "R-104", date: "2025-01-08", category: "Route concern", status: "Resolved", driver: "Rogelio M.", resolutionDays: 3 },
  { id: "R-105", date: "2025-01-14", category: "Unsafe driving", status: "Resolved", driver: "Cesar P.", resolutionDays: 5 },
  { id: "R-106", date: "2025-01-21", category: "Vehicle condition", status: "In review", driver: "Rogelio M.", resolutionDays: null },
  { id: "R-107", date: "2025-01-26", category: "Overcharging", status: "Resolved", driver: "Nestor B.", resolutionDays: 4 },
  { id: "R-108", date: "2025-02-03", category: "Unsafe driving", status: "Resolved", driver: "Rogelio M.", resolutionDays: 6 },
  { id: "R-109", date: "2025-02-10", category: "Route concern", status: "Open", driver: "Edgar T.", resolutionDays: null },
  { id: "R-110", date: "2025-02-15", category: "Overcharging", status: "Resolved", driver: "Nestor B.", resolutionDays: 2 },
  { id: "R-111", date: "2025-02-23", category: "Vehicle condition", status: "Resolved", driver: "Cesar P.", resolutionDays: 8 },
  { id: "R-112", date: "2025-03-02", category: "Unsafe driving", status: "In review", driver: "Rogelio M.", resolutionDays: null },
  { id: "R-113", date: "2025-03-06", category: "Route concern", status: "Resolved", driver: "Edgar T.", resolutionDays: 3 },
  { id: "R-114", date: "2025-03-12", category: "Overcharging", status: "Resolved", driver: "Nestor B.", resolutionDays: 4 },
  { id: "R-115", date: "2025-03-20", category: "Vehicle condition", status: "Open", driver: "Cesar P.", resolutionDays: null },
  { id: "R-116", date: "2025-03-27", category: "Unsafe driving", status: "Resolved", driver: "Rogelio M.", resolutionDays: 7 },
  { id: "R-117", date: "2025-04-04", category: "Route concern", status: "Resolved", driver: "Edgar T.", resolutionDays: 2 },
  { id: "R-118", date: "2025-04-09", category: "Overcharging", status: "In review", driver: "Nestor B.", resolutionDays: null },
  { id: "R-119", date: "2025-04-18", category: "Unsafe driving", status: "Resolved", driver: "Rogelio M.", resolutionDays: 5 },
  { id: "R-120", date: "2025-04-26", category: "Vehicle condition", status: "Resolved", driver: "Cesar P.", resolutionDays: 4 },
  { id: "R-121", date: "2025-05-03", category: "Route concern", status: "Open", driver: "Edgar T.", resolutionDays: null },
  { id: "R-122", date: "2025-05-11", category: "Unsafe driving", status: "Resolved", driver: "Rogelio M.", resolutionDays: 6 },
  { id: "R-123", date: "2025-05-15", category: "Overcharging", status: "Resolved", driver: "Nestor B.", resolutionDays: 3 },
  { id: "R-124", date: "2025-05-22", category: "Vehicle condition", status: "In review", driver: "Cesar P.", resolutionDays: null },
  { id: "R-125", date: "2025-06-02", category: "Unsafe driving", status: "Resolved", driver: "Rogelio M.", resolutionDays: 4 },
  { id: "R-126", date: "2025-06-08", category: "Route concern", status: "Resolved", driver: "Edgar T.", resolutionDays: 3 },
  { id: "R-127", date: "2025-06-16", category: "Overcharging", status: "Open", driver: "Nestor B.", resolutionDays: null },
  { id: "R-128", date: "2025-06-22", category: "Vehicle condition", status: "Resolved", driver: "Cesar P.", resolutionDays: 5 },
  { id: "R-129", date: "2025-06-27", category: "Unsafe driving", status: "In review", driver: "Rogelio M.", resolutionDays: null },
];

const months = [
  { key: "01", label: "Jan" },
  { key: "02", label: "Feb" },
  { key: "03", label: "Mar" },
  { key: "04", label: "Apr" },
  { key: "05", label: "May" },
  { key: "06", label: "Jun" },
];

const categoryColors: Record<ReportCategory, string> = {
  "Unsafe driving": "#0c5bce",
  Overcharging: "#e8794f",
  "Route concern": "#56a886",
  "Vehicle condition": "#806bb2",
};

const statusColors: Record<ReportStatus, string> = {
  Resolved: "#56a886",
  "In review": "#e2a84b",
  Open: "#e8794f",
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="group relative block min-w-0">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-[#8ca0b6]">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-xl border border-[#dbe5f0] bg-[#fbfdff] px-3 pr-9 text-[12px] font-bold text-[#294462] outline-none transition focus:border-[#80aee8] focus:ring-4 focus:ring-[#eaf2ff]"
        >
          {children}
        </select>
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-3 text-[#7890aa]" />
      </span>
    </label>
  );
}

function ChartLegend({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#71859e]">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

export function Analytics() {
  const [period, setPeriod] = useState<PeriodFilter>("year");
  const [category, setCategory] = useState<"All" | ReportCategory>("All");
  const [status, setStatus] = useState<"All" | ReportStatus>("All");

  const filteredReports = useMemo(() => {
    const thresholdByPeriod: Record<PeriodFilter, string> = {
      "30d": "2025-06-01",
      "90d": "2025-04-01",
      year: "2025-01-01",
    };
    return reports.filter((report) => {
      const inDateRange = report.date >= thresholdByPeriod[period];
      const matchesCategory = category === "All" || report.category === category;
      const matchesStatus = status === "All" || report.status === status;
      return inDateRange && matchesCategory && matchesStatus;
    });
  }, [category, period, status]);

  const metrics = useMemo(() => {
    const resolved = filteredReports.filter((report) => report.status === "Resolved");
    const responseDays = resolved.filter((report) => report.resolutionDays !== null).map((report) => report.resolutionDays as number);
    return {
      total: filteredReports.length,
      resolved: resolved.length,
      pending: filteredReports.filter((report) => report.status !== "Resolved").length,
      resolutionRate: filteredReports.length ? (resolved.length / filteredReports.length) * 100 : 0,
      averageResponse: responseDays.length ? responseDays.reduce((sum, days) => sum + days, 0) / responseDays.length : 0,
    };
  }, [filteredReports]);

  const monthlyData = useMemo(
    () =>
      months.map((month) => ({
        ...month,
        total: filteredReports.filter((report) => report.date.slice(5, 7) === month.key).length,
      })),
    [filteredReports],
  );

  const categoryData = useMemo(
    () =>
      (Object.keys(categoryColors) as ReportCategory[])
        .map((name) => ({ name, total: filteredReports.filter((report) => report.category === name).length }))
        .sort((a, b) => b.total - a.total),
    [filteredReports],
  );

  const statusData = useMemo(() => {
    const total = filteredReports.length || 1;
    return (Object.keys(statusColors) as ReportStatus[]).map((name) => {
      const count = filteredReports.filter((report) => report.status === name).length;
      return { name, count, percent: (count / total) * 100 };
    });
  }, [filteredReports]);

  const resolutionData = useMemo(
    () =>
      months.map((month) => {
        const monthReports = filteredReports.filter((report) => report.date.slice(5, 7) === month.key);
        const resolved = monthReports.filter((report) => report.status === "Resolved").length;
        return { ...month, resolved, pending: monthReports.length - resolved };
      }),
    [filteredReports],
  );

  const driverData = useMemo(() => {
    const driverMap = new Map<string, number>();
    filteredReports.forEach((report) => driverMap.set(report.driver, (driverMap.get(report.driver) ?? 0) + 1));
    return [...driverMap.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredReports]);

  const resetFilters = () => {
    setPeriod("year");
    setCategory("All");
    setStatus("All");
  };

  const monthlyMax = Math.max(...monthlyData.map((month) => month.total), 1);
  const categoryMax = Math.max(...categoryData.map((item) => item.total), 1);
  const driverMax = Math.max(...driverData.map((item) => item.total), 1);
  const linePoints = resolutionData
    .map((month, index) => `${40 + index * 108},${144 - (month.resolved / Math.max(...resolutionData.map((item) => item.resolved), 1)) * 108}`)
    .join(" ");
  const circumference = 100;
  let donutOffset = 0;

  return (
    <AppLayout officer={true} active="Analytics" title="Analytics" eyebrow="Review center">
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e8794f]">Pattern view</p>
            <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.04em] text-[#163154] lg:text-[34px]">Report activity</h2>
            <p className="mt-1.5 max-w-[610px] text-[13px] leading-5 text-[#71859e]">
              A neutral snapshot of submitted reports and review progress across Barangay Old Sagay.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#dbe5f0] bg-white px-3 py-2 text-[11px] font-semibold text-[#71859e] shadow-[0_4px_15px_rgba(39,72,108,0.04)]">
            <span className="h-2 w-2 rounded-full bg-[#56a886]" />
            Sample data · updated 30 Jun 2025
          </div>
        </section>

        <section className="rounded-2xl border border-[#dbe5f0] bg-white p-4 shadow-[0_8px_25px_rgba(39,72,108,0.045)] sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="flex items-center gap-2 xl:mr-auto">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#0c5bce]">
                <Filter size={17} />
              </div>
              <div>
                <p className="text-[12px] font-extrabold text-[#23405f]">Filter scope</p>
                <p className="text-[11px] text-[#8ca0b6]">Change the view without changing any records.</p>
              </div>
            </div>
            <div className="grid flex-1 gap-3 sm:grid-cols-3 xl:max-w-[720px]">
              <SelectField label="Date range" value={period} onChange={(value) => setPeriod(value as PeriodFilter)}>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="year">This year</option>
              </SelectField>
              <SelectField label="Category" value={category} onChange={(value) => setCategory(value as "All" | ReportCategory)}>
                <option value="All">All categories</option>
                {(Object.keys(categoryColors) as ReportCategory[]).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Status" value={status} onChange={(value) => setStatus(value as "All" | ReportStatus)}>
                <option value="All">All statuses</option>
                {(Object.keys(statusColors) as ReportStatus[]).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SelectField>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dbe5f0] px-3.5 text-[11px] font-bold text-[#71859e] transition hover:border-[#b8cade] hover:bg-[#f7faff] hover:text-[#23405f]"
            >
              <RefreshCcw size={14} />
              Reset
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<FileText size={17} />} label="Reports in view" value={metrics.total.toString()} detail="Submitted reports" accent="#0c5bce" />
          <MetricCard icon={<CheckCircle2 size={17} />} label="Resolved" value={metrics.resolved.toString()} detail={`${formatPercent(metrics.resolutionRate)} of reports`} accent="#56a886" />
          <MetricCard icon={<Clock3 size={17} />} label="Still in review" value={metrics.pending.toString()} detail="Open or under review" accent="#e2a84b" />
          <MetricCard icon={<TrendingUp size={17} />} label="Average response" value={metrics.averageResponse ? `${metrics.averageResponse.toFixed(1)}d` : "—"} detail="Resolved reports only" accent="#806bb2" />
        </section>

        {filteredReports.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-[#b8cade] bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0f7ff] text-[#7890aa]">
              <BarChart3 size={20} />
            </div>
            <h3 className="mt-4 text-[15px] font-extrabold text-[#23405f]">No reports match these filters</h3>
            <p className="mx-auto mt-1.5 max-w-[380px] text-[12px] leading-5 text-[#8ca0b6]">Try widening the date range or clearing a category and status filter.</p>
            <button type="button" onClick={resetFilters} className="mt-5 rounded-xl bg-[#0c5bce] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_6px_16px_rgba(12,91,206,0.2)]">
              Clear filters
            </button>
          </section>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
            <ChartCard
              title="Reports by month"
              subtitle="Volume of reports submitted in each month"
              icon={<CalendarDays size={17} />}
              className="min-h-[330px]"
            >
              <div className="mt-5 overflow-x-auto pb-1">
                <svg viewBox="0 0 700 230" className="min-w-[600px] w-full" role="img" aria-label="Bar chart showing reports by month">
                  <title>Reports by month</title>
                  {[0, 1, 2, 3].map((line) => {
                    const y = 26 + line * 45;
                    return (
                      <g key={line}>
                        <line x1="39" y1={y} x2="679" y2={y} stroke="#e7eef6" strokeWidth="1" />
                        <text x="0" y={y + 4} fill="#9aabbe" fontSize="10" fontWeight="600">
                          {Math.round(monthlyMax - (monthlyMax / 3) * line)}
                        </text>
                      </g>
                    );
                  })}
                  {monthlyData.map((month, index) => {
                    const height = (month.total / monthlyMax) * 135;
                    const x = 58 + index * 104;
                    return (
                      <g key={month.key}>
                        <rect x={x} y={169 - height} width="48" height={height} rx="8" fill="#d9eaff" />
                        <rect x={x} y={169 - height} width="48" height={Math.max(height * 0.72, 4)} rx="8" fill="#0c5bce" />
                        <text x={x + 24} y="193" textAnchor="middle" fill="#71859e" fontSize="11" fontWeight="700">
                          {month.label}
                        </text>
                        <text x={x + 24} y={Math.max(169 - height - 9, 13)} textAnchor="middle" fill="#23405f" fontSize="11" fontWeight="800">
                          {month.total}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="mt-1 flex items-center gap-4">
                <ChartLegend color="#0c5bce">Reports submitted</ChartLegend>
                <ChartLegend color="#d9eaff">Available comparison space</ChartLegend>
              </div>
            </ChartCard>

            <ChartCard title="Report status distribution" subtitle="Current state of reports in view" icon={<CheckCircle2 size={17} />}>
              <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
                <div className="relative h-[170px] w-[170px] shrink-0">
                  <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label="Donut chart showing report status distribution">
                    <title>Report status distribution</title>
                    <circle cx="50" cy="50" r="39" fill="none" stroke="#edf2f7" strokeWidth="13" />
                    {statusData.map((item) => {
                      const offset = donutOffset;
                      donutOffset += item.percent;
                      return (
                        <circle
                          key={item.name}
                          cx="50"
                          cy="50"
                          r="39"
                          fill="none"
                          stroke={statusColors[item.name]}
                          strokeWidth="13"
                          pathLength={circumference}
                          strokeDasharray={`${item.percent} ${100 - item.percent}`}
                          strokeDashoffset={-offset}
                          transform="rotate(-90 50 50)"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[25px] font-extrabold tracking-[-0.05em] text-[#163154]">{metrics.total}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aabbe]">reports</span>
                  </div>
                </div>
                <div className="w-full space-y-3">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3">
                      <ChartLegend color={statusColors[item.name]}>{item.name}</ChartLegend>
                      <span className="text-[12px] font-extrabold text-[#294462]">
                        {item.count} <span className="ml-1 font-semibold text-[#9aabbe]">{formatPercent(item.percent)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Reports by category" subtitle="Topics selected in submitted reports" icon={<BarChart3 size={17} />}>
              <div className="mt-6 space-y-5">
                {categoryData.map((item) => (
                  <div key={item.name}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
                      <span className="font-bold text-[#526a84]">{item.name}</span>
                      <span className="font-extrabold text-[#23405f]">{item.total}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#eef3f8]">
                      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${(item.total / categoryMax) * 100}%`, backgroundColor: categoryColors[item.name] }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-start gap-2 rounded-xl bg-[#f6f9fc] px-3 py-2.5 text-[10px] leading-4 text-[#7890aa]">
                <Info size={14} className="mt-0.5 shrink-0 text-[#8ca0b6]" />
                Categories reflect how a reporter described an experience, not a verified finding.
              </div>
            </ChartCard>

            <ChartCard title="Resolution trends" subtitle="Resolved versus still pending each month" icon={<TrendingUp size={17} />}>
              <div className="mt-5 overflow-x-auto pb-1">
                <svg viewBox="0 0 700 205" className="min-w-[600px] w-full" role="img" aria-label="Line chart showing resolution trends">
                  <title>Resolution trends</title>
                  {[0, 1, 2, 3].map((line) => {
                    const y = 26 + line * 38;
                    return <line key={line} x1="40" y1={y} x2="680" y2={y} stroke="#e7eef6" strokeWidth="1" />;
                  })}
                  <polyline points={linePoints} fill="none" stroke="#56a886" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {resolutionData.map((month, index) => {
                    const x = 40 + index * 108;
                    const maxResolved = Math.max(...resolutionData.map((item) => item.resolved), 1);
                    const y = 144 - (month.resolved / maxResolved) * 108;
                    return (
                      <g key={month.key}>
                        <circle cx={x} cy={y} r="4.5" fill="#fff" stroke="#56a886" strokeWidth="3" />
                        <text x={x} y="182" textAnchor="middle" fill="#71859e" fontSize="11" fontWeight="700">
                          {month.label}
                        </text>
                        <text x={x} y={Math.max(y - 11, 13)} textAnchor="middle" fill="#3f8067" fontSize="10" fontWeight="800">
                          {month.resolved}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="mt-1 flex items-center gap-4">
                <ChartLegend color="#56a886">Resolved reports</ChartLegend>
                <span className="text-[10px] font-medium text-[#9aabbe]">Counts, not case outcomes</span>
              </div>
            </ChartCard>

            <ChartCard
              title="Report frequency by driver"
              subtitle="Number of reports mentioning each driver"
              icon={<UsersRound size={17} />}
              className="xl:col-span-2"
            >
              <div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
                {driverData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-5 text-right text-[11px] font-extrabold text-[#9aabbe]">0{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-[12px] font-bold text-[#526a84]">{item.name}</span>
                        <span className="text-[12px] font-extrabold text-[#23405f]">{item.total}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#eef3f8]">
                        <div className="h-full rounded-full bg-[#806bb2] transition-[width] duration-300" style={{ width: `${(item.total / driverMax) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-start gap-2 rounded-xl border border-[#f0dfcf] bg-[#fffaf5] px-3 py-2.5 text-[10px] leading-4 text-[#946f4d]">
                <Info size={14} className="mt-0.5 shrink-0 text-[#c18b5f]" />
                <span><strong className="font-extrabold">Important:</strong> report frequency is not a finding of guilt. It only shows how often a driver was mentioned in the selected report set.</span>
              </div>
            </ChartCard>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#dbe5f0] bg-white p-5 shadow-[0_8px_25px_rgba(39,72,108,0.04)]">
      <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full opacity-10" style={{ backgroundColor: accent }} />
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}14`, color: accent }}>
          {icon}
        </div>
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.11em] text-[#8ca0b6]">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[28px] font-extrabold tracking-[-0.05em] text-[#163154]">{value}</span>
        <span className="text-[10px] font-semibold text-[#9aabbe]">{detail}</span>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[#dbe5f0] bg-white p-5 shadow-[0_8px_25px_rgba(39,72,108,0.045)] sm:p-6 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0f7ff] text-[#0c5bce]">{icon}</div>
        <div>
          <h3 className="text-[14px] font-extrabold tracking-[-0.02em] text-[#23405f]">{title}</h3>
          <p className="mt-1 text-[11px] leading-4 text-[#8ca0b6]">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

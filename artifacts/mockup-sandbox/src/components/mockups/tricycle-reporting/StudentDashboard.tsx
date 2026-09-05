import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FilePlus2,
  Info,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";
import { getCurrentUser } from "../../../lib/api";
import { AppLayout } from "./_shared/AppLayout";

type ReportStatus = "Under review" | "Resolved" | "Received";

type Report = {
  id: string;
  date: string;
  dateShort: string;
  driver: string;
  category: string;
  location: string;
  status: ReportStatus;
  updated: string;
  summary: string;
};

const reports: Report[] = [
  {
    id: "TR-2408-017",
    date: "August 28, 2024",
    dateShort: "Aug 28",
    driver: "R. Villanueva",
    category: "Unsafe driving",
    location: "Old Sagay terminal",
    status: "Under review",
    updated: "Updated 2 hours ago",
    summary: "A report about a sudden stop and passenger loading outside the marked bay.",
  },
  {
    id: "TR-2408-011",
    date: "August 22, 2024",
    dateShort: "Aug 22",
    driver: "J. Salcedo",
    category: "Fare concern",
    location: "SUNN Gate 2",
    status: "Resolved",
    updated: "Closed August 26",
    summary: "The review team recorded the concern and clarified the posted student fare.",
  },
  {
    id: "TR-2408-004",
    date: "August 14, 2024",
    dateShort: "Aug 14",
    driver: "M. Dela Cruz",
    category: "Route concern",
    location: "Old Sagay public market",
    status: "Received",
    updated: "Received August 14",
    summary: "A route and pickup-point concern shared for the market-side loading area.",
  },
  {
    id: "TR-2407-019",
    date: "July 31, 2024",
    dateShort: "Jul 31",
    driver: "A. Ramos",
    category: "Passenger safety",
    location: "SUNN main road",
    status: "Resolved",
    updated: "Closed August 5",
    summary: "The team reviewed the reported overcrowding concern with the route operator.",
  },
];

const statusStyles: Record<ReportStatus, string> = {
  "Under review": "bg-[#fff4d8] text-[#966516] ring-[#efd28f]",
  Resolved: "bg-[#e3f7ee] text-[#22785c] ring-[#b8e5d0]",
  Received: "bg-[#e8f0ff] text-[#2f64b4] ring-[#c6d8f6]",
};

function StatusPill({ status }: { status: ReportStatus }) {
  const Icon = status === "Resolved" ? CheckCircle2 : status === "Under review" ? Clock3 : CircleAlert;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyles[status]}`}>
      <Icon size={12} strokeWidth={2.2} />
      {status}
    </span>
  );
}

export function StudentDashboard() {
  const currentUser = getCurrentUser();
  const firstName = currentUser?.fullName?.trim().split(/\s+/)[0] || "Student";
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showAllReports, setShowAllReports] = useState(false);
  const [unreadNotification, setUnreadNotification] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const visibleReports = useMemo(() => (showAllReports ? reports : reports.slice(0, 3)), [showAllReports]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3200);
  };

  return (
    <AppLayout active="Dashboard" title={`Good morning, ${firstName}`} eyebrow="Student dashboard">
      <div className="relative">
        <section className="relative overflow-hidden rounded-[28px] bg-[#0d4f86] px-6 py-7 text-white shadow-[0_18px_44px_rgba(20,82,130,0.16)] sm:px-8 lg:px-10 lg:py-9">
          <div className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full border-[32px] border-[#43b9aa]/20" />
          <div className="pointer-events-none absolute bottom-[-90px] right-[22%] h-48 w-48 rounded-full border-[25px] border-[#75d6c4]/10" />
          <div className="relative z-[1] max-w-[680px]">
            <div className="mb-5 flex items-center gap-2 text-[#b8eee2]">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                <ShieldCheck size={17} />
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.16em]">Your civic safety space</span>
            </div>
            <h2 className="max-w-[580px] text-[29px] font-extrabold leading-[1.08] tracking-[-0.04em] sm:text-[38px]">
              Help keep every ride from Old Sagay to SUNN moving safely.
            </h2>
            <p className="mt-4 max-w-[520px] text-[14px] leading-6 text-[#d4e9f5]">
              Share what you experienced and follow the review journey in one place. Your details are handled for authorized review.
            </p>
            <button
              type="button"
              onClick={() => showNotice("Report form preview is ready for your next submission.")}
              className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-2xl bg-[#f3c969] px-5 text-[13px] font-extrabold text-[#163958] shadow-[0_8px_20px_rgba(5,38,68,0.16)] transition hover:-translate-y-0.5 hover:bg-[#f8d781] focus:outline-none focus:ring-4 focus:ring-[#f3c969]/30"
            >
              <FilePlus2 size={18} />
              Submit a new report
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="relative z-[1] mt-8 flex items-center gap-3 border-t border-white/15 pt-4 text-[11px] text-[#cae1ee] sm:absolute sm:bottom-8 sm:right-8 sm:mt-0 sm:border-0 sm:pt-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#49b8a9] text-[#073d57]">
              <Check size={15} strokeWidth={3} />
            </span>
            <span>Reports are reviewed fairly, not automatically judged.</span>
          </div>
        </section>

        <section aria-label="Report overview" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div className="rounded-[22px] border border-[#d9e8ee] bg-[#eaf8f5] p-5 shadow-[0_5px_16px_rgba(38,100,110,0.04)] sm:col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
              <p className="text-[12px] font-bold text-[#477c7f]">Total reports</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c8eee6] text-[#16786f]">
                <FilePlus2 size={16} />
              </span>
            </div>
            <p className="mt-5 text-[32px] font-extrabold tracking-[-0.05em] text-[#164e65]">4</p>
            <p className="mt-1 text-[11px] font-semibold text-[#5e8d8b]">Since your first report</p>
          </div>
          <div className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-[0_5px_16px_rgba(38,74,110,0.04)]">
            <div className="flex items-start justify-between">
              <p className="text-[12px] font-bold text-[#71859e]">Active reports</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff1d3] text-[#a77518]">
                <Clock3 size={16} />
              </span>
            </div>
            <p className="mt-5 text-[32px] font-extrabold tracking-[-0.05em] text-[#193b5c]">2</p>
            <p className="mt-1 text-[11px] font-semibold text-[#8b9bb0]">In the review process</p>
          </div>
          <div className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-[0_5px_16px_rgba(38,74,110,0.04)]">
            <div className="flex items-start justify-between">
              <p className="text-[12px] font-bold text-[#71859e]">Resolved</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e4f5eb] text-[#278464]">
                <CheckCircle2 size={16} />
              </span>
            </div>
            <p className="mt-5 text-[32px] font-extrabold tracking-[-0.05em] text-[#193b5c]">2</p>
            <p className="mt-1 text-[11px] font-semibold text-[#8b9bb0]">With a review update</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setUnreadNotification(false);
              showNotice("Notifications marked as read.");
            }}
            className="rounded-[22px] border border-[#f0d8c6] bg-[#fff8f1] p-5 text-left shadow-[0_5px_16px_rgba(130,83,45,0.04)] transition hover:border-[#e6b993] focus:outline-none focus:ring-4 focus:ring-[#eeb782]/20"
          >
            <div className="flex items-start justify-between">
              <p className="text-[12px] font-bold text-[#927258]">Notifications</p>
              <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#ffe7d4] text-[#bc7048]">
                <Bell size={16} />
                {unreadNotification ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#d65d43]" /> : null}
              </span>
            </div>
            <p className="mt-5 text-[32px] font-extrabold tracking-[-0.05em] text-[#674a3b]">{unreadNotification ? "3" : "0"}</p>
            <p className="mt-1 text-[11px] font-semibold text-[#a28571]">{unreadNotification ? "Tap to mark as read" : "You are all caught up"}</p>
          </button>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.75fr)]">
          <div className="min-w-0 rounded-[24px] border border-[#dbe5f0] bg-white p-5 shadow-[0_5px_18px_rgba(38,74,110,0.04)] sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8096ae]">Your activity</p>
                <h3 className="mt-1.5 text-[21px] font-extrabold tracking-[-0.03em] text-[#173858]">Recent reports</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllReports((current) => !current)}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-[12px] font-extrabold text-[#0c5bce] hover:bg-[#f1f6ff]"
              >
                {showAllReports ? "Show recent" : "View all reports"}
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {visibleReports.map((report) => (
                <button
                  type="button"
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="group grid w-full gap-3 rounded-2xl border border-transparent px-2 py-3.5 text-left transition hover:border-[#d9e6f3] hover:bg-[#f7faff] focus:outline-none focus:ring-4 focus:ring-[#9fc0e9]/25 sm:grid-cols-[minmax(160px,1.1fr)_minmax(120px,0.8fr)_minmax(135px,1fr)_auto] sm:items-center sm:px-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#3973bf] sm:flex">
                      <FilePlus2 size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-extrabold text-[#244667]">{report.id}</p>
                      <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-medium text-[#8aa0b6]">
                        <CalendarDays size={12} />
                        {report.date}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9aabbe]">Driver</p>
                    <p className="mt-1 text-[12px] font-bold text-[#49647f]">{report.driver}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:block">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9aabbe]">Category</p>
                      <p className="mt-1 text-[12px] font-bold text-[#49647f]">{report.category}</p>
                    </div>
                    <span className="sm:hidden"><StatusPill status={report.status} /></span>
                  </div>
                  <div className="hidden justify-self-end sm:block">
                    <StatusPill status={report.status} />
                    <p className="mt-2 text-right text-[10px] font-semibold text-[#9aabbe]">{report.updated}</p>
                  </div>
                  <ChevronRight className="hidden text-[#aec0d1] transition group-hover:translate-x-0.5 group-hover:text-[#4c84c8] sm:block" size={16} />
                  <p className="text-[10px] font-semibold text-[#9aabbe] sm:hidden">{report.updated}</p>
                </button>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[24px] border border-[#d6e7ec] bg-[#eef9f7] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cbeee7] text-[#15776e]">
                  <Info size={17} />
                </span>
                <div>
                  <h3 className="text-[15px] font-extrabold text-[#215b67]">A quick privacy reminder</h3>
                  <p className="mt-2 text-[12px] leading-5 text-[#5d8187]">
                    Your report is shared only with authorized review staff. A submitted report records an experience for review; it does not establish guilt or a confirmed violation.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-[#cfe6e4] pt-4 text-[11px] font-bold text-[#337a7d]">
                <ShieldCheck size={14} />
                Review is handled with care and context
              </div>
            </div>

            <div className="rounded-[24px] border border-[#dbe5f0] bg-white p-5 shadow-[0_5px_18px_rgba(38,74,110,0.04)] sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8096ae]">Where you ride</p>
                  <h3 className="mt-1.5 text-[18px] font-extrabold tracking-[-0.03em] text-[#173858]">Your usual routes</h3>
                </div>
                <MapPin size={18} className="text-[#2c9c92]" />
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-[#f5f8fc] px-3.5 py-3">
                  <span className="text-[12px] font-bold text-[#45627e]">Old Sagay</span>
                  <span className="text-[11px] font-extrabold text-[#7790a9]">3 reports</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-[#f5f8fc] px-3.5 py-3">
                  <span className="text-[12px] font-bold text-[#45627e]">SUNN campus</span>
                  <span className="text-[11px] font-extrabold text-[#7790a9]">1 report</span>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-4 text-[#8aa0b6]">Locations are shown to help you recognize a report, not to track your movement.</p>
            </div>
          </aside>
        </section>
      </div>

      {notice ? (
        <div className="fixed bottom-[86px] left-1/2 z-40 flex w-[calc(100%-32px)] max-w-[390px] -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#173858] px-4 py-3 text-[12px] font-bold text-white shadow-[0_16px_34px_rgba(18,47,76,0.22)] lg:bottom-7">
          <CheckCircle2 size={17} className="shrink-0 text-[#83ddc5]" />
          {notice}
        </div>
      ) : null}

      {selectedReport ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#173858]/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onClick={() => setSelectedReport(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-detail-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[500px] rounded-t-[28px] border border-[#dbe5f0] bg-white p-6 shadow-[0_25px_70px_rgba(25,63,98,0.24)] sm:rounded-[28px] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8096ae]">Report detail</p>
                <h2 id="report-detail-title" className="mt-1.5 text-[23px] font-extrabold tracking-[-0.04em] text-[#173858]">{selectedReport.id}</h2>
              </div>
              <button type="button" onClick={() => setSelectedReport(null)} className="rounded-xl p-2 text-[#7890aa] hover:bg-[#f4f7fb]" aria-label="Close report detail">
                <X size={19} />
              </button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <StatusPill status={selectedReport.status} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f7fb] px-2.5 py-1 text-[11px] font-bold text-[#6e849d]">
                <CalendarDays size={12} />
                {selectedReport.dateShort} 2024
              </span>
            </div>
            <p className="mt-6 text-[14px] leading-6 text-[#526f89]">{selectedReport.summary}</p>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#f5f8fc] p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9aabbe]">Driver named</dt>
                <dd className="mt-1.5 text-[12px] font-extrabold text-[#45627e]">{selectedReport.driver}</dd>
              </div>
              <div className="rounded-2xl bg-[#f5f8fc] p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9aabbe]">Location</dt>
                <dd className="mt-1.5 text-[12px] font-extrabold text-[#45627e]">{selectedReport.location}</dd>
              </div>
            </dl>
            <div className="mt-5 flex items-center gap-2 border-t border-[#e7eef5] pt-4 text-[11px] font-semibold text-[#8398ad]">
              <Clock3 size={14} />
              {selectedReport.updated}
            </div>
            <button type="button" onClick={() => setSelectedReport(null)} className="mt-6 flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#0c5bce] text-[13px] font-extrabold text-white transition hover:bg-[#0a50b6] focus:outline-none focus:ring-4 focus:ring-[#8cb3e6]/35">
              Done
            </button>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}

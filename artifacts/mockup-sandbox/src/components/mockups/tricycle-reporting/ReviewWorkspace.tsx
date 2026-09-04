import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileText,
  Gavel,
  History,
  Info,
  LockKeyhole,
  MapPin,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  Phone,
  PlayCircle,
  Scale,
  ShieldCheck,
  TimerReset,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";

type ReviewStatus = "Received" | "Under Review" | "Verification Needed" | "Referred" | "Resolved" | "Closed";

type ActionType = "received" | "review" | "verify" | "refer" | "record" | "resolve" | "close";

type DialogState = {
  action: ActionType;
  label: string;
} | null;

const incident = {
  reportId: "TRC-2026-00124",
  submittedAt: "18 February 2026, 9:42 AM",
  incidentDate: "17 February 2026",
  incidentTime: "5:15 PM",
  location: "Old Sagay Public Market, Zone 2",
  category: "Passenger safety concern",
  reporter: "SUNN student reporter",
  description:
    "The driver appeared to accept more passengers than the posted seating capacity while the tricycle was waiting near the market entrance. The reporter noted that one passenger was standing beside the driver before the vehicle departed.",
};

const driver = {
  name: "Ramon L. Dela Cruz",
  id: "DRV-OS-0187",
  plate: "SAG 4821",
  association: "Old Sagay TODA",
  route: "Public Market ↔ Sagay Centro",
  phone: "+63 917 248 1096",
  lastReview: "No prior review in the last 12 months",
};

const evidence = [
  { label: "Report narrative", type: "Written statement", size: "1 page", icon: FileText },
  { label: "Market entrance photo", type: "Image attachment", size: "1.8 MB", icon: Paperclip },
  { label: "Reporter follow-up", type: "Clarification note", size: "Added 19 Feb", icon: MessageSquareText },
];

const initialHistory = [
  {
    date: "18 Feb 2026 · 9:42 AM",
    title: "Report received",
    detail: "Submitted through the student reporting form.",
    actor: "System intake",
    tone: "blue",
  },
  {
    date: "18 Feb 2026 · 10:06 AM",
    title: "Access scope checked",
    detail: "Record was routed to authorized TODA review staff.",
    actor: "Access control",
    tone: "slate",
  },
  {
    date: "19 Feb 2026 · 8:20 AM",
    title: "Reporter clarification added",
    detail: "A follow-up note was attached to the original report.",
    actor: "SUNN student reporter",
    tone: "amber",
  },
];

const statusMeta: Record<ReviewStatus, { className: string; dot: string }> = {
  Received: { className: "border-[#d6e3f1] bg-[#f3f7fc] text-[#44617f]", dot: "bg-[#7390ae]" },
  "Under Review": { className: "border-[#c6dafb] bg-[#eaf2ff] text-[#0c5bce]", dot: "bg-[#0c5bce]" },
  "Verification Needed": { className: "border-[#ddd4fa] bg-[#f4f0ff] text-[#6852b8]", dot: "bg-[#8069cf]" },
  Referred: { className: "border-[#f2d9b4] bg-[#fff7e9] text-[#9b6011]", dot: "bg-[#d9972e]" },
  Resolved: { className: "border-[#c4ead9] bg-[#ecfaf3] text-[#20885d]", dot: "bg-[#29a16c]" },
  Closed: { className: "border-[#d7dde4] bg-[#eef1f4] text-[#58687a]", dot: "bg-[#718092]" },
};

const dialogCopy: Record<ActionType, { title: string; prompt: string; button: string; accent: string }> = {
  received: {
    title: "Keep as received",
    prompt: "Return this report to the received queue without starting an active review. The submitted information remains unchanged.",
    button: "Keep as received",
    accent: "slate",
  },
  review: {
    title: "Start review",
    prompt: "Move this report into active review? This records that an officer has begun assessing the submitted information.",
    button: "Start review",
    accent: "blue",
  },
  verify: {
    title: "Request verification",
    prompt: "Flag the report for additional fact-checking. Verification does not establish that a violation occurred.",
    button: "Request verification",
    accent: "violet",
  },
  refer: {
    title: "Refer report",
    prompt: "Send this report to the selected coordinating desk for follow-up while keeping the original submission intact.",
    button: "Refer report",
    accent: "amber",
  },
  record: {
    title: "Record an action",
    prompt: "Add a neutral action note to the report history. This note will be visible to authorized personnel.",
    button: "Save action note",
    accent: "teal",
  },
  resolve: {
    title: "Mark as resolved",
    prompt: "Mark the review workflow as resolved. This means the review step is complete, not that the report is a confirmed violation.",
    button: "Mark resolved",
    accent: "green",
  },
  close: {
    title: "Close report",
    prompt: "Close this report from the active queue after recording a final disposition. Closed reports remain available to authorized personnel.",
    button: "Close report",
    accent: "slate",
  },
};

function StatusPill({ status }: { status: ReviewStatus }) {
  const meta = statusMeta[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${meta.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {status}
    </span>
  );
}

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  action,
}: {
  icon: typeof FileText;
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#0c5bce]">
          <Icon size={17} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8ca0b6]">{eyebrow}</p>
          <h2 className="mt-1 text-[15px] font-extrabold tracking-[-0.02em] text-[#183657]">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

export function ReviewWorkspace() {
  const [status, setStatus] = useState<ReviewStatus>("Received");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState(initialHistory);

  const latestStatusCopy = useMemo(() => {
    if (status === "Received") return "Awaiting officer review";
    if (status === "Under Review") return "Active review in progress";
    if (status === "Verification Needed") return "Additional information requested";
    if (status === "Referred") return "With coordinating desk";
    if (status === "Resolved") return "Review completed";
    return "Archived from active queue";
  }, [status]);

  const openAction = (action: ActionType, label: string) => {
    setNotice("");
    setNote("");
    setDialog({ action, label });
  };

  const confirmAction = () => {
    if (!dialog) return;
    const actionStatus: Record<ActionType, ReviewStatus> = {
      received: "Received",
      review: "Under Review",
      verify: "Verification Needed",
      refer: "Referred",
      record: status,
      resolve: "Resolved",
      close: "Closed",
    };
    const nextStatus = actionStatus[dialog.action];
    setStatus(nextStatus);
    setHistory((current) => [
      ...current,
      {
        date: "19 Feb 2026 · 10:14 AM",
        title: dialog.action === "record" ? "Action note recorded" : `${dialog.label} completed`,
        detail: note.trim() || dialogCopy[dialog.action].prompt,
        actor: "Alex R. Mendez · TODA officer",
        tone: dialogCopy[dialog.action].accent,
      },
    ]);
    setDialog(null);
    setNotice(
      dialog.action === "record"
        ? "The action note was added to this report’s local activity history."
        : `${dialog.label} was recorded in this prototype workspace.`,
    );
  };

  return (
    <AppLayout officer active="Reports" title="Report review" eyebrow="Reports / Review workspace">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <button
              type="button"
              onClick={() => setNotice("Report queue navigation is represented locally in this prototype.")}
              className="mb-4 inline-flex items-center gap-2 text-[12px] font-bold text-[#66809e] transition hover:text-[#0c5bce]"
            >
              <ArrowLeft size={15} />
              Back to report queue
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#163154] lg:text-[34px]">TRC-2026-00124</h1>
              <StatusPill status={status} />
            </div>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#71859e]">
              Student-submitted report concerning a public transport safety observation in Barangay Old Sagay.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-[#ccebdc] bg-[#f0fbf5] px-3 py-2.5 text-[11px] font-bold text-[#24825c]">
              <LockKeyhole size={14} />
              Authorized access
            </div>
            <div className="rounded-xl border border-[#dbe5f0] bg-white px-3 py-2.5 text-[11px] font-semibold text-[#71859e]">
              Last updated 19 Feb 2026
            </div>
          </div>
        </div>

        {notice ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#c9ddf8] bg-[#eef6ff] px-4 py-3 text-[12px] font-semibold text-[#27578b]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              {notice}
            </div>
            <button type="button" onClick={() => setNotice("")} className="rounded-lg p-1 hover:bg-[#dcecff]" aria-label="Dismiss notice">
              <X size={15} />
            </button>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="min-w-0 space-y-5">
            <section className="overflow-hidden rounded-[22px] border border-[#dbe5f0] bg-white shadow-[0_10px_32px_rgba(36,72,111,0.05)]">
              <div className="border-b border-[#e6edf5] bg-[#fbfdff] px-5 py-5 lg:px-7">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <SectionHeading icon={FileText} eyebrow="Submitted report" title="Incident details" />
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#7b8da4]">
                    <Clock3 size={14} />
                    Received {incident.submittedAt}
                  </div>
                </div>
              </div>
              <div className="px-5 py-6 lg:px-7">
                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8ca0b6]">Incident date</p>
                    <p className="mt-1.5 text-[12px] font-bold text-[#294765]">{incident.incidentDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8ca0b6]">Approximate time</p>
                    <p className="mt-1.5 text-[12px] font-bold text-[#294765]">{incident.incidentTime}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8ca0b6]">Reported location</p>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#294765]"><MapPin size={14} className="text-[#0c5bce]" />{incident.location}</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8ca0b6]">Report category</p>
                    <p className="mt-1.5 text-[12px] font-bold text-[#294765]">{incident.category}</p>
                  </div>
                </div>
                <div className="mt-7 rounded-2xl border border-[#e5ebf3] bg-[#f8fafc] p-4 lg:p-5">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8093aa]">
                    <MessageSquareText size={14} />
                    Reporter statement
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-[#3f5873]">{incident.description}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-[#7d90a6]">
                  <span className="inline-flex items-center gap-2"><UserRound size={14} />Submitted by {incident.reporter}</span>
                  <span className="inline-flex items-center gap-2"><FileCheck2 size={14} />Original report retained</span>
                </div>
              </div>
            </section>

            <section className="rounded-[22px] border border-[#ecd7ac] bg-[#fffaf0] p-5 lg:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0cc] text-[#ae7418]">
                  <Scale size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#ae7418]">Important distinction</p>
                  <h2 className="mt-1 text-[15px] font-extrabold text-[#70490e]">This is a report, not a confirmed violation.</h2>
                  <p className="mt-2 max-w-3xl text-[12px] leading-5 text-[#896a37]">
                    The submission records a student observation for review. Until authorized personnel complete the appropriate verification and disposition steps, no finding should be treated as established fact.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-[0_10px_32px_rgba(36,72,111,0.04)] lg:p-7">
              <SectionHeading icon={UsersRound} eyebrow="Registered operator" title="Driver information" action={<button type="button" onClick={() => setNotice("Driver profile preview opened locally.")} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0c5bce]">View profile <ChevronRight size={14} /></button>} />
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#dcecff] text-[18px] font-extrabold text-[#0c5bce]">RD</div>
                  <div>
                    <p className="text-[17px] font-extrabold tracking-[-0.02em] text-[#1a3859]">{driver.name}</p>
                    <p className="mt-1 text-[12px] font-semibold text-[#7c90a6]">{driver.id} · {driver.association}</p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#4d6783]"><Phone size={14} className="text-[#0c5bce]" />{driver.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[#f8fafc] p-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8ca0b6]">Plate number</p><p className="mt-1.5 text-[12px] font-bold text-[#294765]">{driver.plate}</p></div>
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8ca0b6]">Assigned route</p><p className="mt-1.5 text-[12px] font-bold text-[#294765]">{driver.route}</p></div>
                  <div className="col-span-2 border-t border-[#e5ebf3] pt-3"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8ca0b6]">Review history</p><p className="mt-1.5 text-[12px] font-bold text-[#428265]">{driver.lastReview}</p></div>
                </div>
              </div>
            </section>

            <section className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-[0_10px_32px_rgba(36,72,111,0.04)] lg:p-7">
              <SectionHeading icon={Paperclip} eyebrow="Submitted material" title="Evidence and attachments" action={<span className="text-[11px] font-semibold text-[#8a9bb0]">3 items</span>} />
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {evidence.map(({ label, type, size, icon: Icon }, index) => (
                  <button
                    type="button"
                    key={label}
                    onClick={() => setNotice(`${label} preview is available in this local prototype.`)}
                    className="group rounded-2xl border border-[#e2e9f1] bg-[#fbfdff] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#bcd3f5] hover:bg-[#f4f8ff]"
                  >
                    <div className={`flex h-28 items-center justify-center rounded-xl ${index === 1 ? "bg-[#e3edf7]" : "bg-[#eef4fa]"} text-[#6683a1]`}>
                      <Icon size={24} strokeWidth={1.6} />
                    </div>
                    <p className="mt-3 truncate text-[12px] font-extrabold text-[#294765]">{label}</p>
                    <p className="mt-1 text-[10px] font-semibold text-[#8597aa]">{type} · {size}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#0c5bce]">Open preview <ChevronRight size={12} /></span>
                  </button>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#dbe5f0] bg-[#f8fafc] px-3 py-3 text-[11px] leading-5 text-[#71859e]">
                <Info size={15} className="mt-0.5 shrink-0 text-[#7894b4]" />
                Attachments are shown for authorized review only. This prototype does not upload, download, or persist files.
              </div>
            </section>

            <section className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-[0_10px_32px_rgba(36,72,111,0.04)] lg:p-7">
              <SectionHeading icon={History} eyebrow="Audit trail" title="Detailed timeline" />
              <div className="relative mt-7 space-y-0 pl-1">
                <div className="absolute bottom-6 left-[13px] top-2 w-px bg-[#d9e5f1]" />
                {history.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="relative flex gap-4 pb-7 last:pb-0">
                    <div className={`relative z-[1] mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-4 border-white ${item.tone === "amber" ? "bg-[#d9972e]" : item.tone === "blue" ? "bg-[#0c5bce]" : item.tone === "green" ? "bg-[#29a16c]" : "bg-[#8096ae]"}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <p className="text-[13px] font-extrabold text-[#294765]">{item.title}</p>
                        <p className="shrink-0 text-[10px] font-bold text-[#91a0b1]">{item.date}</p>
                      </div>
                      <p className="mt-1 text-[12px] leading-5 text-[#71859e]">{item.detail}</p>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9aaabc]">{item.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[22px] border border-[#cbdcf2] bg-[#fafdff] p-5 shadow-[0_10px_32px_rgba(36,72,111,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8ca0b6]">Current status</p>
                  <p className="mt-2 text-[20px] font-extrabold tracking-[-0.03em] text-[#183657]">{latestStatusCopy}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#0c5bce]"><TimerReset size={19} /></div>
              </div>
              <div className="mt-5 rounded-xl border border-[#dce8f5] bg-white p-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#8496aa]">
                  <span>Workflow progress</span>
                  <span>{status === "Closed" ? "5 / 5" : status === "Resolved" ? "4 / 5" : status === "Referred" ? "3 / 5" : status === "Verification Needed" ? "2 / 5" : status === "Under Review" ? "1 / 5" : "0 / 5"}</span>
                </div>
                <div className="mt-3 flex gap-1">
                  {["Received", "Under Review", "Verification Needed", "Resolved", "Closed"].map((step, index) => (
                    <span key={step} className={`h-1.5 flex-1 rounded-full ${["Under Review", "Verification Needed", "Resolved", "Closed"].indexOf(status) >= index ? "bg-[#0c5bce]" : index === 0 && status !== "Received" ? "bg-[#0c5bce]" : "bg-[#e0e8f1]"}`} />
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-[0_10px_32px_rgba(36,72,111,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8ca0b6]">Assigned reviewer</p>
                  <p className="mt-1 text-[15px] font-extrabold text-[#183657]">Alex R. Mendez</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e0f3ec] text-[12px] font-extrabold text-[#23835d]">AR</div>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[#7b8fa5]">TODA compliance officer · Old Sagay</p>
              <div className="mt-4 flex items-center gap-2 border-t border-[#edf1f5] pt-4 text-[11px] font-semibold text-[#4e6a86]">
                <BadgeCheck size={15} className="text-[#2aa36e]" />
                Authorized to review this record
              </div>
            </section>

            <section className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-[0_10px_32px_rgba(36,72,111,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8ca0b6]">Review controls</p>
                  <h2 className="mt-1 text-[15px] font-extrabold text-[#183657]">Choose next action</h2>
                </div>
                <MoreHorizontal size={18} className="text-[#9aabbe]" />
              </div>
              <div className="mt-5 grid gap-2">
                <button type="button" onClick={() => openAction("received", "Keep as received")} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[12px] font-bold transition border-[#d6e3f1] bg-[#f3f7fc] text-[#44617f] hover:bg-[#e8f0f8]"><FileCheck2 size={16} />Received<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button>
                <button type="button" onClick={() => openAction("review", "Start review")} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[12px] font-bold transition border-[#c6dafb] bg-[#eaf2ff] text-[#0c5bce] hover:bg-[#dceaff]"><PlayCircle size={16} />Under Review<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button>
                <button type="button" onClick={() => openAction("verify", "Request verification")} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[12px] font-bold transition border-[#ddd4fa] bg-[#f4f0ff] text-[#6852b8] hover:bg-[#ebe4ff]"><AlertCircle size={16} />Verify<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button>
                <button type="button" onClick={() => openAction("refer", "Refer report")} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[12px] font-bold transition border-[#f2d9b4] bg-[#fff7e9] text-[#9b6011] hover:bg-[#fff0d4]"><UsersRound size={16} />Refer<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button>
                <button type="button" onClick={() => openAction("record", "Record an action")} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[12px] font-bold transition border-[#bee8e3] bg-[#effaf8] text-[#137b74] hover:bg-[#dcf5f1]"><Gavel size={16} />Record Action<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button>
                <div className="my-1 border-t border-[#e8eef4]" />
                <button type="button" onClick={() => openAction("resolve", "Mark as resolved")} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[12px] font-bold transition border-[#c4ead9] bg-[#ecfaf3] text-[#20885d] hover:bg-[#dcf5ea]"><CheckCircle2 size={16} />Resolve<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button>
                <button type="button" onClick={() => openAction("close", "Close report")} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[12px] font-bold transition border-[#d7dde4] bg-[#f3f5f7] text-[#58687a] hover:bg-[#e9edf1]"><Check size={16} />Close<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button>
              </div>
              <p className="mt-4 text-[10px] leading-4 text-[#8a9bae]">Every action is logged with the reviewer and timestamp in this workspace.</p>
            </section>

            <section className="rounded-[22px] border border-[#dbe5f0] bg-[#f4f8fd] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#0c5bce]" />
                <div>
                  <p className="text-[12px] font-extrabold text-[#23405f]">Authorized access only</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#71859e]">This workspace contains a student report and driver details. Share or discuss records only through approved review channels.</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17304b]/35 px-4 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="review-dialog-title" className="w-full max-w-[480px] rounded-[24px] border border-[#dbe5f0] bg-white p-5 shadow-[0_24px_80px_rgba(16,45,78,0.22)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8ca0b6]">Confirm local action</p>
                <h2 id="review-dialog-title" className="mt-2 text-[20px] font-extrabold tracking-[-0.03em] text-[#183657]">{dialogCopy[dialog.action].title}</h2>
              </div>
              <button type="button" onClick={() => setDialog(null)} className="rounded-xl p-2 text-[#8092a6] hover:bg-[#f2f6fa]" aria-label="Close dialog"><X size={18} /></button>
            </div>
            <p className="mt-4 text-[13px] leading-6 text-[#60768f]">{dialogCopy[dialog.action].prompt}</p>
            <label className="mt-5 block">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8295aa]">{dialog.action === "record" ? "Action note" : "Optional reviewer note"}</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context for the activity history" rows={4} className="mt-2 w-full resize-none rounded-xl border border-[#dbe5f0] bg-[#fbfdff] px-3 py-3 text-[12px] leading-5 text-[#294765] outline-none transition placeholder:text-[#a2afbd] focus:border-[#86afe8] focus:ring-4 focus:ring-[#eaf2ff]" />
            </label>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDialog(null)} className="rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#6e8299] hover:bg-[#f4f7fb]">Cancel</button>
              <button type="button" onClick={confirmAction} className="rounded-xl bg-[#0c5bce] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_6px_14px_rgba(12,91,206,0.2)] transition hover:bg-[#094da9]">{dialogCopy[dialog.action].button}</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}

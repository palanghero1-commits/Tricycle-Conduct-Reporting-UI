import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  Check,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  History,
  Info,
  MapPin,
  MessageCircle,
  Paperclip,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";

type TimelineState = "complete" | "current" | "upcoming";

type TimelineItem = {
  label: string;
  date?: string;
  note?: string;
  state: TimelineState;
};

const timeline: TimelineItem[] = [
  {
    label: "Submitted",
    date: "24 Jan 2026 · 9:42 AM",
    note: "Your report was submitted for review.",
    state: "complete",
  },
  {
    label: "Received",
    date: "24 Jan 2026 · 10:08 AM",
    note: "The conduct desk received the report and assigned a reference number.",
    state: "complete",
  },
  {
    label: "Under Review",
    date: "25 Jan 2026 · 2:16 PM",
    note: "An authorized reviewer is checking the report details and available evidence.",
    state: "current",
  },
  {
    label: "Verified / Referred",
    note: "The reviewer may verify the information or refer it to the appropriate office.",
    state: "upcoming",
  },
  {
    label: "Resolved",
    note: "Any action or response will be recorded here when the review is complete.",
    state: "upcoming",
  },
  {
    label: "Closed",
    note: "The report record will be closed after the review process ends.",
    state: "upcoming",
  },
];

const updates = [
  {
    date: "25 Jan 2026 · 2:16 PM",
    title: "Review started",
    body: "Authorized personnel began reviewing the submitted details and attached evidence.",
    initials: "AR",
  },
  {
    date: "24 Jan 2026 · 10:08 AM",
    title: "Report received",
    body: "The conduct desk confirmed receipt of your report TRC-2026-00124.",
    initials: "CD",
  },
  {
    date: "24 Jan 2026 · 9:42 AM",
    title: "Report submitted",
    body: "You submitted a report from the Old Sagay route.",
    initials: "MC",
  },
];

function StatusMarker({ state }: { state: TimelineState }) {
  if (state === "complete") {
    return (
      <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-[#e5f7f5] bg-[#0f9d91] text-white shadow-[0_0_0_1px_#8bd8d0]">
        <Check size={13} strokeWidth={3} />
      </span>
    );
  }

  if (state === "current") {
    return (
      <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-[#fff4df] bg-[#d9922e] text-white shadow-[0_0_0_1px_#efc36e]">
        <Clock3 size={13} strokeWidth={2.5} />
      </span>
    );
  }

  return (
    <span className="relative z-[1] h-8 w-8 shrink-0 rounded-full border-[3px] border-[#cddbe9] bg-[#f4f7fb]" />
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5fb] text-[#247f99]">
        <Icon size={16} strokeWidth={1.9} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8aa0b8]">{label}</p>
        <p className="mt-1 text-[13px] font-semibold leading-5 text-[#294662]">{value}</p>
      </div>
    </div>
  );
}

export function ReportTracking() {
  const [view, setView] = useState<"details" | "updates">("details");
  const [showEvidence, setShowEvidence] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  return (
    <AppLayout
      active="My reports"
      title="Report tracking"
      eyebrow="My reports / TRC-2026-00124"
    >
      <div className="mx-auto max-w-[1180px]">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="group mb-6 inline-flex items-center gap-2 text-[12px] font-bold text-[#66809d] transition hover:text-[#0c5bce]"
        >
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
          Back to my reports
        </button>

        <section className="relative overflow-hidden rounded-[24px] border border-[#d8e6f1] bg-[#eaf6f7] px-5 py-6 shadow-[0_14px_38px_rgba(31,76,112,0.06)] sm:px-8 sm:py-7 lg:px-10">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[26px] border-[#d4eff0] opacity-80" />
          <div className="pointer-events-none absolute -bottom-28 right-24 h-52 w-52 rounded-full border-[18px] border-[#d8f1f1] opacity-70" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#2a8d8e]">
                <FileText size={14} />
                Report reference
              </div>
              <h2 className="mt-3 font-mono text-[23px] font-bold tracking-[-0.04em] text-[#14385d] sm:text-[29px]">
                TRC-2026-00124
              </h2>
              <p className="mt-2 max-w-[540px] text-[13px] leading-5 text-[#59758f]">
                A progress view for your submitted report. The status reflects the current stage of review.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5 self-start rounded-2xl border border-[#edcc8c] bg-[#fff9ed] px-4 py-3 sm:self-auto">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d9922e] shadow-[0_0_0_4px_#fcebc9]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a8731d]">Current status</p>
                <p className="mt-0.5 text-[14px] font-extrabold text-[#79531d]">Under Review</p>
              </div>
            </div>
          </div>
          <div className="relative mt-7 grid gap-4 border-t border-[#cfe5e9] pt-5 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <CalendarDays size={17} className="text-[#2a8d8e]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e9bad]">Submitted</p>
                <p className="mt-0.5 text-[12px] font-bold text-[#294662]">24 January 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock3 size={17} className="text-[#2a8d8e]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e9bad]">Last updated</p>
                <p className="mt-0.5 text-[12px] font-bold text-[#294662]">25 January 2026 · 2:16 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={17} className="text-[#2a8d8e]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e9bad]">Visibility</p>
                <p className="mt-0.5 text-[12px] font-bold text-[#294662]">Visible to authorized personnel</p>
              </div>
            </div>
          </div>
        </section>

        {!noticeDismissed ? (
          <section className="mt-5 flex items-start gap-3 rounded-2xl border border-[#c9dfea] bg-[#f3f9fd] px-4 py-4 sm:px-5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dceefa] text-[#28759d]">
              <Info size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-extrabold text-[#28506d]">A report is not the same as a confirmed violation.</p>
              <p className="mt-1 max-w-[850px] text-[12px] leading-5 text-[#66819a]">
                This record documents information shared for review. A confirmed violation can only be determined by authorized personnel after the appropriate process.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNoticeDismissed(true)}
              className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-[#66819a] transition hover:bg-[#e5f1f8] hover:text-[#28506d]"
            >
              Dismiss
            </button>
          </section>
        ) : (
          <button
            type="button"
            onClick={() => setNoticeDismissed(false)}
            className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold text-[#4f7f99] hover:text-[#0c5bce]"
          >
            <Info size={13} />
            Show report clarification
          </button>
        )}

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <section className="rounded-[22px] border border-[#dbe6f0] bg-white p-5 shadow-[0_12px_30px_rgba(31,76,112,0.045)] sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8da1b6]">Progress</p>
                <h3 className="mt-1.5 text-[19px] font-extrabold tracking-[-0.025em] text-[#163154]">Review timeline</h3>
              </div>
              <span className="rounded-full bg-[#e8f7f5] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#188277]">
                3 of 6 stages
              </span>
            </div>
            <div className="relative mt-7">
              <div className="absolute bottom-8 left-[15px] top-8 w-px bg-[#d9e5ee]" />
              <div className="absolute left-[15px] top-8 h-[27%] w-px bg-[#67c5bd]" />
              <div className="space-y-0">
                {timeline.map((item) => (
                  <div key={item.label} className="relative flex gap-4 pb-7 last:pb-0">
                    <StatusMarker state={item.state} />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                        <h4 className={`text-[14px] font-extrabold ${item.state === "upcoming" ? "text-[#8094aa]" : "text-[#294662]"}`}>
                          {item.label}
                        </h4>
                        {item.date ? <span className="text-[10px] font-semibold text-[#8da1b6]">{item.date}</span> : null}
                      </div>
                      <p className={`mt-1 max-w-[470px] text-[12px] leading-5 ${item.state === "upcoming" ? "text-[#a2b0bf]" : "text-[#7189a0]"}`}>
                        {item.note}
                      </p>
                      {item.state === "current" ? (
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#fff7e8] px-2.5 py-1.5 text-[10px] font-bold text-[#a8731d]">
                          <Clock3 size={12} />
                          Awaiting review outcome
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-[#dbe6f0] bg-white p-5 shadow-[0_12px_30px_rgba(31,76,112,0.045)] sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8da1b6]">Record view</p>
                <h3 className="mt-1.5 text-[19px] font-extrabold tracking-[-0.025em] text-[#163154]">
                  {view === "details" ? "Report details" : "Update history"}
                </h3>
              </div>
              <div className="flex rounded-xl bg-[#f0f5f9] p-1">
                <button
                  type="button"
                  onClick={() => setView("details")}
                  className={`rounded-lg px-3 py-2 text-[10px] font-extrabold transition ${view === "details" ? "bg-white text-[#0c5bce] shadow-sm" : "text-[#7890a8] hover:text-[#395875]"}`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setView("updates")}
                  className={`rounded-lg px-3 py-2 text-[10px] font-extrabold transition ${view === "updates" ? "bg-white text-[#0c5bce] shadow-sm" : "text-[#7890a8] hover:text-[#395875]"}`}
                >
                  Updates
                </button>
              </div>
            </div>

            {view === "details" ? (
              <div className="mt-6 space-y-5">
                <DetailRow icon={MapPin} label="Incident location" value="Old Sagay terminal, near the public market" />
                <DetailRow icon={CalendarDays} label="Incident date and time" value="23 January 2026 · Approximately 4:30 PM" />
                <DetailRow icon={CarFront} label="Route noted" value="Sagay Central – Old Sagay" />
                <div className="border-t border-[#edf1f5] pt-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8aa0b8]">Your description</p>
                  <p className="mt-2 text-[13px] leading-6 text-[#536e87]">
                    “The tricycle stopped outside the marked loading area while passengers were waiting. I included the route and vehicle details so the conduct desk can review the situation.”
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {updates.map((update, index) => (
                  <div key={update.date} className="relative flex gap-3">
                    {index < updates.length - 1 ? <span className="absolute bottom-[-21px] left-[15px] top-9 w-px bg-[#e1eaf1]" /> : null}
                    <div className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e3f0fb] text-[10px] font-extrabold text-[#2875b3]">
                      {update.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-extrabold text-[#294662]">{update.title}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-[#94a5b6]">{update.date}</p>
                      <p className="mt-1.5 text-[12px] leading-5 text-[#7189a0]">{update.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <section className="rounded-[22px] border border-[#dbe6f0] bg-white p-5 shadow-[0_12px_30px_rgba(31,76,112,0.045)] sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#0c5bce]">
                <UserRound size={19} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8da1b6]">Vehicle record</p>
                <h3 className="mt-0.5 text-[17px] font-extrabold text-[#163154]">Driver information</h3>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-[#f5f8fb] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8aa0b8]">Reported vehicle</p>
              <p className="mt-1 text-[14px] font-extrabold text-[#294662]">Tricycle · SGY-482</p>
              <div className="mt-4 grid gap-3 border-t border-[#e2eaf1] pt-4">
                <div className="flex justify-between gap-3 text-[12px]">
                  <span className="text-[#8aa0b8]">Driver name</span>
                  <span className="font-bold text-[#536e87]">Not displayed</span>
                </div>
                <div className="flex justify-between gap-3 text-[12px]">
                  <span className="text-[#8aa0b8]">Route association</span>
                  <span className="text-right font-bold text-[#536e87]">Old Sagay terminal</span>
                </div>
                <div className="flex justify-between gap-3 text-[12px]">
                  <span className="text-[#8aa0b8]">Record status</span>
                  <span className="font-bold text-[#2a8d8e]">Under review</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2.5 rounded-xl border border-[#e0ebf2] px-3.5 py-3">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#2a8d8e]" />
              <p className="text-[11px] leading-5 text-[#7890a8]">
                Driver information is limited in this student view and is visible only to authorized personnel.
              </p>
            </div>
          </section>

          <section className="rounded-[22px] border border-[#dbe6f0] bg-white p-5 shadow-[0_12px_30px_rgba(31,76,112,0.045)] sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f7f5] text-[#188277]">
                  <Paperclip size={19} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8da1b6]">Attached evidence</p>
                  <h3 className="mt-0.5 text-[17px] font-extrabold text-[#163154]">Evidence preview</h3>
                </div>
              </div>
              <span className="rounded-full bg-[#eff5f8] px-2.5 py-1 text-[10px] font-bold text-[#70889f]">1 item</span>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-[#dbe7ec] bg-[#edf5f5]">
              <div className="relative flex h-[150px] items-center justify-center overflow-hidden sm:h-[180px]">
                <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(135deg,rgba(42,141,142,0.08)_25%,transparent_25%,transparent_50%,rgba(42,141,142,0.08)_50%,rgba(42,141,142,0.08)_75%,transparent_75%)] [background-size:34px_34px]" />
                <div className="relative flex flex-col items-center gap-2 rounded-xl border border-[#b9dddc] bg-[#f8fcfc] px-7 py-5 text-center shadow-sm">
                  <FileText size={25} className="text-[#2a8d8e]" strokeWidth={1.7} />
                  <p className="text-[12px] font-extrabold text-[#365a6b]">route-observation.jpg</p>
                  <p className="text-[10px] font-semibold text-[#8aa1ad]">Image preview · 1.8 MB</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#dbe7ec] bg-white px-3.5 py-3">
                <span className="text-[11px] font-semibold text-[#7890a8]">Submitted with report</span>
                <button
                  type="button"
                  onClick={() => setShowEvidence((visible) => !visible)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#0c5bce] transition hover:bg-[#eaf2ff]"
                >
                  {showEvidence ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showEvidence ? "Hide preview" : "View preview"}
                </button>
              </div>
            </div>
            {showEvidence ? (
              <div className="mt-3 rounded-xl border border-[#cfe5e9] bg-[#f4fbfb] px-3.5 py-3 text-[11px] leading-5 text-[#5c7c8b]">
                Preview is simulated for this prototype. Authorized personnel can access the original submission during review.
              </div>
            ) : null}
          </section>
        </div>

        <section className="mt-6 rounded-[22px] border border-[#dbe6f0] bg-white p-5 shadow-[0_12px_30px_rgba(31,76,112,0.045)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3ff] text-[#4778b6]">
                <MessageCircle size={19} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8da1b6]">Review desk</p>
                <h3 className="mt-0.5 text-[17px] font-extrabold text-[#163154]">Authorized-personnel updates</h3>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#7890a8]">
              <History size={14} />
              Latest activity · 25 Jan 2026
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#e1eaf2] bg-[#f8fafc] px-4 py-4 sm:flex-row sm:items-start sm:px-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dceefa] text-[11px] font-extrabold text-[#2875b3]">AR</div>
            <div className="flex-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] font-extrabold text-[#365a76]">Review desk · Authorized personnel</p>
                <p className="text-[10px] font-semibold text-[#99a9b8]">25 Jan 2026 · 2:16 PM</p>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-[#6e879c]">
                Your report has entered review. The details and attached evidence are being assessed according to the conduct review process. No determination has been made at this stage.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2.5 text-[11px] leading-5 text-[#8196a8]">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#2a8d8e]" />
            <span>Updates are added by authorized personnel. You will see the next update here when the report moves forward.</span>
          </div>
        </section>

        <footer className="flex flex-col gap-2 pb-4 pt-6 text-[10px] font-semibold text-[#93a5b5] sm:flex-row sm:items-center sm:justify-between">
          <span>Fictional prototype record · Student view</span>
          <span>Reference TRC-2026-00124</span>
        </footer>
      </div>
    </AppLayout>
  );
}
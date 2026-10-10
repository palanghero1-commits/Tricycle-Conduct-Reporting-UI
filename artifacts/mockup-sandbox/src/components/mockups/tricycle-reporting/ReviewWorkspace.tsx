import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
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
  ShieldAlert,
  TimerReset,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { apiRequest, fetchAttachment, formatPhilippineDateTime, getCurrentUser } from "../../../lib/api";

type ReviewStatus = "Received" | "Under Review" | "Verified" | "Referred" | "Resolved" | "Closed";

type ActionType = "received" | "review" | "verify" | "refer" | "record" | "resolve" | "close";

type DialogState = {
  action: ActionType;
  label: string;
} | null;

const staticIncident = {
  reportId: "TRC-2026-00124",
  submittedAt: "18 February 2026, 9:42 AM",
  incidentDate: "17 February 2026",
  incidentTime: "5:15 PM",
  location: "Old Sagay Public Market, Zone 2",
  latitude: null as number | string | null,
  longitude: null as number | string | null,
  locationAccuracyMeters: null as number | string | null,
  category: "Passenger safety concern",
  reporter: "SUNN student reporter",
  description:
    "The driver appeared to accept more passengers than the posted seating capacity while the tricycle was waiting near the market entrance. The reporter noted that one passenger was standing beside the driver before the vehicle departed.",
};

const staticDriver = {
  name: "Ramon L. Dela Cruz",
  id: "DRV-OS-0187",
  plate: "SAG 4821",
  association: "Old Sagay TODA",
  route: "Public Market ↔ Sagay Centro",
  phone: "+63 917 248 1096",
  lastReview: "No prior review in the last 12 months",
};

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
  Verified: { className: "border-[#ddd4fa] bg-[#f4f0ff] text-[#6852b8]", dot: "bg-[#8069cf]" },
  Referred: { className: "border-[#f2d9b4] bg-[#fff7e9] text-[#9b6011]", dot: "bg-[#d9972e]" },
  Resolved: { className: "border-[#c4ead9] bg-[#ecfaf3] text-[#20885d]", dot: "bg-[#29a16c]" },
  Closed: { className: "border-[#d7dde4] bg-[#eef1f4] text-[#58687a]", dot: "bg-[#718092]" },
};

const dialogCopy: Record<ActionType, { title: string; prompt: string; button: string; accent: string }> = {
  received: {
    title: "Receive report",
    prompt: "Add this submitted report to the officer review queue. The report details remain unchanged.",
    button: "Receive report",
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
    prompt: "Record that authorized review has verified the reported finding. Only do this after completing the necessary fact-checking; a confirmed violation is recorded separately.",
    button: "Mark as verified",
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
  const currentUser = getCurrentUser();
  const reviewerName = currentUser?.fullName || "Signed-in reviewer";
  const [status, setStatus] = useState<ReviewStatus>("Received");
  const [statusCode, setStatusCode] = useState("SUBMITTED");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [history, setHistory] = useState<typeof initialHistory>(initialHistory);
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [incident, setIncident] = useState<typeof staticIncident | null>(null);
  const [driver, setDriver] = useState<typeof staticDriver | null>(null);
  const [evidence, setEvidence] = useState<Array<{ id: string; label: string; type: string; size: string; icon: typeof FileText }>>([]);
  const [evidencePreview, setEvidencePreview] = useState<{ name: string; type: string; url: string } | null>(null);
  const [openingEvidenceId, setOpeningEvidenceId] = useState<string | null>(null);
  const [confirmedViolation, setConfirmedViolation] = useState<Record<string, any> | null>(null);
  const [violationDialogOpen, setViolationDialogOpen] = useState(false);
  const [violationCategory, setViolationCategory] = useState("");
  const [violationDescription, setViolationDescription] = useState("");
  const [violationRemarks, setViolationRemarks] = useState("");
  const [isSavingViolation, setIsSavingViolation] = useState(false);

  const latestStatusCopy = useMemo(() => {
    if (status === "Received") return "Awaiting officer review";
    if (status === "Under Review") return "Active review in progress";
    if (status === "Verified") return "Finding verified; disposition pending";
    if (status === "Referred") return "With coordinating desk";
    if (status === "Resolved") return "Review completed";
    return "Archived from active queue";
  }, [status]);

  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get("reference");
    setIncident({ ...staticIncident, reportId: reference || staticIncident.reportId });
    setDriver(staticDriver);
    const query = reference ? `?reference=${encodeURIComponent(reference)}` : "";
    apiRequest<{ complaints: Array<{ id: string }> }>(`/complaints${query}`)
      .then(async ({ complaints }) => {
        const complaint = complaints[0];
        if (!complaint) return;
        const details = await apiRequest<{ complaint: Record<string, any>; driver: Record<string, any> | null; category: Record<string, any> | null; history: Array<Record<string, any>>; actions?: Array<Record<string, any>>; attachments: Array<Record<string, any>>; violation: Record<string, any> | null }>(`/complaints/${complaint.id}`);
        const record = details.complaint;
        setComplaintId(complaint.id);
        setLastUpdated(formatPhilippineDateTime(record.updated_at || record.created_at));
        setStatusCode(String(record.status || "SUBMITTED").toUpperCase());
        const statusMap: Record<string, ReviewStatus> = { SUBMITTED: "Received", RECEIVED: "Received", UNDER_REVIEW: "Under Review", VERIFIED: "Verified", REFERRED: "Referred", RESOLVED: "Resolved", CLOSED: "Closed" };
        setStatus(statusMap[String(record.status)] ?? "Received");
        setConfirmedViolation(details.violation ?? null);
        setIncident({
          reportId: record.reference_number,
          submittedAt: formatPhilippineDateTime(record.created_at),
          incidentDate: record.incident_date,
          incidentTime: record.incident_time,
          location: record.location,
          latitude: record.latitude ?? null,
          longitude: record.longitude ?? null,
          locationAccuracyMeters: record.location_accuracy_meters ?? null,
          category: details.category?.name ?? "Uncategorized",
          reporter: "Student reporter",
          description: record.description,
        });
        if (details.driver) {
          setDriver({
            name: details.driver.full_name,
            id: details.driver.driver_code,
            plate: details.driver.plate_number || "Not provided",
            association: "Registered operator",
            route: details.driver.route_area || "Not provided",
            phone: details.driver.contact_number || "Not provided",
            lastReview: details.violation ? "Confirmed violation on this report" : "No review history available",
          });
        }
        setEvidence(details.attachments.map((item) => ({ id: String(item.id), label: item.originalName, type: item.mimeType, size: `${Math.round(Number(item.sizeBytes || 0) / 1024)} KB`, icon: Paperclip })));
        setHistory([
          ...details.history.map((item) => ({ date: formatPhilippineDateTime(item.created_at || item.createdAt), title: String(item.new_status || item.newStatus || "Status recorded").replaceAll("_", " "), detail: item.remarks || "Status recorded in the review history.", actor: item.actorName || item.actorRole || "Authorized reviewer", tone: "blue" })),
          ...(details.actions ?? []).map((item) => ({ date: formatPhilippineDateTime(item.created_at || item.createdAt), title: item.action_type || item.actionType || "Action recorded", detail: item.description || "Authorized action recorded.", actor: item.authorName || item.authorRole || "Authorized reviewer", tone: "green" })),
          ...(details.violation ? [{ date: formatPhilippineDateTime(details.violation.confirmation_date || details.violation.confirmationDate || new Date()), title: "Confirmed violation recorded", detail: `${details.violation.violation_category || details.violation.violationCategory || "Violation"}: ${details.violation.description || ""}`, actor: "Authorized reviewer", tone: "green" }] : []),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) as typeof initialHistory);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => () => {
    if (evidencePreview) URL.revokeObjectURL(evidencePreview.url);
  }, [evidencePreview]);

  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get("reference");
    if (!reference) return;
    let active = true;
    let refreshing = false;
    const refresh = async () => {
      if (!active || refreshing || document.visibilityState !== "visible") return;
      refreshing = true;
      try {
        const { complaints } = await apiRequest<{ complaints: Array<{ id: string }> }>(`/complaints?reference=${encodeURIComponent(reference)}`);
        const complaint = complaints[0];
        if (!complaint) return;
        const details = await apiRequest<{ complaint: Record<string, any>; violation: Record<string, any> | null }>(`/complaints/${complaint.id}`);
        if (!active) return;
        const record = details.complaint;
        const statusCode = String(record.status || "SUBMITTED").toUpperCase();
        const statusMap: Record<string, ReviewStatus> = { SUBMITTED: "Received", RECEIVED: "Received", UNDER_REVIEW: "Under Review", VERIFIED: "Verified", REFERRED: "Referred", RESOLVED: "Resolved", CLOSED: "Closed" };
        setStatusCode(statusCode);
        setStatus(statusMap[statusCode] ?? "Received");
        setConfirmedViolation(details.violation ?? null);
        setLastUpdated(formatPhilippineDateTime(record.updated_at || record.created_at || record.updatedAt || record.createdAt || new Date()));
        if (details.violation) setDriver((current) => current ? { ...current, lastReview: "Confirmed violation on this report" } : current);
      } catch {
        // Keep the latest successful report state visible during brief connection interruptions.
      } finally {
        refreshing = false;
      }
    };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    const interval = window.setInterval(() => void refresh(), 10_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => { active = false; window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  if (!incident || !driver) {
    return <AppLayout officer active="Reports" title="Report review" eyebrow="Reports / Review workspace"><section className="rounded-2xl border border-dashed border-[#b8cade] bg-white px-6 py-16 text-center"><h2 className="text-[18px] font-extrabold text-[#23405f]">No report is available for review</h2><p className="mt-2 text-[12px] text-[#8ca0b6]">Live complaint records will appear here when a student submits a report.</p></section></AppLayout>;
  }

  const openAction = (action: ActionType, label: string) => {
    setNotice("");
    setNote("");
    setDialog({ action, label });
  };

  const confirmAction = async () => {
    if (!dialog) return;
    if (!complaintId) {
      setNotice("This report is not connected to a live complaint record, so the action was not saved.");
      setDialog(null);
      return;
    }
    setIsSaving(true);
    const actionStatus: Record<ActionType, ReviewStatus> = {
      received: "Received",
      review: "Under Review",
      verify: "Verified",
      refer: "Referred",
      record: status,
      resolve: "Resolved",
      close: "Closed",
    };
    const nextStatus = actionStatus[dialog.action];
    const statusValues: Record<string, string> = { received: "RECEIVED", review: "UNDER_REVIEW", verify: "VERIFIED", refer: "REFERRED", resolve: "RESOLVED", close: "CLOSED" };
    try {
      if (dialog.action === "record") {
        await apiRequest(`/complaints/${complaintId}/actions`, { method: "POST", body: JSON.stringify({ actionType: dialog.label, description: note.trim() || dialogCopy[dialog.action].prompt }) });
      } else {
        await apiRequest(`/complaints/${complaintId}/status`, { method: "PATCH", body: JSON.stringify({ status: statusValues[dialog.action], remarks: note.trim() || dialogCopy[dialog.action].prompt }) });
      }
    } catch (error) {
      setIsSaving(false);
      setNotice(error instanceof Error ? error.message : "The live record could not be updated.");
      return;
    }
    setStatus(nextStatus);
    if (statusValues[dialog.action]) setStatusCode(statusValues[dialog.action]);
    setLastUpdated(formatPhilippineDateTime(new Date()));
    setHistory((current) => [
      ...current,
      {
        date: formatPhilippineDateTime(new Date()),
        title: dialog.action === "record" ? "Action note recorded" : `${dialog.label} completed`,
        detail: note.trim() || dialogCopy[dialog.action].prompt,
        actor: reviewerName,
        tone: dialogCopy[dialog.action].accent,
      },
    ]);
    setDialog(null);
    setIsSaving(false);
    setNotice(dialog.action === "record"
      ? "The action note was saved to the report."
      : `${dialog.label} was recorded in the report history.`);
  };

  const confirmViolation = async () => {
    if (!complaintId) {
      setNotice("This report is not connected to a live complaint record, so the violation was not saved.");
      return;
    }
    const category = violationCategory.trim();
    const description = violationDescription.trim();
    if (!category || !description) return;
    setIsSavingViolation(true);
    try {
      const result = await apiRequest<{ violation: Record<string, any> }>(`/complaints/${complaintId}/violations`, {
        method: "POST",
        body: JSON.stringify({ violationCategory: category, description, remarks: violationRemarks.trim() || undefined }),
      });
      setConfirmedViolation({ ...result.violation, violationCategory: category, description });
      setDriver((current) => current ? { ...current, lastReview: "Confirmed violation on this report" } : current);
      setViolationDialogOpen(false);
      setViolationCategory("");
      setViolationDescription("");
      setViolationRemarks("");
      setHistory((current) => [...current, { date: formatPhilippineDateTime(new Date()), title: "Confirmed violation recorded", detail: `${category}: ${description}`, actor: "Authorized reviewer", tone: "green" }]);
      setNotice("The confirmed violation was saved to the report and driver record.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The confirmed violation could not be saved.");
    } finally {
      setIsSavingViolation(false);
    }
  };

  const previewEvidence = async (item: (typeof evidence)[number]) => {
    setOpeningEvidenceId(item.id);
    setNotice("");
    try {
      const blob = await fetchAttachment(item.id);
      setEvidencePreview({ name: item.label, type: item.type, url: URL.createObjectURL(blob) });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to open this evidence file.");
    } finally {
      setOpeningEvidenceId(null);
    }
  };

  return (
    <AppLayout officer active="Reports" title="Report review" eyebrow="Reports / Review workspace">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <button
              type="button"
              onClick={() => {
                const base = import.meta.env.BASE_URL.replace(/\/$/, "");
                window.location.href = `${base}/preview/tricycle-reporting/ReportsQueue`;
              }}
              className="mb-4 inline-flex items-center gap-2 text-[12px] font-bold text-[#66809e] transition hover:text-[#0c5bce]"
            >
              <ArrowLeft size={15} />
              Back to report queue
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#163154] lg:text-[34px]">{incident.reportId}</h1>
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
              Last updated {lastUpdated || "Not available"}
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
                    {incident.latitude !== null && incident.longitude !== null ? <div className="mt-2 space-y-1 pl-5">
                      <p className="font-mono text-[11px] text-[#4d6881]">Latitude: {Number(incident.latitude).toFixed(6)}</p>
                      <p className="font-mono text-[11px] text-[#4d6881]">Longitude: {Number(incident.longitude).toFixed(6)}</p>
                      {incident.locationAccuracyMeters !== null ? <p className="text-[10px] text-[#7d91a5]">GPS accuracy: ±{Math.round(Number(incident.locationAccuracyMeters))} meters</p> : null}
                      <a href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#0c5bce] hover:text-[#084da9]">Open location in map <ChevronRight size={12} /></a>
                    </div> : null}
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
              <SectionHeading icon={Paperclip} eyebrow="Submitted material" title="Evidence and attachments" action={<span className="text-[11px] font-semibold text-[#8a9bb0]">{evidence.length} {evidence.length === 1 ? "item" : "items"}</span>} />
              {evidence.length ? <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {evidence.map((item) => {
                  const { label, type, size, icon: Icon } = item;
                  return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => void previewEvidence(item)}
                    disabled={openingEvidenceId === item.id}
                    className="group rounded-2xl border border-[#e2e9f1] bg-[#fbfdff] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#bcd3f5] hover:bg-[#f4f8ff] disabled:cursor-wait disabled:opacity-60"
                  >
                    <div className="flex h-28 items-center justify-center rounded-xl bg-[#eef4fa] text-[#6683a1]">
                      <Icon size={24} strokeWidth={1.6} />
                    </div>
                    <p className="mt-3 truncate text-[12px] font-extrabold text-[#294765]">{label}</p>
                    <p className="mt-1 text-[10px] font-semibold text-[#8597aa]">{type} · {size}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#0c5bce]">{openingEvidenceId === item.id ? "Loading evidence…" : "View evidence"} <ChevronRight size={12} /></span>
                  </button>
                  );
                })}
              </div> : <div className="mt-6 rounded-xl border border-dashed border-[#d6e1ed] bg-[#fbfdff] px-4 py-8 text-center text-[12px] font-semibold text-[#8295aa]">No evidence files were attached to this report.</div>}
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#dbe5f0] bg-[#f8fafc] px-3 py-3 text-[11px] leading-5 text-[#71859e]">
                <Info size={15} className="mt-0.5 shrink-0 text-[#7894b4]" />
                Attachments are shown for authorized review only and are stored with the report record.
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
                  <span>{status === "Closed" ? "5 / 5" : status === "Resolved" ? "4 / 5" : status === "Referred" ? "3 / 5" : status === "Verified" ? "2 / 5" : status === "Under Review" ? "1 / 5" : "0 / 5"}</span>
                </div>
                <div className="mt-3 flex gap-1">
                  {["Received", "Under Review", "Verified", "Resolved", "Closed"].map((step, index) => (
                    <span key={step} className={`h-1.5 flex-1 rounded-full ${["Under Review", "Verified", "Resolved", "Closed"].indexOf(status) >= index ? "bg-[#0c5bce]" : index === 0 && status !== "Received" ? "bg-[#0c5bce]" : "bg-[#e0e8f1]"}`} />
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-[0_10px_32px_rgba(36,72,111,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8ca0b6]">Assigned reviewer</p>
                  <p className="mt-1 text-[15px] font-extrabold text-[#183657]">{reviewerName}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e0f3ec] text-[12px] font-extrabold text-[#23835d]">{reviewerName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[#7b8fa5]">{currentUser?.role?.replaceAll("_", " ") || "Authorized reviewer"}</p>
              <div className="mt-4 flex items-center gap-2 border-t border-[#edf1f5] pt-4 text-[11px] font-semibold text-[#4e6a86]">
                <BadgeCheck size={15} className="text-[#2aa36e]" />
                Authorized to review this record
              </div>
            </section>

            <section className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-[0_10px_32px_rgba(36,72,111,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8ca0b6]">Review workflow</p>
                  <h2 className="mt-1 text-[15px] font-extrabold text-[#183657]">Next available actions</h2>
                </div>
                <MoreHorizontal size={18} className="text-[#9aabbe]" />
              </div>
              <div className="mt-5 grid gap-2">
                {statusCode === "SUBMITTED" ? <button type="button" onClick={() => openAction("received", "Receive report")} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[12px] font-bold transition border-[#d6e3f1] bg-[#f3f7fc] text-[#44617f] hover:bg-[#e8f0f8]"><FileCheck2 size={16} />Receive report<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button> : null}
                {statusCode === "RECEIVED" ? <button type="button" onClick={() => openAction("review", "Start review")} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[12px] font-bold transition border-[#c6dafb] bg-[#eaf2ff] text-[#0c5bce] hover:bg-[#dceaff]"><PlayCircle size={16} />Start review<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button> : null}
                {statusCode === "UNDER_REVIEW" ? <button type="button" onClick={() => openAction("verify", "Mark as verified")} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[12px] font-bold transition border-[#ddd4fa] bg-[#f4f0ff] text-[#6852b8] hover:bg-[#ebe4ff]"><ShieldCheck size={16} />Mark as verified<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button> : null}
                {["RECEIVED", "UNDER_REVIEW", "VERIFIED"].includes(statusCode) ? <button type="button" onClick={() => openAction("refer", "Refer report")} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[12px] font-bold transition border-[#f2d9b4] bg-[#fff7e9] text-[#9b6011] hover:bg-[#fff0d4]"><UsersRound size={16} />Refer to coordinating desk<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button> : null}
                {statusCode !== "CLOSED" ? <button type="button" onClick={() => openAction("record", "Record an action")} className="flex w-full items-center gap-3 rounded-xl border border-[#bee8e3] bg-[#effaf8] px-3 py-3 text-left text-[11px] font-bold text-[#137b74] transition hover:bg-[#dcf5f1]"><Gavel size={15} />Add review note<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button> : null}
                {(["VERIFIED", "RESOLVED", "CLOSED"].includes(statusCode) && !confirmedViolation) ? (
                  <button type="button" onClick={() => { setViolationCategory(incident.category); setViolationDescription(""); setViolationRemarks(""); setViolationDialogOpen(true); }} className="flex w-full items-center gap-3 rounded-xl border border-[#f1c4c4] bg-[#fff3f3] px-3 py-3 text-left text-[12px] font-bold text-[#b33b3b] transition hover:bg-[#ffe8e8]"><ShieldAlert size={16} />Record confirmed violation<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button>
                ) : null}
                <div className="my-1 border-t border-[#e8eef4]" />
                {["UNDER_REVIEW", "VERIFIED", "REFERRED"].includes(statusCode) ? <button type="button" onClick={() => openAction("resolve", "Mark as resolved")} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[12px] font-bold transition border-[#c4ead9] bg-[#ecfaf3] text-[#20885d] hover:bg-[#dcf5ea]"><CheckCircle2 size={16} />Mark resolved<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button> : null}
                {statusCode !== "CLOSED" ? <button type="button" onClick={() => openAction("close", "Close report")} className="flex w-full items-center gap-3 rounded-xl border border-[#d7dde4] bg-[#f3f5f7] px-3 py-2.5 text-left text-[11px] font-bold text-[#58687a] transition hover:bg-[#e9edf1]"><Check size={15} />Close report<span className="ml-auto opacity-60"><ChevronRight size={14} /></span></button> : null}
              </div>
              <p className="mt-4 text-[10px] leading-4 text-[#8a9bae]">A confirmed violation is added to the driver’s Violation records after saving.</p>
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
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8ca0b6]">Confirm review action</p>
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
              <button type="button" onClick={() => setDialog(null)} disabled={isSaving} className="rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#6e8299] hover:bg-[#f4f7fb] disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
              <button type="button" onClick={confirmAction} disabled={isSaving} className="rounded-xl bg-[#0c5bce] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_6px_14px_rgba(12,91,206,0.2)] transition hover:bg-[#094da9] disabled:cursor-wait disabled:opacity-70">{isSaving ? "Saving…" : dialogCopy[dialog.action].button}</button>
            </div>
          </div>
        </div>
      ) : null}
      {violationDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17304b]/35 px-4 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="violation-dialog-title" className="w-full max-w-[520px] rounded-[24px] border border-[#f1c4c4] bg-white p-5 shadow-[0_24px_80px_rgba(16,45,78,0.22)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b33b3b]">Confirmed finding</p>
                <h2 id="violation-dialog-title" className="mt-2 text-[20px] font-extrabold tracking-[-0.03em] text-[#183657]">Confirm violation</h2>
              </div>
              <button type="button" onClick={() => setViolationDialogOpen(false)} disabled={isSavingViolation} className="rounded-xl p-2 text-[#8092a6] hover:bg-[#f2f6fa] disabled:opacity-50" aria-label="Close violation dialog"><X size={18} /></button>
            </div>
            <p className="mt-4 text-[13px] leading-6 text-[#60768f]">Use this only after the report has reached verification, resolution, or closure. The finding will be written to the violation record.</p>
            <label className="mt-5 block"><span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8295aa]">Violation category</span><input value={violationCategory} onChange={(event) => setViolationCategory(event.target.value)} placeholder="e.g. Passenger capacity" className="mt-2 w-full rounded-xl border border-[#dbe5f0] bg-[#fbfdff] px-3 py-3 text-[12px] text-[#294765] outline-none focus:border-[#e88989] focus:ring-4 focus:ring-[#fff0f0]" /></label>
            <label className="mt-4 block"><span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8295aa]">Finding description</span><textarea value={violationDescription} onChange={(event) => setViolationDescription(event.target.value)} rows={4} placeholder="Describe the confirmed violation" className="mt-2 w-full resize-none rounded-xl border border-[#dbe5f0] bg-[#fbfdff] px-3 py-3 text-[12px] leading-5 text-[#294765] outline-none focus:border-[#e88989] focus:ring-4 focus:ring-[#fff0f0]" /></label>
            <label className="mt-4 block"><span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8295aa]">Remarks <span className="font-semibold normal-case tracking-normal text-[#a2afbd]">(optional)</span></span><textarea value={violationRemarks} onChange={(event) => setViolationRemarks(event.target.value)} rows={3} placeholder="Add supporting context" className="mt-2 w-full resize-none rounded-xl border border-[#dbe5f0] bg-[#fbfdff] px-3 py-3 text-[12px] leading-5 text-[#294765] outline-none focus:border-[#e88989] focus:ring-4 focus:ring-[#fff0f0]" /></label>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setViolationDialogOpen(false)} disabled={isSavingViolation} className="rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#6e8299] hover:bg-[#f4f7fb] disabled:opacity-50">Cancel</button><button type="button" onClick={confirmViolation} disabled={isSavingViolation || !violationCategory.trim() || !violationDescription.trim()} className="rounded-xl bg-[#b33b3b] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_6px_14px_rgba(179,59,59,0.2)] transition hover:bg-[#952f2f] disabled:cursor-not-allowed disabled:opacity-60">{isSavingViolation ? "Saving…" : "Confirm violation"}</button></div>
          </div>
        </div>
      ) : null}
      {evidencePreview ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#102943]/65 px-4 py-6 backdrop-blur-sm" onClick={() => setEvidencePreview(null)}>
          <div role="dialog" aria-modal="true" aria-label={`Evidence preview: ${evidencePreview.name}`} onClick={(event) => event.stopPropagation()} className="flex max-h-[90vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl border border-[#dbe5f0] bg-white shadow-[0_24px_90px_rgba(10,35,64,0.3)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#e5edf4] px-4 py-3">
              <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8ca0b6]">Report evidence</p><p className="truncate text-[13px] font-extrabold text-[#294765]">{evidencePreview.name}</p></div>
              <button type="button" onClick={() => setEvidencePreview(null)} className="rounded-lg p-2 text-[#8092a6] hover:bg-[#f2f6fa]" aria-label="Close evidence preview"><X size={18} /></button>
            </div>
            <div className="flex min-h-[300px] items-center justify-center overflow-auto bg-[#f5f8fc] p-4">
              {evidencePreview.type.startsWith("image/") ? <img src={evidencePreview.url} alt={evidencePreview.name} className="max-h-[72vh] max-w-full rounded-lg object-contain" /> : evidencePreview.type === "application/pdf" || evidencePreview.type.startsWith("text/") ? <iframe src={evidencePreview.url} title={evidencePreview.name} className="h-[72vh] w-full rounded-lg border border-[#dbe5f0] bg-white" /> : <div className="text-center"><FileText size={36} className="mx-auto text-[#7390ae]" /><p className="mt-3 text-[12px] font-semibold text-[#526d86]">Preview is not available for this file type.</p><a href={evidencePreview.url} download={evidencePreview.name} className="mt-4 inline-flex rounded-lg bg-[#0c5bce] px-4 py-2 text-[11px] font-bold text-white">Download evidence</a></div>}
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}

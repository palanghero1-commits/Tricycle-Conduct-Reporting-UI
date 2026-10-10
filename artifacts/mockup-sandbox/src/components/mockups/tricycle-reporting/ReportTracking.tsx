import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Clock3, FileText, MapPin, Paperclip, ShieldCheck, X } from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { apiRequest, fetchAttachment, formatPhilippineDateTime } from "../../../lib/api";

type ReportDetails = {
  complaint: Record<string, any>;
  category?: Record<string, any> | null;
  history?: Array<Record<string, any>>;
  actions?: Array<Record<string, any>>;
  attachments?: Array<{ id: string; originalName: string; mimeType: string; sizeBytes: number }>;
  violation?: Record<string, any> | null;
};

function value(record: Record<string, any>, camel: string, snake?: string) {
  return record[camel] ?? (snake ? record[snake] : undefined);
}

function statusLabel(status: unknown) {
  return String(status ?? "SUBMITTED").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ReportTracking() {
  const [details, setDetails] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ name: string; type: string; url: string } | null>(null);
  const [openingId, setOpeningId] = useState("");

  useEffect(() => {
    let active = true;
    let refreshing = false;
    const reference = new URLSearchParams(window.location.search).get("reference");
    const refresh = async () => {
      if (!active || refreshing || document.visibilityState !== "visible") return;
      refreshing = true;
      try {
        const { complaints } = await apiRequest<{ complaints: Array<Record<string, any>> }>("/complaints");
        const complaint = reference
          ? complaints.find((item) => value(item, "referenceNumber", "reference_number") === reference)
          : complaints[0];
        if (!complaint) {
          if (active) {
            setDetails(null);
            setError(reference ? "That report was not found in your account." : "You have not submitted a report yet.");
          }
          return;
        }
        const loaded = await apiRequest<ReportDetails>(`/complaints/${complaint.id}`);
        if (!active) return;
        setDetails(loaded);
        setError("");
      } catch (cause) {
        if (active && !details) setError(cause instanceof Error ? cause.message : "Unable to load this report.");
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

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  const complaint = details?.complaint;
  const reference = complaint ? value(complaint, "referenceNumber", "reference_number") : "";
  const status = complaint ? statusLabel(complaint.status) : "";
  const history = [
    ...(details?.history ?? []).map((item) => ({
      date: value(item, "createdAt", "created_at"),
      title: statusLabel(value(item, "newStatus", "new_status") ?? "Status recorded"),
      body: item.remarks || "Report status updated by the review team.",
    })),
    ...(details?.actions ?? []).map((item) => ({
      date: value(item, "createdAt", "created_at"),
      title: statusLabel(value(item, "actionType", "action_type") ?? "Review action"),
      body: item.description || "An action was recorded by the review team.",
    })),
  ].filter((item) => item.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const openEvidence = async (item: NonNullable<ReportDetails["attachments"]>[number]) => {
    setOpeningId(item.id);
    try {
      const blob = await fetchAttachment(item.id);
      setPreview({ name: item.originalName, type: item.mimeType, url: URL.createObjectURL(blob) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open this evidence file.");
    } finally {
      setOpeningId("");
    }
  };

  return (
    <AppLayout active="My reports" title="Report tracking" eyebrow="My reports / Tracking">
      <div className="mx-auto max-w-[1100px] space-y-5">
        <button type="button" onClick={() => { window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/MyReports`; }} className="inline-flex items-center gap-2 text-[12px] font-bold text-[#66809d] hover:text-[#0c5bce]"><ArrowLeft size={15} />Back to my reports</button>
        {loading && !details ? <section className="rounded-2xl border border-[#dbe5f0] bg-white p-10 text-center text-[12px] font-semibold text-[#71859e]">Loading your report…</section> : error && !details ? <section role="alert" className="rounded-2xl border border-[#f0d8c6] bg-[#fff8f1] p-8 text-center text-[12px] font-semibold text-[#927258]">{error}</section> : complaint ? <>
          <section className="rounded-[24px] border border-[#d8e6f1] bg-[#eaf6f7] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#2a8d8e]">Report reference</p><h1 className="mt-2 font-mono text-[24px] font-extrabold text-[#14385d]">{reference}</h1><p className="mt-2 max-w-[620px] text-[12px] leading-5 text-[#59758f]">Your report is an account of an experience submitted for review. It is not, by itself, a confirmed violation.</p></div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#edcc8c] bg-[#fff9ed] px-3.5 py-2 text-[11px] font-extrabold text-[#79531d]"><Clock3 size={14} />{status}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 border-t border-[#cfe5e9] pt-5 text-[11px] font-semibold text-[#49647f]"><span className="inline-flex items-center gap-2"><CalendarDays size={14} />Incident {formatPhilippineDateTime(value(complaint, "incidentDate", "incident_date"))}</span><span>Updated {formatPhilippineDateTime(value(complaint, "updatedAt", "updated_at") || value(complaint, "createdAt", "created_at"))}</span></div>
          </section>

          <div className="grid items-start gap-5 lg:grid-cols-2">
            <section className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 sm:p-7"><div className="flex items-center gap-3"><FileText size={18} className="text-[#0c5bce]" /><h2 className="text-[15px] font-extrabold text-[#183657]">Your report</h2></div><dl className="mt-5 space-y-4 text-[12px]"><div><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8ca0b6]">Category</dt><dd className="mt-1 font-bold text-[#294765]">{details.category?.name ?? "Uncategorized"}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8ca0b6]">Incident location</dt><dd className="mt-1 flex items-start gap-1.5 font-semibold text-[#294765]"><MapPin size={14} className="mt-0.5 shrink-0 text-[#0c5bce]" />{complaint.location || "Not provided"}</dd>{complaint.latitude != null && complaint.longitude != null ? <dd className="mt-1 pl-5 font-mono text-[10px] text-[#627b94]">{Number(complaint.latitude).toFixed(6)}, {Number(complaint.longitude).toFixed(6)}</dd> : null}</div><div><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8ca0b6]">Your statement</dt><dd className="mt-1 whitespace-pre-wrap leading-5 text-[#526d86]">{complaint.description}</dd></div></dl></section>

            <section className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 sm:p-7"><div className="flex items-center gap-3"><Clock3 size={18} className="text-[#0c5bce]" /><h2 className="text-[15px] font-extrabold text-[#183657]">Review history</h2></div>{history.length ? <ol className="mt-5 space-y-4">{history.map((item, index) => <li key={`${item.date}-${index}`} className="flex gap-3"><span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[#0c5bce]"><Check size={13} /></span><div><p className="text-[12px] font-extrabold text-[#294765]">{item.title}</p><p className="mt-1 text-[11px] leading-5 text-[#71859e]">{item.body}</p><p className="mt-1 text-[10px] font-semibold text-[#91a0b1]">{formatPhilippineDateTime(item.date)}</p></div></li>)}</ol> : <p className="mt-5 text-[11px] text-[#8295aa]">No review updates have been recorded yet.</p>}{details.violation ? <p className="mt-5 rounded-xl border border-[#ead0d0] bg-[#fff6f6] p-3 text-[11px] font-semibold text-[#963d3d]">A confirmed violation has been recorded after review.</p> : null}</section>
          </div>

          <section className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 sm:p-7"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Paperclip size={18} className="text-[#0c5bce]" /><h2 className="text-[15px] font-extrabold text-[#183657]">Submitted evidence</h2></div><span className="text-[10px] font-bold text-[#8295aa]">{details.attachments?.length ?? 0} files</span></div>{details.attachments?.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{details.attachments.map((item) => <button key={item.id} type="button" onClick={() => void openEvidence(item)} disabled={openingId === item.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#e2e9f1] bg-[#fbfdff] p-3 text-left hover:border-[#bcd3f5] disabled:opacity-60"><span className="min-w-0"><span className="block truncate text-[11px] font-bold text-[#294765]">{item.originalName}</span><span className="mt-1 block text-[10px] text-[#8295aa]">{Math.round(item.sizeBytes / 1024)} KB</span></span><span className="shrink-0 text-[10px] font-extrabold text-[#0c5bce]">{openingId === item.id ? "Opening…" : "View"}</span></button>)}</div> : <p className="mt-4 text-[11px] text-[#8295aa]">No files were attached to this report.</p>}</section>
          {error ? <p role="status" className="rounded-xl bg-[#fff8f1] px-4 py-3 text-[11px] font-semibold text-[#927258]">{error}</p> : null}
        </> : null}
      </div>
      {preview ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102943]/65 p-4" onClick={() => setPreview(null)}><div role="dialog" aria-modal="true" aria-label={`Evidence preview: ${preview.name}`} onClick={(event) => event.stopPropagation()} className="flex max-h-[90vh] w-full max-w-[950px] flex-col overflow-hidden rounded-2xl bg-white"><div className="flex items-center justify-between gap-3 border-b p-4"><p className="truncate text-[12px] font-extrabold text-[#294765]">{preview.name}</p><button type="button" onClick={() => setPreview(null)} aria-label="Close preview"><X size={18} /></button></div><div className="flex min-h-[300px] items-center justify-center overflow-auto bg-[#f5f8fc] p-4">{preview.type.startsWith("image/") ? <img src={preview.url} alt={preview.name} className="max-h-[72vh] max-w-full object-contain" /> : preview.type === "application/pdf" || preview.type.startsWith("text/") ? <iframe title={preview.name} src={preview.url} className="h-[72vh] w-full bg-white" /> : <div className="text-center text-[12px] text-[#526d86]">Preview is not supported for this file type.<a className="ml-2 font-bold text-[#0c5bce]" href={preview.url} download={preview.name}>Download</a></div>}</div></div></div> : null}
    </AppLayout>
  );
}

export default ReportTracking;

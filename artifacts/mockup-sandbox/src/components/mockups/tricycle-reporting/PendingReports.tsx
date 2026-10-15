import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CloudOff, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { deleteOfflineReport, listOfflineReports, listSubmittedOfflineReports, syncOfflineReports, type OfflineReport, type SubmittedOfflineReport } from "../../../lib/offlineReports";

export function PendingReports() {
  const [reports, setReports] = useState<OfflineReport[]>([]);
  const [submittedReports, setSubmittedReports] = useState<SubmittedOfflineReport[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const syncing = useRef(false);
  const load = async () => {
    try {
      const [saved, submitted] = await Promise.all([listOfflineReports(), listSubmittedOfflineReports()]);
      setReports(saved);
      setSubmittedReports(submitted);
      return saved;
    } catch {
      setNotice("Offline storage is unavailable in this browser.");
      return [];
    }
  };
  const sync = async (automatic = false) => {
    if (syncing.current) return;
    syncing.current = true;
    setBusy(true);
    setNotice(automatic ? "Connection detected. Sending saved reports…" : "Sending saved reports…");
    try {
      const result = await syncOfflineReports();
      await load();
      const failed = result.filter((item) => !item.ok);
      setNotice(failed.length
        ? `${failed.length} report${failed.length === 1 ? " is" : "s are"} still saved on this device. Review the upload reason and retry when the connection is ready.`
        : result.length ? "Pending reports uploaded successfully." : "No pending reports to send.");
    } catch (error) {
      await load();
      setNotice(error instanceof Error ? `Reports remain saved on this device. ${error.message}` : "Reports remain saved on this device. Try syncing again when connected.");
    } finally {
      syncing.current = false;
      setBusy(false);
    }
  };
  const syncRef = useRef(sync);
  syncRef.current = sync;
  useEffect(() => {
    const resumeSync = () => { void syncRef.current(true); };
    window.addEventListener("online", resumeSync);
    void load().then((saved) => {
      if (saved.length && navigator.onLine) resumeSync();
    });
    return () => window.removeEventListener("online", resumeSync);
  }, []);
  const remove = async (id: string) => { if (!window.confirm("Delete this saved report from this device?")) return; await deleteOfflineReport(id); await load(); };
  return <AppLayout active="Pending reports" title="Pending reports" eyebrow="Saved on this device">
    <div className="mx-auto max-w-[820px] py-5 lg:py-10">
      <section className="rounded-[26px] border border-[#dbe5f0] bg-white p-5 shadow-[0_14px_40px_rgba(38,76,114,0.08)] sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff5df] text-[#b47718]"><CloudOff size={21} /></div>
            <div><h1 className="text-[20px] font-extrabold text-[#17375d]">Saved report queue</h1><p className="mt-1 text-[11px] text-[#71869b]">Reports stay on this device until the server confirms they were received.</p></div>
          </div>
          <button type="button" onClick={() => void sync()} disabled={busy || !reports.length} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0c5bce] px-4 py-2.5 text-[11px] font-extrabold text-white disabled:opacity-50 sm:w-auto"><RefreshCw size={14} className={busy ? "animate-spin" : ""} />{busy ? "Sending…" : "Send pending reports"}</button>
        </div>
        <p className="mt-3 text-[10px] leading-4 text-[#8295a9]">Saved reports send automatically when your device reconnects. You can also tap the button to retry if the browser does not detect the connection.</p>
        <div className="mt-6 space-y-3">
          {reports.map((report) => <div key={report.localReportId} className="rounded-2xl border border-[#e1eaf2] bg-[#fbfdff] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-extrabold text-[#294765]">{report.location || "Location not entered"}</p>
                <p className="mt-1 text-[10px] text-[#71869b]">Saved {new Date(report.savedAt).toLocaleString()} · {report.attachments.length} attachment{report.attachments.length === 1 ? "" : "s"}</p>
                <p className="mt-1 text-[10px] font-bold text-[#b47718]">{report.status}</p>
                {report.lastError ? <p className="mt-2 break-words rounded-lg bg-[#fff4f1] px-2.5 py-2 text-[10px] font-semibold leading-4 text-[#a34d43]">Upload reason: {report.lastError}</p> : null}
              </div>
              <button type="button" onClick={() => void remove(report.localReportId)} className="shrink-0 rounded-lg p-2 text-[#a46666] hover:bg-[#fff1ef]" aria-label="Delete saved report"><Trash2 size={15} /></button>
            </div>
          </div>)}
          {!reports.length ? <div className="rounded-2xl bg-[#f7f9fc] p-8 text-center"><CheckCircle2 size={24} className="mx-auto text-[#4f8b72]" /><p className="mt-3 text-[12px] font-bold text-[#4a667e]">No pending reports</p><p className="mt-1 text-[11px] text-[#8295a9]">New reports saved without internet will appear here.</p></div> : null}
        </div>
        {submittedReports.length ? <div className="mt-7 border-t border-[#e7edf3] pt-5">
          <h2 className="text-[13px] font-extrabold text-[#294765]">Recently synced reports</h2>
          <p className="mt-1 text-[10px] text-[#71869b]">The server accepted these reports. Their tracking numbers are ready to use online.</p>
          <div className="mt-3 space-y-2">{submittedReports.slice(0, 10).map((report) => <div key={report.localReportId} className="flex flex-col gap-3 rounded-xl border border-[#dcebe4] bg-[#f7fcf9] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#4b886f]">Submitted · {new Date(report.submittedAt).toLocaleString()}</p><p className="mt-1 font-mono text-[13px] font-extrabold tracking-[0.06em] text-[#214c69]">{report.trackingNumber}</p></div>
            <button type="button" onClick={() => { window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/Landing?track=${encodeURIComponent(report.trackingNumber)}`; }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#bdd8ca] bg-white px-3 py-2 text-[10px] font-extrabold text-[#287451]">Track online <UploadCloud size={13} /></button>
          </div>)}</div>
        </div> : null}
        {notice ? <p role="status" className="mt-5 break-words rounded-xl bg-[#f7f9fc] px-4 py-3 text-center text-[11px] font-semibold text-[#58718a]">{notice}</p> : null}
      </section>
    </div>
  </AppLayout>;
}

export default PendingReports;

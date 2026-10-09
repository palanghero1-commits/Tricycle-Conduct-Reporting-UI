import { useEffect, useState } from "react";
import { CheckCircle2, CloudOff, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { deleteOfflineReport, listOfflineReports, syncOfflineReports, type OfflineReport } from "../../../lib/offlineReports";

export function PendingReports() {
  const [reports, setReports] = useState<OfflineReport[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = () => listOfflineReports().then(setReports).catch(() => setNotice("Offline storage is unavailable in this browser."));
  useEffect(() => { void load(); }, []);
  const sync = async () => {
    if (!navigator.onLine) { setNotice("Reconnect to the internet before syncing."); return; }
    setBusy(true); setNotice("Uploading pending reports…");
    const result = await syncOfflineReports();
    await load();
    setNotice(result.some((item) => !item.ok) ? "Some reports could not be uploaded. They remain saved for retry." : "Pending reports uploaded successfully.");
    setBusy(false);
  };
  const remove = async (id: string) => { if (!window.confirm("Delete this saved report from this device?")) return; await deleteOfflineReport(id); await load(); };
  return <AppLayout active="Pending reports" title="Pending reports" eyebrow="Saved on this device"><div className="mx-auto max-w-[820px] py-5 lg:py-10"><section className="rounded-[26px] border border-[#dbe5f0] bg-white p-6 shadow-[0_14px_40px_rgba(38,76,114,0.08)]"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff5df] text-[#b47718]"><CloudOff size={21} /></div><div><h1 className="text-[20px] font-extrabold text-[#17375d]">Offline report queue</h1><p className="mt-1 text-[11px] text-[#71869b]">Reports stay on this device until they are submitted.</p></div></div><button type="button" onClick={() => void sync()} disabled={busy || !reports.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0c5bce] px-4 py-2.5 text-[11px] font-extrabold text-white disabled:opacity-50"><RefreshCw size={14} className={busy ? "animate-spin" : ""} />{busy ? "Syncing…" : "Sync pending reports"}</button></div><div className="mt-6 space-y-3">{reports.map((report) => <div key={report.localReportId} className="rounded-2xl border border-[#e1eaf2] bg-[#fbfdff] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[12px] font-extrabold text-[#294765]">{report.location || "Location not entered"}</p><p className="mt-1 text-[10px] text-[#71869b]">Saved {new Date(report.savedAt).toLocaleString()} · {report.attachments.length} attachment{report.attachments.length === 1 ? "" : "s"}</p><p className="mt-1 text-[10px] font-bold text-[#b47718]">{report.status}</p>{report.lastError ? <p className="mt-2 rounded-lg bg-[#fff4f1] px-2.5 py-2 text-[10px] font-semibold leading-4 text-[#a34d43]">Upload reason: {report.lastError}</p> : null}</div><button type="button" onClick={() => void remove(report.localReportId)} className="rounded-lg p-2 text-[#a46666] hover:bg-[#fff1ef]" aria-label="Delete saved report"><Trash2 size={15} /></button></div></div>)}{!reports.length ? <div className="rounded-2xl bg-[#f7f9fc] p-8 text-center"><CheckCircle2 size={24} className="mx-auto text-[#4f8b72]" /><p className="mt-3 text-[12px] font-bold text-[#4a667e]">No pending reports</p><p className="mt-1 text-[11px] text-[#8295a9]">New reports saved without internet will appear here.</p></div> : null}</div>{notice ? <p className="mt-5 rounded-xl bg-[#f7f9fc] px-4 py-3 text-center text-[11px] font-semibold text-[#58718a]">{notice}</p> : null}</section></div></AppLayout>;
}

export default PendingReports;

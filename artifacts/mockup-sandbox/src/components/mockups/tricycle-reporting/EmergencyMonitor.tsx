import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, MapPin, RefreshCw, Siren } from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { apiRequest } from "../../../lib/api";

type Alert = { id: string; studentName: string; driverName: string; driverCode: string | null; plateNumber: string | null; routeArea: string | null; contactNumber: string | null; todaName: string | null; tricycleIdentifier: string; latitude: number | string; longitude: number | string; locationAccuracyMeters: number | string | null; startedAt: string; lastSeenAt: string };

export function EmergencyMonitor() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const alarmedIds = useRef(new Set<string>());
  const alarmTimer = useRef<number | null>(null);
  const alarmContext = useRef<AudioContext | null>(null);
  const selected = alerts.find((alert) => alert.id === selectedId) ?? alerts[0];

  const playAlarmTone = (context: AudioContext) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.35;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.35);
  };

  const startAlarmLoop = () => {
    if (alarmTimer.current !== null) return;
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = alarmContext.current ?? new AudioContextClass();
      alarmContext.current = context;
      void context.resume().catch(() => undefined);
      playAlarmTone(context);
      alarmTimer.current = window.setInterval(() => {
        playAlarmTone(context);
        if ("vibrate" in navigator) navigator.vibrate?.([180, 100, 180]);
      }, 900);
    } catch { /* Browser autoplay policy may block the optional sound. */ }
    if ("vibrate" in navigator) navigator.vibrate?.([180, 100, 180]);
  };

  const stopAlarmLoop = () => {
    if (alarmTimer.current !== null) window.clearInterval(alarmTimer.current);
    alarmTimer.current = null;
    if (alarmContext.current) {
      void alarmContext.current.close().catch(() => undefined);
      alarmContext.current = null;
    }
  };

  const load = () => apiRequest<{ alerts: Alert[] }>("/sos/active").then(({ alerts: active }) => {
    if (active.length) startAlarmLoop(); else stopAlarmLoop();
    active.forEach((alert) => alarmedIds.current.add(alert.id));
    setAlerts(active);
    if (active[0] && !selectedId) setSelectedId(active[0].id);
  }).catch(() => setNotice("Unable to connect to the local emergency monitor."));

  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 3000); return () => { window.clearInterval(timer); stopAlarmLoop(); }; }, []);

  const resolve = async (id: string) => {
    try { await apiRequest(`/sos/${id}/resolve`, { method: "POST" }); setNotice("Emergency alert resolved."); await load(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Unable to resolve the alert."); }
  };

  const mapEmbedUrl = useMemo(() => selected ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(selected.longitude) - 0.005}%2C${Number(selected.latitude) - 0.005}%2C${Number(selected.longitude) + 0.005}%2C${Number(selected.latitude) + 0.005}&layer=mapnik&marker=${selected.latitude}%2C${selected.longitude}` : null, [selected]);

  return (
    <AppLayout officer active="Emergency SOS" title="Emergency monitor" eyebrow="Authorized response center">
      <div className="space-y-5 py-3 lg:py-7">
        {alerts.length ? <div className="flex items-center gap-3 rounded-2xl border border-[#efb4ad] bg-[#fff1ef] px-4 py-3 text-[#9f3329] shadow-[0_8px_24px_rgba(192,57,43,0.12)]"><Siren size={20} className="animate-pulse" /><div><p className="text-[13px] font-extrabold">EMERGENCY ALERT ACTIVE</p><p className="text-[11px]">{alerts.length} student alert{alerts.length === 1 ? "" : "s"} require immediate attention.</p></div><button type="button" onClick={() => void load()} className="ml-auto rounded-lg p-2 hover:bg-[#ffe3df]" aria-label="Refresh alerts"><RefreshCw size={15} /></button></div> : <div className="flex items-center gap-3 rounded-2xl border border-[#cce4d7] bg-[#f0f8f3] px-4 py-3 text-[#3f7d5d]"><CheckCircle2 size={19} /><p className="text-[12px] font-bold">No active emergency alerts.</p></div>}
        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.45fr]">
          <div className="rounded-2xl border border-[#d9e3ec] bg-white shadow-[0_5px_20px_rgba(39,67,93,0.04)]"><div className="border-b border-[#edf1f5] px-5 py-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#94a5b5]">Active alerts</p></div><div className="divide-y divide-[#edf1f5]">{alerts.map((alert) => <button key={alert.id} type="button" onClick={() => setSelectedId(alert.id)} className={`w-full p-4 text-left hover:bg-[#fff8f7] ${selected?.id === alert.id ? "border-l-4 border-[#c0392b] bg-[#fff5f3]" : ""}`}><p className="text-[12px] font-extrabold text-[#91352d]">{alert.studentName}</p><p className="mt-1 text-[11px] text-[#5e748a]">Driver: {alert.driverName}</p><p className="mt-1 font-mono text-[10px] text-[#8295a9]">{alert.tricycleIdentifier}</p></button>)}{!alerts.length ? <p className="p-6 text-center text-[11px] text-[#8295a9]">Waiting for SOS alerts…</p> : null}</div></div>
          <div className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">{selected && mapEmbedUrl ? <><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#c0392b]">Live GPS tracking</p><h2 className="mt-1 text-[18px] font-extrabold text-[#1a3856]">{selected.studentName}</h2><p className="mt-1 text-[11px] text-[#71859c]">Driver: {selected.driverName} · {selected.tricycleIdentifier}</p></div><button type="button" onClick={() => void resolve(selected.id)} className="rounded-lg bg-[#2f8060] px-3 py-2 text-[10px] font-extrabold text-white hover:bg-[#276b50]">Resolve SOS</button></div><div className="mt-4 grid gap-2 rounded-xl bg-[#f7f9fc] p-4 text-[11px] text-[#58718a] sm:grid-cols-2"><p><strong className="text-[#23405f]">Driver code:</strong> {selected.driverCode || "Not provided"}</p><p><strong className="text-[#23405f]">Plate:</strong> {selected.plateNumber || "Not provided"}</p><p><strong className="text-[#23405f]">Contact:</strong> {selected.contactNumber || "Not provided"}</p><p><strong className="text-[#23405f]">Route/TODA:</strong> {selected.routeArea || "Not provided"} / {selected.todaName || "Not provided"}</p></div><iframe title="Live emergency location map" src={mapEmbedUrl} className="mt-4 h-[360px] w-full rounded-xl border border-[#dbe5ef]" loading="lazy" /><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#6e849b]"><span className="font-mono">{Number(selected.latitude).toFixed(6)}, {Number(selected.longitude).toFixed(6)} · ±{Math.round(Number(selected.locationAccuracyMeters || 0))} m</span><a href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-extrabold text-[#0c5bce]"><ExternalLink size={12} />Open in Google Maps</a></div></> : <div className="flex h-full min-h-[360px] items-center justify-center rounded-xl bg-[#f7f9fc] text-center text-[12px] text-[#8295a9]">Select an active alert to view its live map.</div>}</div>
        </section>
        {notice ? <p className="rounded-xl bg-[#f7f9fc] px-4 py-3 text-center text-[11px] font-semibold text-[#58718a]">{notice}</p> : null}
      </div>
    </AppLayout>
  );
}

export default EmergencyMonitor;

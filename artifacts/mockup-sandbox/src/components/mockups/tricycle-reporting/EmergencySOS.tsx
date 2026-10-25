import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { AlertTriangle, CheckCircle2, MapPin, Phone, ShieldCheck, Siren } from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { apiRequest, getCurrentUser } from "../../../lib/api";
import { cacheStudentOfflineData } from "../../../lib/offlineAccount";
import { clearPendingSosAlert, clearRegisteredSosIdentity, createSosDeviceId, getConfiguredSosSmsNumber, getPendingSosAlert, getRegisteredSosIdentity, openSosSmsComposer, savePendingSosAlert, saveRegisteredSosIdentity, type PendingSosAlert, type RegisteredSosIdentity } from "../../../lib/sosDevice";

type Location = { latitude: number; longitude: number; accuracy: number | null };
const newId = createSosDeviceId;

export function EmergencySOS() {
  const user = getCurrentUser();
  const isStudent = user?.role === "STUDENT";
  const [identity, setIdentity] = useState<RegisteredSosIdentity | null>(null);
  const [pending, setPending] = useState<PendingSosAlert | null>(null);
  const [activeAlert, setActiveAlert] = useState<{ id: string; status: string } | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [smsComposerOpened, setSmsComposerOpened] = useState(false);
  const syncedPendingId = useRef("");
  const [error, setError] = useState("");
  const smsNumber = getConfiguredSosSmsNumber();
  const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const setupMode = new URLSearchParams(window.location.search).get("setup") === "1";

  useEffect(() => {
    let alive = true;
    void Promise.all([getRegisteredSosIdentity(), getPendingSosAlert()]).then(([savedIdentity, savedPending]) => {
      if (!alive) return;
      setIdentity(savedIdentity); setPending(savedPending);
    }).catch(() => undefined);
    if (isStudent) void apiRequest<{ alert: { id: string; status: string } | null }>("/sos/mine").then((data) => { if (alive) setActiveAlert(data.alert); }).catch(() => undefined);
    return () => { alive = false; };
  }, [isStudent, isAndroid]);

  useEffect(() => {
    if (!isStudent || !pending?.smsConfirmed || !navigator.onLine || syncedPendingId.current === pending.alertId) return;
    syncedPendingId.current = pending.alertId;
    void apiRequest<{ alert: { id: string; status: string } }>("/sos/offline-sync", { method: "POST", body: JSON.stringify({ clientAlertId: pending.alertId, deviceId: pending.deviceId, createdAt: pending.createdAt, latitude: pending.latitude, longitude: pending.longitude, accuracy: pending.accuracy, smsConfirmed: true }) }).then(async ({ alert }) => {
      setActiveAlert(alert); await clearPendingSosAlert(); setPending(null); setNotice("Delayed SOS has been reported to authorized personnel.");
    }).catch(() => { syncedPendingId.current = ""; });
  }, [isStudent, pending]);

  const getLocation = async () => {
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== "granted" && permission.coarseLocation !== "granted") await Geolocation.requestPermissions();
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 });
      const value = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null };
      setLocation(value); return value;
    } catch { setLocation(null); return null; }
  };

  const registerPhone = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      if (!isAndroid) throw new Error("Phone registration for offline SOS is available in the Android app.");
      const deviceId = identity?.deviceId ?? newId();
      setNotice("Registering this phone and saving your offline data…");
      const [registrationResult, offlineResult] = await Promise.allSettled([
        apiRequest<RegisteredSosIdentity>("/sos/devices", { method: "POST", body: JSON.stringify({ deviceId, deviceLabel: "Android phone" }) }),
        cacheStudentOfflineData(user!),
      ]);
      if (registrationResult.status === "fulfilled") {
        const saved = { ...registrationResult.value, deviceId };
        await saveRegisteredSosIdentity(saved); setIdentity(saved);
      }
      try {
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== "granted" && permissions.coarseLocation !== "granted") await Geolocation.requestPermissions();
      } catch { /* SOS still works without GPS; the alert will show location unavailable. */ }
      const offlineFailures = offlineResult.status === "fulfilled" ? offlineResult.value.failed : ["offline storage"];
      if (registrationResult.status === "rejected" || offlineResult.status === "rejected" || !offlineResult.value?.complete) {
        const causes = [registrationResult.status === "rejected" ? "phone registration failed" : "", offlineFailures.length ? `offline data: ${offlineFailures.join(", ")}` : ""].filter(Boolean).join("; ");
        throw new Error(`Setup is incomplete (${causes}). Stay online and try again. Offline data preparation runs even if phone registration fails.`);
      }
      if (user) window.localStorage.setItem(`sos_offline_setup_complete:${user.id}`, "true");
      if (setupMode) {
        setNotice("Phone registered and offline data prepared. Opening your student dashboard…");
        window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/StudentDashboard`;
      } else setNotice("Phone registered and offline data prepared.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not register this phone."); }
    finally { setBusy(false); }
  };

  const prepareOfflineSms = async (alertId: string, loc: Location | null) => {
    if (!identity) throw new Error("Register this Android phone while online before using offline SOS.");
    if (!smsNumber) throw new Error("The emergency SMS destination is not configured. Your alert was not sent.");
    const createdAt = new Date().toISOString();
    const maps = loc ? `\nLocation: https://maps.google.com/?q=${loc.latitude},${loc.longitude}${loc.accuracy ? ` (±${Math.round(loc.accuracy)} m)` : ""}` : "\nLocation: unavailable";
    const message = `EMERGENCY SOS\nStudent: ${identity.fullName}\nStudent ID: ${identity.studentId}\nContact: ${identity.contactNumber || "Not provided"}\nTime: ${createdAt}${maps}${details.trim() ? `\nDetails: ${details.trim()}` : ""}\nAlert ID: ${alertId}`;
    const record: PendingSosAlert = { alertId, deviceId: identity.deviceId, createdAt, latitude: loc?.latitude ?? null, longitude: loc?.longitude ?? null, accuracy: loc?.accuracy ?? null, driverId: null, message, smsConfirmed: false };
    await savePendingSosAlert(record); setPending(record); await openSosSmsComposer(smsNumber, message); setSmsComposerOpened(true);
    setNotice("SMS composer opened. Tap Send in your messaging app. SOS is not sent until you send the text.");
  };

  const sendSos = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const loc = location ?? await getLocation();
      const clientAlertId = newId();
      if (!navigator.onLine || !isStudent) { await prepareOfflineSms(clientAlertId, loc); return; }
      try {
        const result = await apiRequest<{ alert: { id: string; status: string } }>("/sos", { method: "POST", body: JSON.stringify({ clientAlertId, deviceId: identity?.deviceId ?? null, latitude: loc?.latitude ?? null, longitude: loc?.longitude ?? null, accuracy: loc?.accuracy ?? null, details: details.trim() }) });
        setActiveAlert(result.alert); setNotice("Your SOS alert was delivered to the response system.");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unable to deliver SOS online.";
        if (/cannot reach|too long|network|fetch|failed to fetch|SOS is not enabled/i.test(message)) { await prepareOfflineSms(clientAlertId, loc); return; }
        throw e;
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not start SOS."); }
    finally { setBusy(false); }
  };

  const confirmSmsSent = async () => {
    if (!pending) return;
    setBusy(true); setError("");
    try {
      const confirmed = { ...pending, smsConfirmed: true }; await savePendingSosAlert(confirmed); setPending(confirmed);
      if (navigator.onLine && isStudent) {
        syncedPendingId.current = confirmed.alertId;
        const result = await apiRequest<{ alert: { id: string; status: string } }>("/sos/offline-sync", { method: "POST", body: JSON.stringify({ clientAlertId: confirmed.alertId, deviceId: confirmed.deviceId, createdAt: confirmed.createdAt, latitude: confirmed.latitude, longitude: confirmed.longitude, accuracy: confirmed.accuracy, smsConfirmed: true }) });
        setActiveAlert(result.alert); await clearRegisteredSosIdentity(); await clearPendingLocal();
        setNotice("Delayed SOS has been reported to authorized personnel.");
    } else setNotice("Marked as sent on this phone. It will be reported to authorized personnel when you sign in and reconnect.");
    } catch (e) { syncedPendingId.current = ""; setError(e instanceof Error ? e.message : "Could not record the SMS confirmation."); }
    finally { setBusy(false); }
  };

  const clearPendingLocal = async () => { await clearPendingSosAlert(); setPending(null); };
  const cancel = async () => { if (!activeAlert) return; setBusy(true); try { await apiRequest(`/sos/${activeAlert.id}/cancel`, { method: "POST" }); setActiveAlert(null); setNotice("SOS alert cancelled."); } catch (e) { setError(e instanceof Error ? e.message : "Could not cancel SOS."); } finally { setBusy(false); } };

  return <AppLayout active="Emergency SOS" title="Emergency SOS" eyebrow="Student emergency support">
    <main className="mx-auto max-w-2xl space-y-5 py-2">
      <section className="rounded-3xl border border-[#f0b9b4] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4"><div className="rounded-2xl bg-[#fff0ee] p-3 text-[#bd382e]"><Siren size={25} /></div><div><h2 className="text-xl font-extrabold text-[#163154]">Need urgent help?</h2><p className="mt-1 text-sm leading-6 text-[#647b92]">SOS shares your student identity and current phone location when available. Use it for an emergency.</p></div></div>
        {!setupMode ? activeAlert ? <div className="mt-6 rounded-2xl border border-[#efb4ad] bg-[#fff1ef] p-4"><p className="font-extrabold text-[#a5362d]">SOS alert is active</p><p className="mt-1 text-xs text-[#82524e]">Authorized personnel have received your alert. If you are safe, you can cancel it below.</p><button disabled={busy} onClick={() => void cancel()} className="mt-3 rounded-xl bg-[#93433c] px-4 py-2.5 text-xs font-bold text-white">Cancel alert</button></div> : <button disabled={busy || !!pending} onClick={() => void sendSos()} className="mt-7 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#c0392b] px-5 py-4 text-lg font-extrabold text-white shadow-[0_10px_25px_rgba(192,57,43,0.2)] hover:bg-[#a93226] disabled:opacity-60"><Siren size={22} />{pending ? "Resolve pending SOS below" : busy ? "Preparing SOS…" : "SEND SOS"}</button> : <div className="mt-6 rounded-2xl border border-[#d5e5f4] bg-[#f3f8ff] p-5"><p className="text-xs font-extrabold uppercase tracking-wide text-[#0c5bce]">One-time phone setup</p><h3 className="mt-2 text-base font-extrabold text-[#163154]">Register this phone and prepare offline access</h3><p className="mt-2 text-xs leading-5 text-[#647b92]">While you are online, we’ll register this Android phone to your student account and save your profile, drivers, report categories, reports, and notifications on this device.</p><button disabled={busy || !isStudent || !isAndroid || !navigator.onLine} onClick={() => void registerPhone()} className="mt-4 w-full rounded-xl bg-[#0c5bce] px-4 py-3.5 text-sm font-extrabold text-white disabled:opacity-50">{busy ? "Registering phone and preparing offline data…" : "Register phone & prepare offline"}</button><button type="button" disabled={busy} onClick={() => { if (user) window.localStorage.setItem(`sos_offline_setup_complete:${user.id}`, "skipped"); window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/StudentDashboard`; }} className="mt-3 w-full py-2 text-xs font-bold text-[#607993]">Do this later</button></div>}
        <label className="mt-5 block text-xs font-bold text-[#45617c]">Extra details (optional)<textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={2} maxLength={250} placeholder="What is happening or where should responders look?" className="mt-2 w-full rounded-xl border border-[#d9e3ec] p-3 text-sm outline-none focus:border-[#6799ce]" /></label>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#72869b]"><MapPin size={15} />{location ? `Location ready · ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : "Location will be requested when you send SOS; it may be unavailable indoors."}</div>
        {error ? <p role="alert" className="mt-4 rounded-xl bg-[#fff1ef] p-3 text-xs font-semibold text-[#a5362d]">{error}</p> : null}
        {notice ? <p role="status" className="mt-4 rounded-xl bg-[#eff8f3] p-3 text-xs font-semibold text-[#367354]">{notice}</p> : null}
      </section>
      <section className="rounded-2xl border border-[#d9e3ec] bg-white p-5">
        <div className="flex items-center gap-3"><ShieldCheck className="text-[#0c5bce]" size={20} /><div><h3 className="text-sm font-extrabold text-[#163154]">Offline SOS setup</h3><p className="mt-1 text-xs leading-5 text-[#71859c]">Register this Android phone while online. Offline SOS opens a prefilled SMS that you must send yourself.</p></div></div>
        {identity ? <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#f2f8f5] p-3"><p className="text-xs font-semibold text-[#3e7058]"><CheckCircle2 size={14} className="mr-1 inline" />Registered to {identity.fullName} · {identity.studentId}</p><button disabled={busy || !navigator.onLine} onClick={() => void (async () => { setBusy(true); try { await apiRequest(`/sos/devices/${identity.deviceId}`, { method: "DELETE" }); await clearRegisteredSosIdentity(); if (user) window.localStorage.removeItem(`sos_offline_setup_complete:${user.id}`); setIdentity(null); setNotice("Phone registration removed."); } catch (e) { setError(e instanceof Error ? e.message : "Could not unregister phone."); } finally { setBusy(false); } })()} className="text-[11px] font-bold text-[#a5362d]">Unregister</button></div> : !setupMode ? <button disabled={busy || !isStudent || !isAndroid || !navigator.onLine} onClick={() => void registerPhone()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#cbdbea] px-4 py-3 text-xs font-extrabold text-[#245c93] disabled:opacity-50"><Phone size={15} />Register this phone and prepare offline data</button> : null}
        {!isAndroid ? <p className="mt-3 text-[11px] text-[#8295a9]">Offline SMS and the app shortcut require the Android app.</p> : null}
        {pending ? <div className="mt-4 rounded-xl border border-[#f0d8aa] bg-[#fff8e9] p-4"><div className="flex gap-2 text-xs font-extrabold text-[#805d24]"><AlertTriangle size={15} />{pending.smsConfirmed ? "SMS marked sent, awaiting report sync" : "SOS SMS not confirmed as sent"}</div><p className="mt-2 text-[11px] leading-5 text-[#806e4c]">Alert {pending.alertId.slice(0, 8)} · {pending.latitude !== null ? `GPS ${pending.latitude.toFixed(5)}, ${pending.longitude?.toFixed(5)}` : "No GPS location"}</p>{!pending.smsConfirmed ? <div className="mt-3 flex flex-wrap gap-2"><button disabled={busy || !smsNumber} onClick={() => void openSosSmsComposer(smsNumber, pending.message).then(() => setSmsComposerOpened(true)).catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not open SMS."))} className="rounded-lg border border-[#cdbb8e] px-3 py-2 text-[11px] font-bold text-[#805d24] disabled:opacity-50">Open SMS again</button><button disabled={busy || !smsComposerOpened} onClick={() => void confirmSmsSent()} className="rounded-lg bg-[#8d691f] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">I sent this SMS</button></div> : null}</div> : null}
        {!smsNumber ? <p className="mt-3 text-[11px] font-semibold text-[#a5362d]">Emergency SMS destination is not configured.</p> : null}
      </section>
    </main>
  </AppLayout>;
}

export default EmergencySOS;

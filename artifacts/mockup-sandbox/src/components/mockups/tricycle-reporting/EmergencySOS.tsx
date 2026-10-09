import { useEffect, useRef, useState } from "react";
import { AlertTriangle, MapPin, ShieldAlert, Siren, UserRound } from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { apiRequest, getCurrentUser } from "../../../lib/api";

type Driver = { id: number; fullName: string; tricycleIdentifier: string; routeArea: string | null };
type ActiveAlert = { id: string; driverName: string; driverCode?: string | null; plateNumber?: string | null; routeArea?: string | null; contactNumber?: string | null; todaName?: string | null; tricycleIdentifier: string; status: "ACTIVE" | "CANCELLED" };

export function EmergencySOS() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState("");
  const [alert, setAlert] = useState<ActiveAlert | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (getCurrentUser()?.role !== "STUDENT") {
      window.location.replace(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/Profile`);
      return;
    }
    apiRequest<{ drivers: Driver[] }>("/drivers").then(({ drivers: available }) => setDrivers(available)).catch(() => setStatus("Unable to load registered drivers."));
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const sendLocation = (id: string, position: GeolocationPosition) => apiRequest(`/sos/${id}/location`, {
    method: "PATCH",
    body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
  });

  const startSOS = () => {
    if (!driverId) { setStatus("Select the driver or tricycle first."); return; }
    if (!navigator.geolocation) { setStatus("This device does not support GPS location."); return; }
    setBusy(true);
    setStatus("Getting your current location…");
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const result = await apiRequest<{ alert: ActiveAlert }>("/sos", {
          method: "POST",
          body: JSON.stringify({ driverId: Number(driverId), latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
        });
        setAlert(result.alert);
        setStatus("Emergency alert is active. Authorized Personnel can see your live location.");
        watchId.current = navigator.geolocation.watchPosition((nextPosition) => {
          void sendLocation(result.alert.id, nextPosition).catch(() => undefined);
        }, () => setStatus("Emergency is active, but the latest GPS update failed."), { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 });
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Unable to start the emergency alert.");
      } finally { setBusy(false); }
    }, () => { setStatus("Location permission is required to start an emergency alert."); setBusy(false); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  const stopSOS = async () => {
    if (!alert) return;
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    setBusy(true);
    try {
      await apiRequest(`/sos/${alert.id}/cancel`, { method: "POST" });
      setAlert(null);
      setStatus("Emergency alert cancelled.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to cancel the alert."); }
    finally { setBusy(false); }
  };

  return (
    <AppLayout active="Emergency SOS" title="Emergency SOS" eyebrow="Student safety">
      <div className="mx-auto max-w-[720px] py-4 lg:py-10">
        <section className={`rounded-[28px] border bg-white p-6 shadow-[0_18px_55px_rgba(38,76,114,0.10)] sm:p-9 ${alert ? "border-[#f0b7b0]" : "border-[#d7e5f1]"}`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${alert ? "bg-[#c0392b] text-white animate-pulse" : "bg-[#fff0ee] text-[#c0392b]"}`}><Siren size={28} /></div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#c0392b]">Emergency support</p>
              <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.04em] text-[#17375d]">{alert ? "SOS is active" : "Need immediate help?"}</h1>
              <p className="mt-2 text-[13px] leading-6 text-[#688099]">{alert ? "Your selected driver and your latest GPS location are being shared with authorized responders." : "Select the driver connected to your current trip before sending an emergency alert."}</p>
            </div>
          </div>

          {alert ? (
            <div className="mt-7 space-y-4">
              <div className="rounded-2xl border border-[#f0c6c0] bg-[#fff5f3] p-4 text-[#8f3229]">
                <div className="flex items-center gap-2 text-[12px] font-extrabold"><ShieldAlert size={17} /> Emergency alert sent</div>
                <p className="mt-2 text-[11px] leading-5">Authorized Personnel are monitoring your live GPS updates. Stay visible and contact emergency services if you are in immediate danger.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f7f9fc] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#91a2b4]">Selected driver</p><p className="mt-1.5 text-[13px] font-bold text-[#294765]">{alert.driverName}</p><p className="mt-1 text-[11px] text-[#71869b]">{alert.tricycleIdentifier} · {alert.contactNumber || "Contact not provided"}</p></div>
                <div className="rounded-xl bg-[#f7f9fc] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#91a2b4]">Tracking status</p><p className="mt-1.5 flex items-center gap-2 text-[13px] font-bold text-[#29805c]"><MapPin size={14} />Live GPS updates</p></div>
              </div>
              <button type="button" disabled={busy} onClick={() => void stopSOS()} className="w-full rounded-xl border border-[#d49b94] bg-white px-4 py-3 text-[12px] font-extrabold text-[#a23b32] hover:bg-[#fff5f3] disabled:opacity-60">{busy ? "Please wait…" : "Cancel emergency alert"}</button>
            </div>
          ) : (
            <div className="mt-7 space-y-5">
              <label className="block"><span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#49647e]"><UserRound size={15} />Driver or tricycle</span><select value={driverId} onChange={(event) => setDriverId(event.target.value)} className="h-12 w-full rounded-xl border border-[#dbe5f0] bg-white px-3 text-[12px] font-bold text-[#274563] outline-none focus:border-[#76a9e6]"><option value="">Select the driver connected to you</option>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.fullName} · {driver.tricycleIdentifier}</option>)}</select></label>
              <div className="rounded-2xl border border-[#f1dfbd] bg-[#fffaf0] p-4 text-[11px] leading-5 text-[#80662e]"><strong>Before pressing SOS:</strong> the app will request your current location and continue sending updates while the alert is active.</div>
              <button type="button" disabled={busy} onClick={startSOS} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c0392b] px-4 py-4 text-[14px] font-extrabold text-white shadow-[0_8px_20px_rgba(192,57,43,0.25)] hover:bg-[#a93226] disabled:cursor-wait disabled:opacity-60"><AlertTriangle size={19} />{busy ? "Starting emergency alert…" : "Press to send SOS"}</button>
            </div>
          )}
          {status ? <p className="mt-5 rounded-xl bg-[#f7f9fc] px-4 py-3 text-center text-[11px] font-semibold text-[#58718a]">{status}</p> : null}
          <p className="mt-6 text-center text-[10px] leading-4 text-[#9aabba]">Location sharing ends when the alert is cancelled or resolved by authorized personnel.</p>
        </section>
      </div>
    </AppLayout>
  );
}

export default EmergencySOS;

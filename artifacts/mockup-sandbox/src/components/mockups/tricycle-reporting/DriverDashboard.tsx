import { useEffect, useState } from "react";
import { Bell, CarFront, ChevronRight, FileCheck2, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { apiRequest, getCurrentUser } from "../../../lib/api";

type DriverProfile = {
  driverCode?: string;
  tricycleIdentifier?: string;
  routeArea?: string;
  todaName?: string;
  contactNumber?: string;
  plateNumber?: string;
};

function goTo(component: string) {
  window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/${component}`;
}

export function DriverDashboard() {
  const currentUser = getCurrentUser();
  const [profile, setProfile] = useState<DriverProfile>({});

  useEffect(() => {
    if (currentUser?.role !== "DRIVER") {
      const destination = currentUser?.role === "STUDENT" ? "StudentDashboard" : "OfficerDashboard";
      window.location.replace(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/${destination}`);
      return;
    }
    apiRequest<{ profile: DriverProfile }>("/me").then(({ profile: loaded }) => setProfile(loaded ?? {})).catch(() => undefined);
  }, [currentUser?.role]);

  return (
    <AppLayout active="Dashboard" title="Driver dashboard" eyebrow="Driver workspace">
      <div className="mx-auto max-w-[1120px] space-y-6">
        <section className="rounded-[26px] bg-[#12305a] px-6 py-7 text-white shadow-[0_16px_38px_rgba(25,61,101,0.16)] sm:px-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a9c7ed]">Driver space</p>
          <h2 className="mt-2 text-[30px] font-extrabold tracking-[-0.04em] sm:text-[36px]">Welcome back, {currentUser?.fullName ?? "driver"}.</h2>
          <p className="mt-2 max-w-[620px] text-[13px] leading-6 text-[#c9d9ed]">Keep your driver details, route information, and review notices ready for authorized personnel.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Driver code", value: profile.driverCode ?? "Not provided", icon: UserRound },
            { label: "Tricycle", value: profile.tricycleIdentifier ?? "Not provided", icon: CarFront },
            { label: "Route", value: profile.routeArea ?? "Not provided", icon: MapPin },
            { label: "Contact", value: profile.contactNumber ?? "Not provided", icon: Phone },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-[#d9e3ec] bg-white p-4 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
              <Icon size={17} className="text-[#0c5bce]" />
              <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#91a2b4]">{label}</p>
              <p className="mt-1 truncate text-[14px] font-extrabold text-[#23405f]">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#0c5bce]"><ShieldCheck size={19} /></span><div><h3 className="text-[15px] font-extrabold text-[#23405f]">Account and vehicle details</h3><p className="mt-1 text-[11px] text-[#8295aa]">Keep your contact-tracing information complete.</p></div></div>
            <p className="mt-5 text-[12px] leading-5 text-[#71859e]">{profile.todaName ?? "Your TODA assignment is managed by authorized personnel."}</p>
            <button type="button" onClick={() => goTo("Profile")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0c5bce] px-4 py-3 text-[11px] font-extrabold text-white hover:bg-[#084da9]">View full profile <ChevronRight size={14} /></button>
          </div>
          <div className="rounded-2xl border border-[#d9e3ec] bg-white p-5 shadow-[0_5px_20px_rgba(39,67,93,0.04)]">
            <h3 className="text-[15px] font-extrabold text-[#23405f]">Driver actions</h3>
            <div className="mt-4 space-y-2">
              <button type="button" onClick={() => goTo("MyReports")} className="flex w-full items-center gap-3 rounded-xl bg-[#f5f9fd] px-4 py-3 text-left text-[12px] font-bold text-[#315271] hover:bg-[#eaf2ff]"><FileCheck2 size={17} className="text-[#0c5bce]" />View reports linked to your vehicle <ChevronRight size={14} className="ml-auto" /></button>
              <button type="button" onClick={() => goTo("Violations")} className="flex w-full items-center gap-3 rounded-xl bg-[#f5f9fd] px-4 py-3 text-left text-[12px] font-bold text-[#315271] hover:bg-[#eaf2ff]"><ShieldCheck size={17} className="text-[#0c5bce]" />View violation records <ChevronRight size={14} className="ml-auto" /></button>
              <button type="button" onClick={() => goTo("Notifications")} className="flex w-full items-center gap-3 rounded-xl bg-[#f5f9fd] px-4 py-3 text-left text-[12px] font-bold text-[#315271] hover:bg-[#eaf2ff]"><Bell size={17} className="text-[#0c5bce]" />Open notifications <ChevronRight size={14} className="ml-auto" /></button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

export default DriverDashboard;

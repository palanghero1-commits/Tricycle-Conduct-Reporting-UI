import { Construction, MapPin, ShieldAlert } from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { getCurrentUser } from "../../../lib/api";

export function UnderDevelopment() {
  const isOfficer = ["AUTHORIZED_PERSONNEL", "SUPERADMIN", "PNP", "TODA_PRESIDENT"].includes(getCurrentUser()?.role ?? "");

  return (
    <AppLayout officer={isOfficer} active="Emergency SOS" title="Emergency SOS" eyebrow={isOfficer ? "Authorized response center" : "Student safety"}>
      <div className="mx-auto max-w-[680px] py-10 lg:py-20">
        <section className="rounded-[28px] border border-[#dbe5f0] bg-white p-8 text-center shadow-[0_18px_55px_rgba(38,76,114,0.10)] sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff5df] text-[#b47718]"><Construction size={31} /></div>
          <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b47718]">Feature under development</p>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-[-0.04em] text-[#17375d]">Emergency SOS is not available yet</h1>
          <p className="mx-auto mt-4 max-w-[480px] text-[13px] leading-6 text-[#688099]">This feature is being prepared for safe testing. SOS alerts and live location tracking cannot be activated at this time.</p>
          <div className="mt-7 grid gap-3 text-left sm:grid-cols-2">
            <div className="rounded-xl bg-[#f7f9fc] p-4"><ShieldAlert size={17} className="text-[#c0392b]" /><p className="mt-2 text-[11px] font-bold text-[#355570]">Emergency alerting</p><p className="mt-1 text-[10px] leading-4 text-[#8295a9]">Not active until the safety review is complete.</p></div>
            <div className="rounded-xl bg-[#f7f9fc] p-4"><MapPin size={17} className="text-[#2875bb]" /><p className="mt-2 text-[11px] font-bold text-[#355570]">Live GPS tracking</p><p className="mt-1 text-[10px] leading-4 text-[#8295a9]">Location sharing is currently disabled.</p></div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

export default UnderDevelopment;

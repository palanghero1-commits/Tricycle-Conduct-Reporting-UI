import { useState, type FormEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Eye,
  KeyRound,
  Laptop2,
  LockKeyhole,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { getCurrentUser, getUserInitials } from "../../../lib/api";
import { AppLayout } from "./_shared/AppLayout";

type PreferenceKey = "updates" | "reminders";

type SettingRowProps = {
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
  onClick: () => void;
  trailing?: "arrow" | "status";
  status?: string;
};

const initialPreferences: Record<PreferenceKey, boolean> = {
  updates: true,
  reminders: false,
};

function SettingRow({
  icon: Icon,
  iconClassName,
  title,
  description,
  onClick,
  trailing = "arrow",
  status,
}: SettingRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3.5 border-b border-[#e5edf4] px-4 py-4 text-left transition hover:bg-[#fbfdff] last:border-b-0 sm:px-5"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${iconClassName}`}>
        <Icon size={18} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[13px] font-extrabold tracking-[-0.01em] text-[#243b57]">
          {title}
          {title === "Notification preferences" ? (
            <span className="rounded-full bg-[#eaf6f0] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#25825b]">
              {status}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block max-w-[530px] text-[11px] leading-[1.45] text-[#8295aa]">{description}</span>
      </span>
      {trailing === "status" ? (
        <span className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e9f7ef] text-[#25825b]">
          <Check size={14} strokeWidth={2.5} />
        </span>
      ) : (
        <ChevronRight className="shrink-0 text-[#a5b7c8] transition group-hover:translate-x-0.5 group-hover:text-[#0c5bce]" size={18} />
      )}
    </button>
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
  widthClass = "max-w-[430px]",
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17304d]/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
      <div className={`w-full ${widthClass} rounded-t-[24px] border border-[#dbe6ef] bg-[#fbfdff] p-5 shadow-[0_24px_70px_rgba(27,62,99,0.2)] sm:rounded-[24px] sm:p-6`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-extrabold tracking-[-0.025em] text-[#173455]">{title}</h2>
            {description ? <p className="mt-1.5 text-[12px] leading-5 text-[#8295aa]">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-[#8ca0b5] transition hover:bg-[#edf4fa] hover:text-[#274461]" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Profile() {
  const currentUser = getCurrentUser();
  const [displayName, setDisplayName] = useState(currentUser?.fullName ?? "Maria Cruz");
  const [email, setEmail] = useState(currentUser?.email ?? "maria.cruz@sunn.edu.ph");
  const [draftName, setDraftName] = useState(displayName);
  const [draftEmail, setDraftEmail] = useState(email);
  const [activePanel, setActivePanel] = useState<"edit" | "password" | "notifications" | "privacy" | "sessions" | "signout" | null>(null);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [savedNotice, setSavedNotice] = useState(false);

  const openEdit = () => {
    setDraftName(displayName);
    setDraftEmail(email);
    setActivePanel("edit");
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDisplayName(draftName.trim() || displayName);
    setEmail(draftEmail.trim() || email);
    setActivePanel(null);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2600);
  };

  const togglePreference = (key: PreferenceKey) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <AppLayout active="Profile" title="Your profile" eyebrow={currentUser?.role === "DRIVER" ? "Driver space" : "Student space"}>
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0c5bce]">A little about you</p>
            <h2 className="text-[28px] font-extrabold tracking-[-0.045em] text-[#173455] sm:text-[34px]">Welcome back, {displayName.split(" ")[0]}.</h2>
            <p className="mt-2 max-w-[510px] text-[13px] leading-6 text-[#71869d]">
              Keep your details current so the Old Sagay civic desk can connect reports to the right student account.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full border border-[#dbe9f2] bg-[#f9fcff] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e879f]">
            <ShieldCheck size={14} className="text-[#278661]" />
            Demo account
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[24px] border border-[#d6e4ef] bg-[#eaf4ff] shadow-[0_12px_34px_rgba(37,76,116,0.07)]">
          <div className="absolute -right-8 -top-16 h-48 w-48 rounded-full border-[24px] border-[#d9ecff] opacity-80" />
          <div className="absolute -bottom-24 right-[20%] h-36 w-36 rounded-full bg-[#dff4ed] opacity-75" />
          <div className="relative flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:px-7 sm:py-6">
            <div className="relative flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-[25px] bg-[#f7c9ad] text-[25px] font-extrabold tracking-[-0.05em] text-[#8d4c38] shadow-[0_8px_18px_rgba(141,76,56,0.12)]">
              {getUserInitials({ fullName: displayName, email })}
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-[#eaf4ff] bg-[#21805c] text-white">
                <Check size={13} strokeWidth={2.7} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-[20px] font-extrabold tracking-[-0.03em] text-[#173455]">{displayName}</h3>
                <span className="rounded-full bg-[#d8f0e3] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.11em] text-[#247952]">{currentUser?.role === "DRIVER" ? "Driver" : "Student"}</span>
              </div>
              <p className="mt-1.5 text-[12px] font-medium text-[#5e7893]">Student no. 2023-04182</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-[#718aa2]">
                <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-[#0c5bce]" /> Old Sagay, Sagay City</span>
                <span className="inline-flex items-center gap-1.5"><UsersRound size={13} className="text-[#0c5bce]" /> SUNN community</span>
              </div>
            </div>
            <button type="button" onClick={openEdit} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#c8dceb] bg-[#f9fcff]/80 px-3.5 py-2.5 text-[11px] font-extrabold text-[#0c5bce] transition hover:bg-white sm:w-auto">
              <PencilLine size={14} />
              Edit profile
            </button>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.03fr_1fr]">
          <section className="rounded-[22px] border border-[#e0e9f1] bg-[#fbfdff] shadow-[0_8px_26px_rgba(44,78,108,0.035)]">
            <div className="border-b border-[#e5edf4] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eaf2ff] text-[#0c5bce]"><UserRound size={16} /></span>
                <div>
                  <h3 className="text-[13px] font-extrabold text-[#28415e]">Student details</h3>
                  <p className="mt-0.5 text-[10px] text-[#91a2b4]">The basics linked to your account</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-[#edf2f6] px-5 sm:px-6">
              <div className="flex items-start justify-between gap-4 py-4">
                <span className="text-[11px] font-semibold text-[#8598ab]">Course / program</span>
                <span className="max-w-[195px] text-right text-[12px] font-bold leading-5 text-[#314b68]">Bachelor of Science in Information Technology</span>
              </div>
              <div className="flex items-start justify-between gap-4 py-4">
                <span className="text-[11px] font-semibold text-[#8598ab]">Student number</span>
                <span className="text-[12px] font-bold text-[#314b68]">2023-04182</span>
              </div>
              <div className="flex items-start justify-between gap-4 py-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8598ab]"><Mail size={13} /> Account email</span>
                <span className="max-w-[190px] break-all text-right text-[12px] font-bold text-[#314b68]">{email}</span>
              </div>
              <div className="flex items-start justify-between gap-4 py-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8598ab]"><Phone size={13} /> Contact number</span>
                <span className="text-[12px] font-bold text-[#314b68]">09•• ••• 1842</span>
              </div>
            </div>
            <div className="mx-5 mb-5 mt-1 flex items-start gap-2.5 rounded-[14px] bg-[#f5f9fc] px-3.5 py-3 sm:mx-6">
              <CircleHelp className="mt-0.5 shrink-0 text-[#7d97b0]" size={14} />
              <p className="text-[10px] leading-4 text-[#7890a7]">Your student number and program are shown for reference and cannot be changed in this prototype.</p>
            </div>
          </section>

          <section className="rounded-[22px] border border-[#e0e9f1] bg-[#fbfdff] shadow-[0_8px_26px_rgba(44,78,108,0.035)]">
            <div className="border-b border-[#e5edf4] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#fff0e8] text-[#c86948]"><SlidersHorizontal size={16} /></span>
                <div>
                  <h3 className="text-[13px] font-extrabold text-[#28415e]">Settings & security</h3>
                  <p className="mt-0.5 text-[10px] text-[#91a2b4]">Choose what feels right for your account</p>
                </div>
              </div>
            </div>
            <div>
              <SettingRow icon={PencilLine} iconClassName="bg-[#edf4ff] text-[#0c5bce]" title="Edit profile" description="Update your name or account email" onClick={openEdit} />
              <SettingRow icon={KeyRound} iconClassName="bg-[#fff1e9] text-[#c66846]" title="Change password" description="Password controls are represented in this demo" onClick={() => setActivePanel("password")} />
              <SettingRow icon={Bell} iconClassName="bg-[#fff7dd] text-[#b47c16]" title="Notification preferences" description="Choose which report updates reach you" status={`${Number(preferences.updates) + Number(preferences.reminders)} enabled`} onClick={() => setActivePanel("notifications")} />
              <SettingRow icon={Eye} iconClassName="bg-[#eaf7f1] text-[#27805b]" title="Privacy" description="Review how your report details are handled" onClick={() => setActivePanel("privacy")} />
              <SettingRow icon={Laptop2} iconClassName="bg-[#f0efff] text-[#645ca9]" title="Active sessions" description="One session is currently open" trailing="status" onClick={() => setActivePanel("sessions")} />
            </div>
          </section>
        </div>

        <section className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[20px] border border-[#f0ddd4] bg-[#fff9f6] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#ffe9df] text-[#c66846]"><LockKeyhole size={16} /></span>
            <div>
              <p className="text-[12px] font-extrabold text-[#704737]">Need to leave this demo?</p>
              <p className="mt-1 text-[11px] text-[#9b776a]">Sign out only closes this sample view. No account changes are made.</p>
            </div>
          </div>
          <button type="button" onClick={() => setActivePanel("signout")} className="inline-flex items-center gap-2 rounded-xl border border-[#edcfc2] bg-[#fffdfc] px-3.5 py-2.5 text-[11px] font-extrabold text-[#a8593e] transition hover:bg-white">
            Sign out
            <ArrowRight size={14} />
          </button>
        </section>

        <div className="mt-7 flex flex-col gap-2 text-[10px] font-medium text-[#91a2b4] sm:flex-row sm:items-center sm:justify-between">
          <span>Profile last reviewed · 14 March 2025</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#2a845f]" /> Your information stays within the prototype</span>
        </div>
      </div>

      {savedNotice ? (
        <div className="fixed bottom-[86px] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#cce7d8] bg-[#f3fbf6] px-4 py-2.5 text-[11px] font-bold text-[#287652] shadow-[0_10px_25px_rgba(38,99,70,0.12)] lg:bottom-7">
          <Check size={14} />
          Profile details updated in this demo
        </div>
      ) : null}

      {activePanel === "edit" ? (
        <Modal title="Edit profile" description="Make a small change to your sample profile." onClose={() => setActivePanel(null)}>
          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-[#59718a]">Display name</span>
              <input value={draftName} onChange={(event) => setDraftName(event.target.value)} className="w-full rounded-xl border border-[#d5e2ec] bg-white px-3.5 py-3 text-[13px] font-semibold text-[#274461] outline-none transition focus:border-[#7faddb] focus:ring-4 focus:ring-[#eaf3ff]" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-[#59718a]">Account email</span>
              <input type="email" value={draftEmail} onChange={(event) => setDraftEmail(event.target.value)} className="w-full rounded-xl border border-[#d5e2ec] bg-white px-3.5 py-3 text-[13px] font-semibold text-[#274461] outline-none transition focus:border-[#7faddb] focus:ring-4 focus:ring-[#eaf3ff]" />
            </label>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setActivePanel(null)} className="rounded-xl px-4 py-2.5 text-[11px] font-extrabold text-[#7890a7] hover:bg-[#f1f6fa]">Cancel</button>
              <button type="submit" className="rounded-xl bg-[#0c5bce] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_6px_16px_rgba(12,91,206,0.2)] hover:bg-[#0a50b6]">Save changes</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {activePanel === "password" ? (
        <Modal title="Change password" description="This prototype does not process or store passwords." onClose={() => setActivePanel(null)}>
          <div className="mt-5 rounded-[15px] bg-[#f4f8fc] p-4">
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e4efff] text-[#0c5bce]"><LockKeyhole size={15} /></span>
              <p className="text-[12px] leading-5 text-[#637b92]">In a live system, this action would take you to a secure password flow. Nothing will be changed here.</p>
            </div>
          </div>
          <button type="button" onClick={() => setActivePanel(null)} className="mt-5 w-full rounded-xl bg-[#0c5bce] px-4 py-3 text-[11px] font-extrabold text-white hover:bg-[#0a50b6]">Got it</button>
        </Modal>
      ) : null}

      {activePanel === "notifications" ? (
        <Modal title="Notification preferences" description="These switches only change the view in this demo." onClose={() => setActivePanel(null)} widthClass="max-w-[470px]">
          <div className="mt-5 divide-y divide-[#e6edf3] rounded-[15px] border border-[#e0e9f1] bg-white px-4">
            <div className="flex items-center gap-3 py-4">
              <Bell size={17} className="shrink-0 text-[#b47c16]" />
              <div className="flex-1"><p className="text-[12px] font-extrabold text-[#314b68]">Report updates</p><p className="mt-1 text-[10px] leading-4 text-[#8295aa]">A note when your report status changes.</p></div>
              <button type="button" onClick={() => togglePreference("updates")} aria-pressed={preferences.updates} className={`relative h-6 w-11 shrink-0 rounded-full p-1 transition ${preferences.updates ? "bg-[#25825b]" : "bg-[#ced9e3]"}`}><span className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${preferences.updates ? "translate-x-5" : "translate-x-0"}`} /></button>
            </div>
            <div className="flex items-center gap-3 py-4">
              <Sparkles size={17} className="shrink-0 text-[#c66846]" />
              <div className="flex-1"><p className="text-[12px] font-extrabold text-[#314b68]">Helpful reminders</p><p className="mt-1 text-[10px] leading-4 text-[#8295aa]">Gentle reminders about your open reports.</p></div>
              <button type="button" onClick={() => togglePreference("reminders")} aria-pressed={preferences.reminders} className={`relative h-6 w-11 shrink-0 rounded-full p-1 transition ${preferences.reminders ? "bg-[#25825b]" : "bg-[#ced9e3]"}`}><span className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${preferences.reminders ? "translate-x-5" : "translate-x-0"}`} /></button>
            </div>
          </div>
          <button type="button" onClick={() => setActivePanel(null)} className="mt-5 w-full rounded-xl bg-[#0c5bce] px-4 py-3 text-[11px] font-extrabold text-white hover:bg-[#0a50b6]">Done</button>
        </Modal>
      ) : null}

      {activePanel === "privacy" ? (
        <Modal title="Privacy" description="A clear view of what this civic reporting prototype keeps in context." onClose={() => setActivePanel(null)}>
          <div className="mt-5 space-y-3">
            <div className="rounded-[14px] bg-[#edf8f2] px-4 py-3.5"><p className="text-[11px] font-extrabold text-[#287652]">Reports are treated as unconfirmed</p><p className="mt-1 text-[10px] leading-4 text-[#658779]">A report shares an observation for review. It is not a confirmed violation or finding.</p></div>
            <div className="rounded-[14px] bg-[#f4f8fc] px-4 py-3.5"><p className="text-[11px] font-extrabold text-[#405b75]">Your details stay contextual</p><p className="mt-1 text-[10px] leading-4 text-[#7b90a5]">This sample screen shows only the profile details needed for a student reporting journey.</p></div>
          </div>
          <button type="button" onClick={() => setActivePanel(null)} className="mt-5 w-full rounded-xl bg-[#0c5bce] px-4 py-3 text-[11px] font-extrabold text-white hover:bg-[#0a50b6]">Close</button>
        </Modal>
      ) : null}

      {activePanel === "sessions" ? (
        <Modal title="Active sessions" description="A quick look at where this sample profile is open." onClose={() => setActivePanel(null)}>
          <div className="mt-5 rounded-[15px] border border-[#dce8f1] bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#f0efff] text-[#645ca9]"><Laptop2 size={17} /></span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-extrabold text-[#314b68]">This browser</p><span className="rounded-full bg-[#e9f7ef] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#25825b]">Current</span></div><p className="mt-1 text-[10px] text-[#8295aa]">Sagay City · Seen just now</p></div>
            </div>
          </div>
          <button type="button" onClick={() => setActivePanel(null)} className="mt-5 w-full rounded-xl bg-[#0c5bce] px-4 py-3 text-[11px] font-extrabold text-white hover:bg-[#0a50b6]">Close</button>
        </Modal>
      ) : null}

      {activePanel === "signout" ? (
        <Modal title="Sign out of this demo?" description="You will return to the sample welcome screen. No account or report data will be changed." onClose={() => setActivePanel(null)}>
          <div className="mt-5 flex items-center gap-3 rounded-[15px] bg-[#fff4ef] px-4 py-3.5"><LockKeyhole className="shrink-0 text-[#b96549]" size={17} /><p className="text-[11px] leading-4 text-[#875a4d]">This is a visual confirmation only. There is no active session to end.</p></div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setActivePanel(null)} className="rounded-xl px-4 py-2.5 text-[11px] font-extrabold text-[#7890a7] hover:bg-[#f1f6fa]">Stay here</button>
            <button type="button" onClick={() => setActivePanel(null)} className="rounded-xl bg-[#b96549] px-4 py-2.5 text-[11px] font-extrabold text-white hover:bg-[#a9553b]">Sign out</button>
          </div>
        </Modal>
      ) : null}
    </AppLayout>
  );
}

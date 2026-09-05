import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Check,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileSearch,
  Gauge,
  Globe2,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Menu,
  MessageCircle,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";

type DialogType = "report" | "track" | "access" | null;

const steps = [
  {
    number: "01",
    title: "Share what happened",
    description: "Record the route, time, and details while they are still fresh.",
    icon: ClipboardList,
    tone: "blue",
  },
  {
    number: "02",
    title: "Receive a reference",
    description: "Your report gets a private reference code for checking progress.",
    icon: BadgeCheck,
    tone: "teal",
  },
  {
    number: "03",
    title: "Initial review",
    description: "Authorized personnel check the submission for completeness and context.",
    icon: FileSearch,
    tone: "amber",
  },
  {
    number: "04",
    title: "Appropriate action",
    description: "The concern is routed to the responsible review team when needed.",
    icon: Route,
    tone: "blue",
  },
  {
    number: "05",
    title: "Keep track",
    description: "View status updates without needing to retell your experience.",
    icon: BellRing,
    tone: "teal",
  },
];

const benefits = [
  {
    icon: LockKeyhole,
    eyebrow: "Private by design",
    title: "A calmer way to speak up",
    description:
      "A focused form keeps the process clear and limits your information to what helps a review.",
    className: "md:col-span-2",
  },
  {
    icon: Eye,
    eyebrow: "Clear progress",
    title: "Know where things stand",
    description: "Use your reference code to see the latest review stage at your own pace.",
    className: "",
  },
  {
    icon: MessageCircle,
    eyebrow: "Shared understanding",
    title: "Better context for every ride",
    description:
      "Consistent details help SUNN and TODA partners notice patterns and respond thoughtfully.",
    className: "",
  },
];

const roleEntrances = [
  {
    label: "Student",
    description: "Submit reports, track status, and read updates.",
    component: "StudentLanding",
    icon: GraduationCap,
    tone: "bg-[#eaf2ff] text-[#0c5bce]",
  },
  {
    label: "Driver",
    description: "Review profile details and notices linked to your route.",
    component: "DriverLanding",
    icon: Wrench,
    tone: "bg-[#e5f5f2] text-[#237f7d]",
  },
  {
    label: "TODA Officer",
    description: "Monitor queues, driver records, and association follow-up.",
    component: "OfficerLanding",
    icon: Gauge,
    tone: "bg-[#e8f1f7] text-[#1e638d]",
  },
  {
    label: "PNP Reviewer",
    description: "Open the restricted review flow for authorized personnel.",
    component: "PNPLanding",
    icon: UsersRound,
    tone: "bg-[#edf3f8] text-[#557ba4]",
  },
  {
    label: "Administrator",
    description: "Manage users, records, and system activity.",
    component: "AdminLanding",
    icon: KeyRound,
    tone: "bg-[#f1edf5] text-[#806c8f]",
  },
];

export function Landing() {
  const [dialog, setDialog] = useState<DialogType>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const reportButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!dialog) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDialog(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog]);

  const openReport = () => {
    setMobileOpen(false);
    setSubmitted(false);
    setDialog("report");
  };

  const openTrack = () => {
    setMobileOpen(false);
    setSubmitted(false);
    setDialog("track");
  };

  const authBase = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/Auth`;
  const previewBase = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting`;

  const openLogin = () => {
    setMobileOpen(false);
    window.location.href = `${authBase}?mode=login`;
  };

  const openRegister = () => {
    setMobileOpen(false);
    window.location.href = `${authBase}?mode=register`;
  };

  const closeDialog = () => {
    setDialog(null);
    window.setTimeout(() => reportButtonRef.current?.focus(), 0);
  };

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#f7fbff] text-[#142d4d]">
      <header className="relative z-20 border-b border-[#dceaf4]/80 bg-[#f7fbff]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-3 px-4 sm:h-[76px] sm:gap-4 sm:px-5 lg:px-8">
          <button
            type="button"
            onClick={() => scrollTo("top")}
            className="group flex min-w-0 shrink items-center gap-2.5 text-left sm:gap-3"
            aria-label="Back to top"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-[#0c5bce] text-white shadow-[0_8px_22px_rgba(12,91,206,0.22)] transition-transform duration-200 group-hover:-translate-y-0.5 sm:h-10 sm:w-10">
              <ShieldCheck size={21} strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-extrabold tracking-[-0.02em] text-[#12305a] sm:text-[13px]">
                Tricycle Conduct
              </span>
              <span className="hidden min-[400px]:block text-[11px] font-medium text-[#718aa5]">Old Sagay • SUNN</span>
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
            <nav className="hidden items-center gap-6 md:flex lg:gap-8" aria-label="Primary navigation">
              <button
                type="button"
                onClick={() => scrollTo("how-it-works")}
                className="text-[13px] font-semibold text-[#65809d] transition-colors hover:text-[#0c5bce]"
              >
                How it works
              </button>
              <button
                type="button"
                onClick={() => scrollTo("why-it-matters")}
                className="text-[13px] font-semibold text-[#65809d] transition-colors hover:text-[#0c5bce]"
              >
                Why use it
              </button>
              <button
                type="button"
                onClick={() => scrollTo("privacy")}
                className="text-[13px] font-semibold text-[#65809d] transition-colors hover:text-[#0c5bce]"
              >
                Privacy
              </button>
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={openLogin}
                className="rounded-xl border border-[#cfe0ed] bg-white px-3 py-1.5 text-[11px] font-bold text-[#244565] shadow-[0_2px_8px_rgba(33,72,111,0.04)] transition-all hover:border-[#acc9e3] hover:text-[#0c5bce] sm:px-4 sm:py-2.5 sm:text-[13px]"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={openRegister}
                className="rounded-xl bg-[#0c5bce] px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_3px_12px_rgba(12,91,206,0.2)] transition-all hover:bg-[#094fae] sm:px-4 sm:py-2.5 sm:text-[13px]"
              >
                Register
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              className="rounded-xl border border-[#d3e2ee] bg-white p-2 text-[#42617f] md:hidden sm:p-2.5"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {mobileOpen ? (
          <nav className="border-t border-[#dceaf4] bg-white px-4 py-3 sm:px-5 md:hidden" aria-label="Mobile navigation">
            <button type="button" onClick={() => scrollTo("how-it-works")} className="block w-full border-b border-[#edf3f8] py-3 text-left text-sm font-semibold text-[#496985]">
              How it works
            </button>
            <button type="button" onClick={() => scrollTo("why-it-matters")} className="block w-full border-b border-[#edf3f8] py-3 text-left text-sm font-semibold text-[#496985]">
              Why use it
            </button>
            <button type="button" onClick={() => scrollTo("privacy")} className="block w-full py-3 text-left text-sm font-semibold text-[#496985]">
              Privacy
            </button>
          </nav>
        ) : null}
      </header>

      <main id="top">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-36 top-20 h-[520px] w-[520px] rounded-full border border-[#d8ebf4] opacity-70" />
          <div className="pointer-events-none absolute -right-8 top-48 h-[355px] w-[355px] rounded-full border border-[#d8ebf4] opacity-80" />
          <div className="pointer-events-none absolute left-[39%] top-12 h-3 w-3 rounded-full bg-[#d99b43]" />
          <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.03fr_.97fr] lg:gap-16 lg:px-8 lg:pb-28 lg:pt-24">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cfe6e5] bg-[#eff9f8] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#277f7e]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#39a5a0]" />
                A community care channel
              </div>
              <h1 className="max-w-[720px] text-[clamp(2.65rem,6vw,5.45rem)] font-extrabold leading-[0.98] tracking-[-0.065em] text-[#12305a]">
                Make every ride
                <span className="block text-[#0c5bce]">feel safer.</span>
              </h1>
              <p className="mt-7 max-w-[560px] text-[17px] leading-8 text-[#5c7691] lg:text-[19px]">
                A secure and organized reporting platform for SUNN students and authorized personnel.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button
                  ref={reportButtonRef}
                  type="button"
                  onClick={openLogin}
                  className="group inline-flex items-center justify-center gap-3 rounded-[13px] bg-[#0c5bce] px-5 py-3.5 text-[14px] font-extrabold text-white shadow-[0_12px_26px_rgba(12,91,206,0.2)] transition-all duration-200 hover:-translate-y-1 hover:bg-[#094fae] hover:shadow-[0_15px_30px_rgba(12,91,206,0.27)]"
                >
                  Log in
                  <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={openRegister}
                  className="inline-flex items-center justify-center gap-2.5 rounded-[13px] border border-[#cddfea] bg-white px-5 py-3.5 text-[14px] font-extrabold text-[#315271] shadow-[0_5px_18px_rgba(34,75,112,0.05)] transition-all duration-200 hover:-translate-y-1 hover:border-[#a5c3dd] hover:text-[#0c5bce]"
                >
                  Register
                </button>
              </div>
              <div className="mt-8 flex items-center gap-3 text-[12px] font-semibold text-[#7890a8]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dff2ec] text-[#248878]">
                  <LockKeyhole size={12} />
                </span>
                Your report is handled with care and reviewed fairly.
              </div>
            </div>

            <div className="relative z-10 mx-auto w-full max-w-[510px] lg:ml-auto">
              <div className="relative rounded-[30px] border border-[#cce0ef] bg-[#eaf4fc] p-3 shadow-[0_28px_70px_rgba(41,91,135,0.13)]">
                <div className="relative min-h-[420px] overflow-hidden rounded-[23px] bg-[#f8fcff] px-5 pb-5 pt-6 sm:px-7">
                  <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#dff3f1]" />
                  <div className="absolute -bottom-24 -left-14 h-52 w-52 rounded-full bg-[#fff1d9]" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7290aa]">A simple pathway</p>
                      <p className="mt-1 text-[18px] font-extrabold tracking-[-0.03em] text-[#173a61]">From concern to clarity</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#e3f4f2] text-[#268887]">
                      <Route size={20} />
                    </div>
                  </div>
                  <div className="relative mt-7 rounded-[19px] border border-[#dceaf3] bg-white p-4 shadow-[0_8px_22px_rgba(38,91,132,0.07)]">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4ff] text-[#0c5bce]">
                          <ClipboardCheck size={17} />
                        </div>
                        <div>
                          <p className="text-[12px] font-extrabold text-[#234565]">Your report journey</p>
                          <p className="mt-0.5 text-[10px] font-medium text-[#8aa0b5]">Private reference TRC-2048</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#fff3dc] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#ae7624]">
                        In review
                      </span>
                    </div>
                    <div className="mt-6 flex items-center">
                      {steps.map((step, index) => (
                        <div key={step.number} className="flex flex-1 items-center">
                          <div className={`h-3 w-3 shrink-0 rounded-full border-[3px] border-white shadow-sm ${index < 2 ? "bg-[#0c5bce]" : index === 2 ? "bg-[#d99b43]" : "bg-[#cbdce8]"}`} />
                          {index < steps.length - 1 ? <div className={`h-[2px] flex-1 ${index < 2 ? "bg-[#73a8e8]" : "bg-[#d8e5ed]"}`} /> : null}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[9px] font-bold text-[#8ba1b5]">
                      <span>Sent</span>
                      <span>Reviewing</span>
                      <span>Next step</span>
                    </div>
                  </div>
                  <div className="relative mt-4 grid grid-cols-[1fr_auto] gap-3">
                    <div className="rounded-[18px] bg-[#123b69] p-4 text-white">
                      <div className="flex items-center gap-2 text-[#9ec7f2]">
                        <Sparkles size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em]">Designed for people</span>
                      </div>
                      <p className="mt-3 max-w-[210px] text-[14px] font-bold leading-5">Clear details help the right people respond.</p>
                    </div>
                    <div className="flex min-w-[108px] flex-col justify-between rounded-[18px] border border-[#d9ecea] bg-[#f0f9f8] p-4">
                      <Globe2 size={17} className="text-[#328d8b]" />
                      <p className="text-[10px] font-bold leading-4 text-[#418482]">Old Sagay<br />community</p>
                    </div>
                  </div>
                  <div className="relative mt-4 flex items-center gap-2 px-1 text-[10px] font-semibold text-[#7a96ad]">
                    <Check size={14} className="text-[#2b9b91]" />
                    No public names or blame — just a better record.
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-[#d1e7e5] bg-white px-4 py-3 shadow-[0_10px_25px_rgba(29,86,110,0.12)] sm:flex sm:items-center sm:gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e1f4f0] text-[#2a9089]"><ShieldCheck size={14} /></span>
                <span className="text-[11px] font-bold text-[#52718c]">Built around due process</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#dceaf4] bg-white/70">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4ff] text-[#0c5bce]"><ShieldCheck size={18} /></span>
              <p className="text-[12px] font-bold text-[#486783]">A shared space for student safety and responsible review</p>
            </div>
            <p className="text-[11px] font-medium text-[#8ba0b5]">Barangay Old Sagay · Sagay City · Negros Occidental</p>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#288b89]">Role landing pages</p>
              <h2 className="mt-3 max-w-[620px] text-[clamp(2rem,4vw,3.1rem)] font-extrabold leading-[1.05] tracking-[-0.055em] text-[#15375e]">
                Start from the workspace that matches your role.
              </h2>
            </div>
            <p className="max-w-[420px] text-[13px] leading-6 text-[#668199]">
              Each role has a focused landing page before entering the dashboard or restricted review tools.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {roleEntrances.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => {
                    window.location.href = `${previewBase}/${role.component}`;
                  }}
                  className="group flex min-h-[190px] flex-col rounded-[20px] border border-[#dceaf4] bg-white p-5 text-left shadow-[0_5px_18px_rgba(43,83,120,0.035)] transition-all duration-200 hover:-translate-y-1 hover:border-[#bbd5e8] hover:shadow-[0_14px_30px_rgba(43,83,120,0.09)]"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${role.tone}`}>
                    <Icon size={19} />
                  </span>
                  <span className="mt-5 text-[15px] font-extrabold text-[#244665]">{role.label}</span>
                  <span className="mt-2 text-[12px] leading-5 text-[#7b91a6]">{role.description}</span>
                  <span className="mt-auto flex items-center gap-1.5 pt-5 text-[11px] font-extrabold text-[#0c5bce]">
                    Open landing
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 py-20 lg:px-8 lg:py-28">
          <div className="max-w-[620px]">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#288b89]">How it works</p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.055em] text-[#15375e]">
              A clear path, without the pressure.
            </h2>
            <p className="mt-5 text-[16px] leading-7 text-[#668199]">
              Every report follows the same thoughtful path, so students know what to expect and authorized personnel have the context to review fairly.
            </p>
          </div>
          <div className="mt-12 grid gap-3 md:grid-cols-5">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const toneClasses = {
                blue: "bg-[#eaf2ff] text-[#0c5bce]",
                teal: "bg-[#e4f5f2] text-[#278985]",
                amber: "bg-[#fff2da] text-[#ad792c]",
              };
              return (
                <article key={step.number} className="group relative rounded-[20px] border border-[#dceaf4] bg-white p-5 shadow-[0_5px_18px_rgba(43,83,120,0.035)] transition-all duration-200 hover:-translate-y-1 hover:border-[#bbd5e8] hover:shadow-[0_14px_30px_rgba(43,83,120,0.09)]">
                  {index < steps.length - 1 ? <div className="absolute -right-2.5 top-[43px] z-10 hidden h-5 w-5 items-center justify-center rounded-full border border-[#dceaf4] bg-white text-[#9ab0c2] md:flex"><ArrowRight size={11} /></div> : null}
                  <div className="flex items-center justify-between">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${toneClasses[step.tone as keyof typeof toneClasses]}`}><Icon size={18} /></span>
                    <span className="font-mono text-[11px] font-bold text-[#a6b7c7]">{step.number}</span>
                  </div>
                  <h3 className="mt-6 text-[14px] font-extrabold leading-5 text-[#244665]">{step.title}</h3>
                  <p className="mt-2 text-[12px] leading-5 text-[#7b91a6]">{step.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="why-it-matters" className="scroll-mt-20 bg-[#123b69] px-5 py-20 text-white lg:px-8 lg:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#8ed1cb]">Why this helps</p>
                <h2 className="mt-3 max-w-[430px] text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-[1.04] tracking-[-0.055em]">
                  Small details can improve the whole route.
                </h2>
              </div>
              <p className="max-w-[525px] text-[16px] leading-7 text-[#b8cfe2]">
                Reporting is one way to add context to everyday journeys. This platform makes that contribution more structured, more visible, and more respectful of everyone involved.
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <article key={benefit.title} className={`rounded-[22px] border border-white/10 bg-white/[0.07] p-6 transition-colors duration-200 hover:border-[#78c9c0]/50 hover:bg-white/[0.1] ${benefit.className}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#d9f0ed] text-[#237e7e]"><Icon size={18} /></div>
                    <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#87c9c5]">{benefit.eyebrow}</p>
                    <h3 className="mt-2 text-[18px] font-extrabold tracking-[-0.025em]">{benefit.title}</h3>
                    <p className="mt-3 max-w-[340px] text-[13px] leading-6 text-[#b6cfe1]">{benefit.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="privacy" className="scroll-mt-20 mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid overflow-hidden rounded-[28px] border border-[#cfe2ee] bg-[#edf7fb] lg:grid-cols-[1.1fr_.9fr]">
            <div className="p-7 sm:p-10 lg:p-14">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#d9eeec] text-[#247e7c]"><LockKeyhole size={20} /></div>
              <p className="mt-7 text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#318b88]">Privacy, made visible</p>
              <h2 className="mt-3 max-w-[510px] text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.06] tracking-[-0.055em] text-[#173c62]">
                You choose the detail. The process protects the rest.
              </h2>
              <p className="mt-5 max-w-[520px] text-[15px] leading-7 text-[#678198]">
                Share only information that helps describe the experience. Reports are intended for authorized review and are not displayed publicly.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {["Private reference code", "Authorized review", "Fair process"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-[#c8e1e3] bg-white/70 px-3 py-2 text-[11px] font-bold text-[#4b7c88]">
                    <Check size={13} /> {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative flex min-h-[270px] items-center justify-center overflow-hidden bg-[#d8eeeb] p-7">
              <div className="absolute h-[350px] w-[350px] rounded-full border border-[#b5dcd9]" />
              <div className="absolute h-[240px] w-[240px] rounded-full border border-[#b5dcd9]" />
              <div className="relative flex h-[128px] w-[128px] flex-col items-center justify-center rounded-[30px] bg-white text-center shadow-[0_16px_35px_rgba(50,104,112,0.14)]">
                <ShieldCheck size={30} className="text-[#237f7d]" strokeWidth={1.7} />
                <span className="mt-2 text-[11px] font-extrabold text-[#376d79]">Handled with care</span>
              </div>
              <div className="absolute right-[14%] top-[22%] flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff2d8] text-[#b27a2d]"><Check size={16} /></div>
              <div className="absolute bottom-[18%] left-[13%] flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f0ff] text-[#2867bd]"><LockKeyhole size={15} /></div>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 rounded-[18px] border border-[#eadfca] bg-[#fffaf0] px-5 py-4 text-[12px] leading-5 text-[#7c6c55] sm:flex-row sm:items-center">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f7e7c7] text-[#aa772c]"><ClipboardCheck size={14} /></span>
            <p><strong className="font-extrabold text-[#6e5b40]">Important:</strong> A report is not a confirmed violation. Each submission is reviewed through the proper process before any action is considered.</p>
          </div>
        </section>

        <section className="px-5 pb-20 lg:px-8 lg:pb-28">
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[27px] bg-[#0c5bce] px-7 py-12 text-center shadow-[0_18px_42px_rgba(12,91,206,0.16)] sm:px-12">
            <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-32 -right-10 h-72 w-72 rounded-full border border-white/10" />
            <p className="relative text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#b5d5f6]">A better record starts with context</p>
            <h2 className="relative mx-auto mt-3 max-w-[610px] text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.055em] text-white">
              Ready when you are.
            </h2>
            <p className="relative mx-auto mt-4 max-w-[500px] text-[15px] leading-7 text-[#c3dcf4]">
              Whether you are sharing a concern or checking a reference, take the next step at your own pace.
            </p>
            <div className="relative mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={openLogin} className="group inline-flex items-center justify-center gap-2.5 rounded-[12px] bg-white px-5 py-3.5 text-[13px] font-extrabold text-[#0c5bce] transition-all hover:-translate-y-1 hover:bg-[#f2f8ff]">
                Log in <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button type="button" onClick={openRegister} className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-white/30 px-5 py-3.5 text-[13px] font-extrabold text-white transition-all hover:-translate-y-1 hover:border-white/60 hover:bg-white/10">
                Register
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dceaf4] bg-white">
        <div className="mx-auto max-w-[1240px] px-5 pb-8 pt-12 lg:px-8">
          <div className="grid gap-9 md:grid-cols-[1.2fr_.8fr_.8fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#eaf2ff] text-[#0c5bce]"><ShieldCheck size={18} /></span>
                <span className="text-[13px] font-extrabold text-[#244565]">Tricycle Drivers Conduct Reporting System</span>
              </div>
              <p className="mt-4 max-w-[380px] text-[12px] leading-5 text-[#7c93a8]">
                A student-centered civic reporting platform for safer, more accountable rides in Old Sagay.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#9aafc1]">Community context</p>
              <p className="mt-3 text-[12px] font-semibold leading-5 text-[#55728c]">SUNN students<br />TODA partners<br />Barangay Old Sagay</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#9aafc1]">Need assistance?</p>
              <button type="button" onClick={() => setDialog("access")} className="mt-3 text-left text-[12px] font-bold text-[#0c5bce] hover:underline">Contact an authorized coordinator <ArrowRight className="ml-1 inline" size={13} /></button>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-[#edf2f6] pt-5 text-[10px] font-medium text-[#9aabba] sm:flex-row sm:items-center sm:justify-between">
            <p>For SUNN students and authorized personnel · Sagay City, Negros Occidental</p>
            <p>Prototype preview · Fictional sample content</p>
          </div>
        </div>
      </footer>

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#12305a]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="w-full max-w-[490px] rounded-t-[26px] border border-[#d5e4ee] bg-[#fafdff] p-6 shadow-[0_24px_70px_rgba(18,48,90,0.2)] sm:rounded-[26px] sm:p-8">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#eaf2ff] text-[#0c5bce]">
                {dialog === "track" ? <Search size={20} /> : dialog === "access" ? <ShieldCheck size={20} /> : <ClipboardList size={20} />}
              </div>
              <button type="button" onClick={closeDialog} className="rounded-xl p-2 text-[#8297aa] transition-colors hover:bg-[#edf4fa] hover:text-[#315271]" aria-label="Close dialog"><X size={18} /></button>
            </div>
            {dialog === "report" ? (
              <>
                <h2 id="dialog-title" className="mt-6 text-[23px] font-extrabold tracking-[-0.04em] text-[#173a61]">Start a report</h2>
                <p className="mt-2 text-[13px] leading-6 text-[#71879b]">This prototype shows the first step of a guided report. No submission will be sent.</p>
                <div className="mt-6 space-y-3">
                  {["What would you like to share?", "When did the ride take place?"].map((label) => (
                    <button key={label} type="button" onClick={() => setSubmitted(true)} className="flex w-full items-center justify-between rounded-[13px] border border-[#d8e6ef] bg-white px-4 py-3.5 text-left text-[13px] font-bold text-[#45647e] transition-colors hover:border-[#9ec0dc] hover:bg-[#f7fbff]">
                      {label}<ChevronDown size={16} className="text-[#8aa2b7]" />
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#eff8f7] p-3 text-[11px] leading-5 text-[#51817f]"><LockKeyhole size={14} className="mt-0.5 shrink-0" /> You can review your details before anything is shared with authorized personnel.</div>
                {submitted ? <p className="mt-4 text-[12px] font-bold text-[#278985]">Step noted for this preview. Continue to explore the full journey below.</p> : null}
                <button type="button" onClick={() => { setSubmitted(true); }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#0c5bce] py-3.5 text-[13px] font-extrabold text-white transition-colors hover:bg-[#094fae]">Continue in preview <ArrowRight size={16} /></button>
              </>
            ) : null}
            {dialog === "track" ? (
              <>
                <h2 id="dialog-title" className="mt-6 text-[23px] font-extrabold tracking-[-0.04em] text-[#173a61]">Track a report</h2>
                <p className="mt-2 text-[13px] leading-6 text-[#71879b]">Enter the private reference code you received after reporting.</p>
                <label className="mt-6 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7890a5]" htmlFor="reference-code">Reference code</label>
                <input id="reference-code" value={referenceCode} onChange={(event) => { setReferenceCode(event.target.value.toUpperCase()); setSubmitted(false); }} placeholder="Example: TRC-2048" className="mt-2 w-full rounded-[13px] border border-[#d5e4ee] bg-white px-4 py-3.5 text-sm font-bold tracking-[0.08em] text-[#244565] outline-none transition-shadow placeholder:font-medium placeholder:tracking-normal placeholder:text-[#a5b5c3] focus:border-[#7eb0dc] focus:ring-4 focus:ring-[#dcecff]" />
                {submitted ? <div className="mt-4 rounded-[13px] border border-[#cfe8e4] bg-[#eff9f7] p-4 text-[12px] leading-5 text-[#4d817d]"><strong className="font-extrabold text-[#267c78]">Preview status:</strong> This reference is ready for the review journey. Live records are not connected in this prototype.</div> : null}
                <button type="button" onClick={() => setSubmitted(true)} disabled={!referenceCode.trim()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#0c5bce] py-3.5 text-[13px] font-extrabold text-white transition-colors hover:bg-[#094fae] disabled:cursor-not-allowed disabled:bg-[#b9cde0]">View status <ArrowRight size={16} /></button>
              </>
            ) : null}
            {dialog === "access" ? (
              <>
                <h2 id="dialog-title" className="mt-6 text-[23px] font-extrabold tracking-[-0.04em] text-[#173a61]">Authorized access</h2>
                <p className="mt-2 text-[13px] leading-6 text-[#71879b]">The review workspace is reserved for designated SUNN and community partners. This landing page does not collect sign-in details.</p>
                <div className="mt-6 rounded-[15px] border border-[#d8e7ef] bg-white p-4">
                  <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e4f5f2] text-[#278985]"><ShieldCheck size={17} /></span><div><p className="text-[13px] font-extrabold text-[#315271]">Review access is coordinated locally</p><p className="mt-1 text-[11px] leading-4 text-[#8196a9]">Ask your designated coordinator for the correct workspace.</p></div></div>
                </div>
                <button type="button" onClick={closeDialog} className="mt-6 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#0c5bce] py-3.5 text-[13px] font-extrabold text-white transition-colors hover:bg-[#094fae]">Return to overview <Check size={16} /></button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

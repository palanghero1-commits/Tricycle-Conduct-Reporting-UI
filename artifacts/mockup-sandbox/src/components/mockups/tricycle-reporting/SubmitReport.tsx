import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileImage,
  Info,
  MapPin,
  Paperclip,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";

type Step = 1 | 2 | 3 | 4;

type Driver = {
  name: string;
  identifier: string;
  color: string;
  initials: string;
  route: string;
};

type EvidenceItem = {
  id: number;
  name: string;
  size: string;
  kind: "image" | "note";
  progress: number;
  status: "uploading" | "ready";
};

const drivers: Driver[] = [
  {
    name: "Rogelio D. Santos",
    identifier: "OS-4821",
    color: "bg-[#dceeff] text-[#1660a8]",
    initials: "RS",
    route: "Old Sagay • Market loop",
  },
  {
    name: "Maribel A. Cruz",
    identifier: "OS-3176",
    color: "bg-[#fbe8dc] text-[#b85e3d]",
    initials: "MC",
    route: "Old Sagay • Campus loop",
  },
  {
    name: "Jonas P. Villanueva",
    identifier: "OS-9084",
    color: "bg-[#e8e4fb] text-[#6656a9]",
    initials: "JV",
    route: "Old Sagay • Riverside loop",
  },
];

const categories = [
  "Overcharging",
  "Reckless Driving",
  "Refusal to Transport",
  "Discourteous Behavior",
  "Unsafe Driving",
  "Other",
] as const;

const stepDetails = [
  { number: 1, label: "Vehicle", caption: "Who and which tricycle" },
  { number: 2, label: "Incident", caption: "What happened" },
  { number: 3, label: "Evidence", caption: "Optional supporting files" },
  { number: 4, label: "Review", caption: "Check before sending" },
];

const initialEvidence: EvidenceItem[] = [
  {
    id: 1,
    name: "fare-receipt.jpg",
    size: "1.8 MB",
    kind: "image",
    progress: 100,
    status: "ready",
  },
];

function formatDate(value: string) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatTime(value: string) {
  if (!value) return "Not provided";
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(date);
}

export function SubmitReport() {
  const [step, setStep] = useState<Step>(1);
  const [selectedDriver, setSelectedDriver] = useState<string>("OS-4821");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Overcharging");
  const [otherCategory, setOtherCategory] = useState("");
  const [incidentDate, setIncidentDate] = useState("2025-04-18");
  const [incidentTime, setIncidentTime] = useState("08:40");
  const [location, setLocation] = useState("Old Sagay Public Market");
  const [description, setDescription] = useState(
    "The posted fare and the amount requested seemed different after I arrived at the market.",
  );
  const [evidence, setEvidence] = useState<EvidenceItem[]>(initialEvidence);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reportId, setReportId] = useState("");

  const visibleDrivers = useMemo(
    () =>
      drivers.filter((driver) =>
        `${driver.name} ${driver.identifier} ${driver.route}`.toLowerCase().includes(vehicleSearch.toLowerCase()),
      ),
    [vehicleSearch],
  );

  const selected = drivers.find((driver) => driver.identifier === selectedDriver) ?? drivers[0];

  useEffect(() => {
    const pending = evidence.filter((item) => item.status === "uploading");
    if (!pending.length) return;

    const timer = window.setTimeout(() => {
      setEvidence((current) =>
        current.map((item) =>
          item.status === "uploading"
            ? { ...item, progress: Math.min(item.progress + 24, 100), status: item.progress + 24 >= 100 ? "ready" : "uploading" }
            : item,
        ),
      );
    }, 440);

    return () => window.clearTimeout(timer);
  }, [evidence]);

  const addEvidence = () => {
    const nextId = evidence.length ? Math.max(...evidence.map((item) => item.id)) + 1 : 1;
    setEvidence((current) => [
      ...current,
      {
        id: nextId,
        name: nextId % 2 === 0 ? "tricycle-signage.png" : "trip-details.jpg",
        size: nextId % 2 === 0 ? "940 KB" : "2.1 MB",
        kind: "image",
        progress: 28,
        status: "uploading",
      },
    ]);
  };

  const removeEvidence = (id: number) => {
    setEvidence((current) => current.filter((item) => item.id !== id));
  };

  const resetReport = () => {
    setStep(1);
    setIsSubmitted(false);
    setReportId("");
    setEvidence(initialEvidence);
  };

  const goNext = () => {
    if (step < 4) setStep((current) => (current + 1) as Step);
  };

  const goBack = () => {
    if (step > 1) setStep((current) => (current - 1) as Step);
  };

  const submitReport = () => {
    setReportId("TCR-25-0418-073");
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <AppLayout active="Submit report" title="Submit a report" eyebrow="Student space">
        <div className="mx-auto max-w-[820px] py-3 lg:py-9">
          <div className="overflow-hidden rounded-[28px] border border-[#d7e5f1] bg-white shadow-[0_18px_55px_rgba(38,76,114,0.10)]">
            <div className="relative overflow-hidden bg-[#f0f7ff] px-6 pb-9 pt-10 text-center sm:px-12">
              <div className="absolute -right-14 -top-20 h-56 w-56 rounded-full border-[24px] border-white/60" />
              <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full border-[20px] border-[#dceeff]/80" />
              <div className="relative mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#d9f3e8] text-[#16815a] shadow-[0_8px_22px_rgba(21,125,87,0.12)]">
                <Check size={36} strokeWidth={2.6} />
              </div>
              <p className="relative mt-6 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#2b906c]">
                Report received
              </p>
              <h2 className="relative mt-2 text-[28px] font-extrabold tracking-[-0.04em] text-[#163154] sm:text-[34px]">
                Thank you for speaking up.
              </h2>
              <p className="relative mx-auto mt-3 max-w-[540px] text-[14px] leading-6 text-[#607993]">
                Your report has been recorded for review. It is an account for the conduct team to assess, not a confirmed violation.
              </p>
            </div>
            <div className="space-y-5 px-6 py-6 sm:px-12 sm:py-8">
              <div className="flex items-center justify-between rounded-2xl border border-[#e1eaf2] bg-[#fbfdff] px-4 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a7bb]">Mock report ID</p>
                  <p className="mt-1 font-mono text-[17px] font-bold tracking-[0.08em] text-[#18385e]">{reportId}</p>
                </div>
                <BadgeCheck size={23} className="text-[#278b68]" />
              </div>
              <div className="flex gap-3 rounded-2xl bg-[#fff9eb] px-4 py-4 text-[#82652d]">
                <Info size={17} className="mt-0.5 shrink-0" />
                <p className="text-[12px] leading-5">
                  You can check the status of this report in My reports. Reviews may take time as the team checks the details and any supporting evidence.
                </p>
              </div>
              <button
                type="button"
                onClick={resetReport}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0c5bce] px-4 py-3.5 text-[13px] font-extrabold text-white shadow-[0_7px_16px_rgba(12,91,206,0.2)] transition hover:bg-[#084da9]"
              >
                <Plus size={17} />
                Submit another report
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout active="Submit report" title="Submit a report" eyebrow="Student space">
      <div className="mx-auto max-w-[1220px]">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eaf2ff] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#0c5bce]">
              <ClipboardCheck size={13} />
              New report
            </div>
            <h2 className="text-[29px] font-extrabold tracking-[-0.045em] text-[#163154] sm:text-[36px]">Tell us what happened.</h2>
            <p className="mt-2 max-w-[650px] text-[13px] leading-5 text-[#6d829a]">
              A few clear details help the conduct team understand your experience. You can review everything before it is sent.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-[#dbe5f0] bg-white px-3 py-2 text-[11px] font-bold text-[#6e849d] sm:self-auto">
            <ShieldCheck size={15} className="text-[#278b68]" />
            Private student report
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-9">
          <aside className="lg:pt-2">
            <div className="rounded-[22px] border border-[#dbe5f0] bg-white p-4 shadow-[0_12px_35px_rgba(40,77,111,0.06)] sm:p-5">
              <p className="px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9aabbe]">Report progress</p>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1">
                {stepDetails.map((item) => {
                  const complete = step > item.number;
                  const active = step === item.number;
                  return (
                    <button
                      type="button"
                      key={item.number}
                      onClick={() => item.number <= step && setStep(item.number as Step)}
                      className={`group flex min-w-[150px] items-center gap-3 rounded-xl p-2.5 text-left transition lg:w-full ${
                        active ? "bg-[#eaf2ff]" : "hover:bg-[#f7faff]"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold ${
                          complete ? "bg-[#d9f3e8] text-[#16815a]" : active ? "bg-[#0c5bce] text-white" : "bg-[#f0f4f8] text-[#8aa0b5]"
                        }`}
                      >
                        {complete ? <Check size={15} strokeWidth={2.6} /> : item.number}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[12px] font-extrabold ${active ? "text-[#0c5bce]" : "text-[#3f5873]"}`}>{item.label}</span>
                        <span className="mt-0.5 block whitespace-nowrap text-[10px] font-medium text-[#93a5b8] lg:whitespace-normal">{item.caption}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 hidden rounded-2xl bg-[#f3f8fd] p-3.5 lg:block">
                <div className="flex gap-2">
                  <CircleAlert size={15} className="mt-0.5 shrink-0 text-[#5581aa]" />
                  <p className="text-[10px] leading-4 text-[#6d829a]">
                    Reports are reviewed fairly. Submitting one does not mean a violation has been confirmed.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="rounded-[26px] border border-[#dbe5f0] bg-white shadow-[0_15px_45px_rgba(35,72,108,0.07)]">
              <div className="flex items-center justify-between border-b border-[#edf1f5] px-5 py-4 sm:px-8 sm:py-5">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#97a9ba]">Step {step} of 4</p>
                  <h3 className="mt-1 text-[18px] font-extrabold tracking-[-0.025em] text-[#18385e] sm:text-[20px]">
                    {step === 1 ? "Identify the tricycle" : step === 2 ? "Describe the incident" : step === 3 ? "Add supporting evidence" : "Review your report"}
                  </h3>
                </div>
                <div className="hidden items-center gap-1.5 sm:flex">
                  {stepDetails.map((item) => (
                    <span key={item.number} className={`h-1.5 rounded-full transition-all ${item.number <= step ? "w-7 bg-[#0c5bce]" : "w-2 bg-[#dbe5f0]"}`} />
                  ))}
                </div>
              </div>

              <div className="px-5 py-6 sm:px-8 sm:py-8">
                {step === 1 ? (
                  <div className="space-y-6">
                    <div>
                      <div className="mb-3 flex items-end justify-between gap-3">
                        <div>
                          <label className="text-[13px] font-extrabold text-[#294664]">Select the driver or vehicle</label>
                          <p className="mt-1 text-[11px] text-[#8ca0b5]">Choose the identifier you saw during the trip.</p>
                        </div>
                        <span className="hidden text-[10px] font-bold text-[#9aabbe] sm:block">3 fictional records</span>
                      </div>
                      <div className="relative mb-3">
                        <Search size={16} className="absolute left-3.5 top-3.5 text-[#9aaabd]" />
                        <input
                          value={vehicleSearch}
                          onChange={(event) => setVehicleSearch(event.target.value)}
                          placeholder="Search name or vehicle ID"
                          className="h-11 w-full rounded-xl border border-[#dbe5f0] bg-[#fbfdff] pl-10 pr-4 text-[12px] text-[#274563] outline-none transition placeholder:text-[#a1b0bf] focus:border-[#76a9e6] focus:ring-4 focus:ring-[#eaf2ff]"
                        />
                      </div>
                      <div className="grid gap-2.5 sm:grid-cols-3">
                        {visibleDrivers.map((driver) => {
                          const isSelected = selectedDriver === driver.identifier;
                          return (
                            <button
                              type="button"
                              key={driver.identifier}
                              onClick={() => setSelectedDriver(driver.identifier)}
                              className={`relative rounded-2xl border p-3.5 text-left transition ${
                                isSelected ? "border-[#4d91db] bg-[#f3f8ff] shadow-[0_6px_18px_rgba(48,119,190,0.10)]" : "border-[#e0e8f0] bg-white hover:border-[#adc9e5] hover:bg-[#fbfdff]"
                              }`}
                            >
                              {isSelected ? <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#0c5bce] text-white"><Check size={12} strokeWidth={3} /></span> : null}
                              <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-extrabold ${driver.color}`}>{driver.initials}</span>
                              <span className="mt-3 block text-[12px] font-extrabold text-[#294664]">{driver.name}</span>
                              <span className="mt-1 block font-mono text-[10px] font-bold tracking-[0.08em] text-[#0c5bce]">{driver.identifier}</span>
                              <span className="mt-2 block text-[10px] leading-4 text-[#8ca0b5]">{driver.route}</span>
                            </button>
                          );
                        })}
                      </div>
                      {!visibleDrivers.length ? (
                        <div className="rounded-2xl border border-dashed border-[#dbe5f0] px-4 py-8 text-center text-[12px] text-[#8195aa]">No matching fictional records. Try the vehicle ID.</div>
                      ) : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[#f5f9fd] p-4">
                        <div className="flex items-center gap-2 text-[#6384a5]"><CarFront size={16} /><span className="text-[10px] font-extrabold uppercase tracking-[0.13em]">Vehicle identifier</span></div>
                        <p className="mt-2 font-mono text-[18px] font-extrabold tracking-[0.08em] text-[#17375d]">{selected.identifier}</p>
                      </div>
                      <div className="rounded-2xl bg-[#f5f9fd] p-4">
                        <div className="flex items-center gap-2 text-[#6384a5]"><UserRound size={16} /><span className="text-[10px] font-extrabold uppercase tracking-[0.13em]">Selected driver</span></div>
                        <p className="mt-2 text-[15px] font-extrabold text-[#17375d]">{selected.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-2xl border border-[#dbeaf7] bg-[#f5faff] px-4 py-3.5 text-[#547493]">
                      <Info size={16} className="mt-0.5 shrink-0 text-[#4384c5]" />
                      <p className="text-[11px] leading-5">If you are unsure of the driver name, use the vehicle identifier printed on the tricycle.</p>
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[13px] font-extrabold text-[#294664]">What was the concern?</label>
                      <p className="mt-1 text-[11px] text-[#8ca0b5]">Select the category that best describes the experience.</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {categories.map((item) => (
                          <button
                            type="button"
                            key={item}
                            onClick={() => setCategory(item)}
                            className={`flex min-h-[48px] items-center justify-between rounded-xl border px-3.5 text-left text-[12px] font-bold transition ${
                              category === item ? "border-[#4d91db] bg-[#f1f7ff] text-[#0c5bce]" : "border-[#e0e8f0] text-[#49647e] hover:border-[#adc9e5]"
                            }`}
                          >
                            {item}
                            {category === item ? <Check size={16} /> : <span className="h-4 w-4 rounded-full border border-[#c8d6e3]" />}
                          </button>
                        ))}
                      </div>
                      {category === "Other" ? (
                        <input
                          value={otherCategory}
                          onChange={(event) => setOtherCategory(event.target.value)}
                          placeholder="Tell us what happened"
                          className="mt-3 h-11 w-full rounded-xl border border-[#dbe5f0] px-3.5 text-[12px] text-[#274563] outline-none focus:border-[#76a9e6] focus:ring-4 focus:ring-[#eaf2ff]"
                        />
                      ) : null}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#49647e]"><CalendarDays size={15} className="text-[#7190ad]" />Date</span>
                        <input type="date" value={incidentDate} onChange={(event) => setIncidentDate(event.target.value)} className="h-11 w-full rounded-xl border border-[#dbe5f0] bg-white px-3 text-[12px] font-medium text-[#274563] outline-none focus:border-[#76a9e6] focus:ring-4 focus:ring-[#eaf2ff]" />
                      </label>
                      <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#49647e]"><Clock3 size={15} className="text-[#7190ad]" />Approximate time</span>
                        <input type="time" value={incidentTime} onChange={(event) => setIncidentTime(event.target.value)} className="h-11 w-full rounded-xl border border-[#dbe5f0] bg-white px-3 text-[12px] font-medium text-[#274563] outline-none focus:border-[#76a9e6] focus:ring-4 focus:ring-[#eaf2ff]" />
                      </label>
                    </div>
                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#49647e]"><MapPin size={15} className="text-[#7190ad]" />Where did this happen?</span>
                      <div className="relative">
                        <MapPin size={15} className="absolute left-3.5 top-3.5 text-[#9aaabd]" />
                        <input value={location} onChange={(event) => setLocation(event.target.value)} className="h-11 w-full rounded-xl border border-[#dbe5f0] px-10 pr-10 text-[12px] text-[#274563] outline-none focus:border-[#76a9e6] focus:ring-4 focus:ring-[#eaf2ff]" />
                        <ChevronDown size={15} className="absolute right-3.5 top-3.5 text-[#a0afbd]" />
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-extrabold text-[#49647e]">What happened?</span>
                      <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder="Share only what you observed..." className="w-full resize-none rounded-xl border border-[#dbe5f0] px-3.5 py-3 text-[12px] leading-5 text-[#274563] outline-none placeholder:text-[#a1b0bf] focus:border-[#76a9e6] focus:ring-4 focus:ring-[#eaf2ff]" />
                      <span className="mt-1.5 block text-right text-[10px] text-[#9aaabd]">{description.length}/500</span>
                    </label>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-[#dbeaf7] bg-[#f5faff] px-4 py-4">
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#dceeff] text-[#2875bb]"><UploadCloud size={18} /></div>
                        <div>
                          <p className="text-[12px] font-extrabold text-[#294664]">Add anything that may help explain the report</p>
                          <p className="mt-1 text-[11px] leading-5 text-[#6d829a]">Photos, fare receipts, or notes are optional. Please avoid uploading private information about other people.</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border-2 border-dashed border-[#cbdcea] bg-[#fbfdff] px-5 py-7 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf2ff] text-[#0c5bce]"><Paperclip size={20} /></div>
                      <p className="mt-3 text-[12px] font-extrabold text-[#36516d]">Supporting evidence is optional</p>
                      <p className="mt-1 text-[11px] text-[#91a2b4]">This prototype simulates an attachment preview.</p>
                      <button type="button" onClick={addEvidence} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#b9d2e9] bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#0c5bce] transition hover:bg-[#f0f7ff]"><Plus size={15} />Add sample attachment</button>
                    </div>
                    <div className="space-y-2.5">
                      {evidence.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#e1eaf2] bg-white p-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#edf5fb] text-[#4a86b6]">{item.kind === "image" ? <FileImage size={19} /> : <Paperclip size={18} />}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate text-[11px] font-extrabold text-[#36516d]">{item.name}</p>
                              <button type="button" onClick={() => removeEvidence(item.id)} aria-label={`Remove ${item.name}`} className="rounded-lg p-1.5 text-[#9aabba] hover:bg-[#fff2f0] hover:text-[#c76554]"><Trash2 size={15} /></button>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8eff5]"><div className={`h-full rounded-full transition-all duration-300 ${item.status === "ready" ? "bg-[#36a476]" : "bg-[#4f94da]"}`} style={{ width: `${item.progress}%` }} /></div>
                              <span className="w-[62px] text-right text-[10px] font-bold text-[#8ea2b5]">{item.status === "ready" ? item.size : `${item.progress}%`}</span>
                            </div>
                            {item.status === "ready" ? <p className="mt-1 text-[10px] font-bold text-[#319369]">Preview ready</p> : <p className="mt-1 text-[10px] font-medium text-[#7d98b1]">Preparing preview…</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 rounded-2xl bg-[#fff9eb] px-4 py-3.5 text-[#80662e]">
                      <Info size={16} className="mt-0.5 shrink-0" />
                      <p className="text-[11px] leading-5">Supporting evidence can provide context, but it is not required for a report to be reviewed.</p>
                    </div>
                  </div>
                ) : null}

                {step === 4 ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#dbeaf7] bg-[#f5faff] px-4 py-4">
                      <div className="flex gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#2875bb]" /><p className="text-[11px] leading-5 text-[#58758f]">Please check your details. Sending a report shares your account of an experience with the conduct team for review.</p></div>
                    </div>
                    <div className="divide-y divide-[#edf1f5] rounded-2xl border border-[#e1eaf2]">
                      <div className="flex items-start justify-between gap-4 px-4 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9aaabd]">Vehicle</p><p className="mt-1 text-[13px] font-extrabold text-[#294664]">{selected.name}</p><p className="mt-1 font-mono text-[10px] font-bold tracking-[0.08em] text-[#0c5bce]">{selected.identifier}</p></div><CarFront size={18} className="text-[#6d8baa]" /></div>
                      <div className="flex items-start justify-between gap-4 px-4 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9aaabd]">Concern</p><p className="mt-1 text-[13px] font-extrabold text-[#294664]">{category === "Other" && otherCategory ? otherCategory : category}</p><p className="mt-1 text-[11px] text-[#71859e]">{formatDate(incidentDate)} at {formatTime(incidentTime)}</p></div><ClipboardCheck size={18} className="text-[#6d8baa]" /></div>
                      <div className="flex items-start justify-between gap-4 px-4 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9aaabd]">Place and description</p><p className="mt-1 text-[12px] font-bold text-[#294664]">{location}</p><p className="mt-1 max-w-[480px] text-[11px] leading-5 text-[#71859e]">{description || "No description provided."}</p></div><MapPin size={18} className="shrink-0 text-[#6d8baa]" /></div>
                      <div className="flex items-start justify-between gap-4 px-4 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9aaabd]">Supporting evidence</p><p className="mt-1 text-[12px] font-extrabold text-[#294664]">{evidence.length ? `${evidence.length} attachment${evidence.length === 1 ? "" : "s"}` : "None added"}</p></div><Paperclip size={18} className="text-[#6d8baa]" /></div>
                    </div>
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e0e8f0] bg-[#fbfdff] px-4 py-3.5"><input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 accent-[#0c5bce]" /><span className="text-[11px] leading-5 text-[#637b93]">I have shared what I observed as accurately as I can. I understand this report will be reviewed and is not a confirmed violation.</span></label>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#edf1f5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <button type="button" onClick={goBack} disabled={step === 1} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[12px] font-extrabold transition ${step === 1 ? "cursor-not-allowed text-[#bec9d4]" : "text-[#6e849d] hover:bg-[#f4f7fb] hover:text-[#345371]"}`}><ArrowLeft size={16} />Back</button>
                {step < 4 ? (
                  <button type="button" onClick={goNext} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0c5bce] px-5 py-3 text-[12px] font-extrabold text-white shadow-[0_7px_16px_rgba(12,91,206,0.2)] transition hover:bg-[#084da9]">Continue<ArrowRight size={16} /></button>
                ) : (
                  <button type="button" onClick={submitReport} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0c5bce] px-5 py-3 text-[12px] font-extrabold text-white shadow-[0_7px_16px_rgba(12,91,206,0.2)] transition hover:bg-[#084da9]">Send report<Send size={15} /></button>
                )}
              </div>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] leading-4 text-[#9aabba]"><ShieldCheck size={13} />Your report is shown only to the conduct review team in this prototype.</p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

export default SubmitReport;
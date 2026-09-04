import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileImage,
  FileText,
  Filter,
  History,
  LockKeyhole,
  MapPin,
  MessageSquareText,
  Paperclip,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";

type ReviewStatus = "For review" | "Needs follow-up" | "Resolved";

type ReviewNote = {
  id: number;
  author: string;
  role: string;
  time: string;
  note: string;
};

type Report = {
  id: string;
  category: string;
  submitted: string;
  age: string;
  location: string;
  summary: string;
  status: ReviewStatus;
  reference: string;
  reporter: string;
  driver: {
    name: string;
    plate: string;
    unit: string;
    route: string;
    contact: string;
  };
  evidence: { name: string; type: "image" | "document"; meta: string }[];
  notes: ReviewNote[];
};

const reports: Report[] = [
  {
    id: "OS-24018",
    category: "Passenger safety",
    submitted: "18 Jun 2024, 08:42",
    age: "24 min ago",
    location: "Old Sagay public market",
    summary:
      "A student passenger reported that the tricycle moved before they were fully seated near the market loading area.",
    status: "For review",
    reference: "RPT-OS-24018",
    reporter: "SUNN student • identity protected",
    driver: {
      name: "Rogelio M. Dela Cruz",
      plate: "NBT 4821",
      unit: "Old Sagay Tricycle Association",
      route: "Old Sagay – Sagay proper",
      contact: "0917 ••• •482",
    },
    evidence: [
      { name: "market-loading-area.jpg", type: "image", meta: "Mock image • 1.8 MB" },
      { name: "student-statement.txt", type: "document", meta: "Mock document • 2 KB" },
    ],
    notes: [
      {
        id: 1,
        author: "A. Reyes",
        role: "PNP reviewer",
        time: "18 Jun 2024, 08:51",
        note: "Initial review opened. Confirm the loading area and identify any available witnesses.",
      },
    ],
  },
  {
    id: "OS-24017",
    category: "Route concern",
    submitted: "18 Jun 2024, 07:56",
    age: "1 hr ago",
    location: "SUNN east gate",
    summary: "A report noted that a tricycle declined a short trip to the east gate during peak arrival time.",
    status: "Needs follow-up",
    reference: "RPT-OS-24017",
    reporter: "SUNN student • identity protected",
    driver: {
      name: "Maribel S. Navarro",
      plate: "NBX 1904",
      unit: "Old Sagay Tricycle Association",
      route: "SUNN – Old Sagay centro",
      contact: "0920 ••• •904",
    },
    evidence: [{ name: "route-context.pdf", type: "document", meta: "Mock document • 64 KB" }],
    notes: [
      {
        id: 2,
        author: "A. Reyes",
        role: "PNP reviewer",
        time: "18 Jun 2024, 08:20",
        note: "Request a short statement from the driver before determining next steps.",
      },
    ],
  },
  {
    id: "OS-24016",
    category: "Fare concern",
    submitted: "17 Jun 2024, 16:18",
    age: "Yesterday",
    location: "Barangay Old Sagay hall",
    summary: "A passenger asked for clarification after being charged a fare different from the posted local rate.",
    status: "For review",
    reference: "RPT-OS-24016",
    reporter: "SUNN student • identity protected",
    driver: {
      name: "Joel P. Amador",
      plate: "NBY 7310",
      unit: "Old Sagay Tricycle Association",
      route: "Old Sagay hall – Sagay proper",
      contact: "0908 ••• •310",
    },
    evidence: [{ name: "fare-board-reference.jpg", type: "image", meta: "Mock image • 928 KB" }],
    notes: [],
  },
  {
    id: "OS-24012",
    category: "Conduct concern",
    submitted: "15 Jun 2024, 11:04",
    age: "3 days ago",
    location: "SUNN south gate",
    summary: "A student described an uncomfortable exchange while asking whether the vehicle was available for hire.",
    status: "Resolved",
    reference: "RPT-OS-24012",
    reporter: "SUNN student • identity protected",
    driver: {
      name: "Cesar T. Villanueva",
      plate: "NBS 5508",
      unit: "Old Sagay Tricycle Association",
      route: "SUNN – Old Sagay centro",
      contact: "0919 ••• •508",
    },
    evidence: [{ name: "review-summary.txt", type: "document", meta: "Mock document • 3 KB" }],
    notes: [
      {
        id: 3,
        author: "A. Reyes",
        role: "PNP reviewer",
        time: "16 Jun 2024, 14:10",
        note: "Parties were informed of the review outcome. No further action recorded in this prototype.",
      },
    ],
  },
];

const statusStyles: Record<ReviewStatus, string> = {
  "For review": "bg-[#fff5e8] text-[#a76419] ring-[#f4d8ad]",
  "Needs follow-up": "bg-[#edf1ff] text-[#4d5ca8] ring-[#d7ddfa]",
  Resolved: "bg-[#eaf7f1] text-[#25765d] ring-[#c8e8d8]",
};

function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${statusStyles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function PNPReview() {
  const [selectedId, setSelectedId] = useState(reports[0].id);
  const [query, setQuery] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isNoteComposerOpen, setIsNoteComposerOpen] = useState(false);
  const [showOpenReportsOnly, setShowOpenReportsOnly] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [localNotes, setLocalNotes] = useState<Record<string, ReviewNote[]>>({});

  const selectedReport = reports.find((report) => report.id === selectedId) ?? reports[0];
  const filteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const availableReports = showOpenReportsOnly ? reports.filter((report) => report.status !== "Resolved") : reports;
    if (!normalizedQuery) return availableReports;
    return availableReports.filter((report) =>
      [report.id, report.category, report.location, report.driver.name].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [query, showOpenReportsOnly]);

  const selectedNotes = [...selectedReport.notes, ...(localNotes[selectedReport.id] ?? [])];

  function addReviewNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedNote = noteText.trim();
    if (!trimmedNote) return;

    const newNote: ReviewNote = {
      id: Date.now(),
      author: "A. Reyes",
      role: "PNP reviewer",
      time: "Just now",
      note: trimmedNote,
    };

    setLocalNotes((current) => ({
      ...current,
      [selectedReport.id]: [...(current[selectedReport.id] ?? []), newNote],
    }));
    setNoteText("");
    setIsNoteComposerOpen(false);
  }

  return (
    <AppLayout officer active="Reports" title="Reports" eyebrow="Restricted review center">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[22px] border border-[#cddbea] bg-[#eef5fc] shadow-[0_8px_24px_rgba(27,58,96,0.04)]">
          <div className="flex flex-col gap-4 border-l-4 border-[#557ba4] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#dbe9f7] text-[#315b84]">
                <LockKeyhole size={17} strokeWidth={2} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.13em] text-[#315b84]">Authorized access</p>
                  <span className="rounded-full bg-[#d8e6f4] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#567795]">
                    PNP personnel
                  </span>
                </div>
                <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[#5e748d]">
                  This workspace contains restricted mock records for review by authorized personnel only. Handle student and driver information with care.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-[11px] font-semibold text-[#66809c] sm:pr-1">
              <ShieldCheck size={15} className="text-[#557ba4]" />
              <span>Access logged for prototype</span>
            </div>
          </div>
        </section>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8ca0b6]">Civic reports</p>
            <h2 className="mt-1 text-[25px] font-extrabold tracking-[-0.035em] text-[#163154]">Review queue</h2>
            <p className="mt-1.5 text-[13px] text-[#71859e]">Assess submitted reports before any determination is made.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#dbe5f0] bg-white px-3 py-2 text-[11px] font-semibold text-[#69819a] shadow-sm">
            <Clock3 size={14} className="text-[#7f96ad]" />
            <span>Last refreshed 09:06</span>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.65fr)]">
          <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#dbe5f0] bg-white shadow-[0_8px_26px_rgba(29,64,101,0.045)]">
            <div className="border-b border-[#e8eef5] px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-extrabold text-[#213d5b]">Authorized reports</h3>
                  <p className="mt-1 text-[11px] text-[#8799ad]">{reports.length} mock records in queue</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOpenReportsOnly((current) => !current)}
                  className={`rounded-lg p-2 transition ${showOpenReportsOnly ? "bg-[#e8f0f8] text-[#456887]" : "text-[#8296ac] hover:bg-[#f1f5f9] hover:text-[#456887]"}`}
                  aria-label={showOpenReportsOnly ? "Show all reports" : "Show open reports only"}
                  title={showOpenReportsOnly ? "Show all reports" : "Show open reports only"}
                >
                  <Filter size={16} />
                </button>
              </div>
              <label className="relative mt-4 block">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aaabd]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search ID, category, location"
                  className="h-10 w-full rounded-xl border border-[#dce6f0] bg-[#f8fafc] pl-9 pr-3 text-[12px] font-medium text-[#304c69] outline-none transition placeholder:text-[#9eafc0] focus:border-[#8eacc9] focus:bg-white focus:ring-2 focus:ring-[#e6eff8]"
                />
              </label>
            </div>
            <div className="divide-y divide-[#edf1f5]">
              {filteredReports.length ? (
                filteredReports.map((report) => {
                  const isSelected = selectedReport.id === report.id;
                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(report.id);
                        setIsNoteComposerOpen(false);
                        setNoteText("");
                      }}
                      className={`group relative w-full px-4 py-4 text-left transition sm:px-5 ${isSelected ? "bg-[#f3f7fc]" : "bg-white hover:bg-[#fafcfe]"}`}
                    >
                      {isSelected ? <span className="absolute inset-y-0 left-0 w-1 bg-[#557ba4]" /> : null}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold tracking-[0.08em] text-[#6683a0]">{report.id}</span>
                            {report.status === "For review" ? <span className="h-1.5 w-1.5 rounded-full bg-[#e7a34e]" /> : null}
                          </div>
                          <p className="mt-1.5 truncate text-[13px] font-bold text-[#294765]">{report.category}</p>
                          <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-[#8093a8]">
                            <MapPin size={12} />
                            {report.location}
                          </p>
                        </div>
                        <ChevronRight size={16} className={`mt-1 shrink-0 transition ${isSelected ? "text-[#557ba4]" : "text-[#b0bfcd] group-hover:text-[#7893ae]"}`} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <StatusBadge status={report.status} />
                        <span className="text-[10px] font-medium text-[#9aaabd]">{report.age}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-5 py-12 text-center">
                  <Search size={19} className="mx-auto text-[#a7b7c7]" />
                  <p className="mt-3 text-[12px] font-bold text-[#5f7891]">No matching reports</p>
                  <p className="mt-1 text-[11px] text-[#9aaabd]">Try a report ID or category.</p>
                </div>
              )}
            </div>
            <div className="border-t border-[#e8eef5] bg-[#fbfcfe] px-4 py-3.5 sm:px-5">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-[#879db3]" />
                <p className="text-[10px] leading-4 text-[#8295a9]">
                  Reports are submitted accounts for review and are not confirmed violations.
                </p>
              </div>
            </div>
          </section>

          <section className="min-w-0 space-y-5">
            <div className="overflow-hidden rounded-[20px] border border-[#dbe5f0] bg-white shadow-[0_8px_26px_rgba(29,64,101,0.045)]">
              <div className="border-b border-[#e8eef5] px-5 py-5 sm:px-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-bold tracking-[0.1em] text-[#6683a0]">{selectedReport.reference}</span>
                      <StatusBadge status={selectedReport.status} />
                    </div>
                    <h3 className="mt-2 text-[20px] font-extrabold tracking-[-0.025em] text-[#1b3857]">{selectedReport.category}</h3>
                    <p className="mt-1 text-[12px] text-[#7c90a5]">Submitted {selectedReport.submitted}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[1.25fr_0.75fr]">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#91a2b4]">
                    <FileText size={14} />
                    Incident details
                  </div>
                  <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[#46617b]">{selectedReport.summary}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#f7f9fc] px-3.5 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#95a6b7]">Reported location</p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[#4d6881]">
                        <MapPin size={13} className="text-[#7894ae]" />
                        {selectedReport.location}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#f7f9fc] px-3.5 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#95a6b7]">Submitted by</p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[#4d6881]">
                        <UserRound size={13} className="text-[#7894ae]" />
                        {selectedReport.reporter}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-[#e1e9f1] bg-[#fbfcfe] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#91a2b4]">
                    <CalendarDays size={14} />
                    Review state
                  </div>
                  <p className="mt-3 text-[13px] font-bold text-[#36536e]">{selectedReport.status}</p>
                  <p className="mt-1 text-[11px] leading-4 text-[#8295a9]">Status shown for this fictional record. No determination has been made.</p>
                  <button
                    type="button"
                    onClick={() => setShowChecklist((current) => !current)}
                    className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#547797] transition hover:text-[#315b84]"
                  >
                    {showChecklist ? "Close review checklist" : "Open review checklist"}
                    <ArrowUpRight size={13} />
                  </button>
                  {showChecklist ? (
                    <div className="mt-3 space-y-2 border-t border-[#e5ebf2] pt-3">
                      {["Review the account and evidence", "Record relevant observations", "Select a next step when ready"].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-[10px] font-semibold text-[#71879c]">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#b9ccde]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#7292ad]" />
                          </span>
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-[#e8eef5] px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#91a2b4]">
                    <Paperclip size={14} />
                    Evidence
                  </div>
                  <span className="text-[10px] font-semibold text-[#9aabba]">Mock files only</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {selectedReport.evidence.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 rounded-xl border border-[#e5ebf2] bg-[#fbfcfe] px-3 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f0f8] text-[#6685a2]">
                        {item.type === "image" ? <FileImage size={15} /> : <FileText size={15} />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold text-[#4b6680]">{item.name}</p>
                        <p className="mt-0.5 text-[10px] text-[#9aabba]">{item.meta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.75fr)]">
              <section className="rounded-[20px] border border-[#dbe5f0] bg-white shadow-[0_8px_26px_rgba(29,64,101,0.045)]">
                <div className="flex items-center justify-between border-b border-[#e8eef5] px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#91a2b4]">
                    <MessageSquareText size={14} />
                    Review notes
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNoteComposerOpen((open) => !open)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#edf4fb] px-2.5 py-2 text-[10px] font-bold text-[#4b7192] transition hover:bg-[#e2eef9]"
                  >
                    {isNoteComposerOpen ? <X size={13} /> : <Plus size={13} />}
                    {isNoteComposerOpen ? "Close" : "Add note"}
                  </button>
                </div>
                {isNoteComposerOpen ? (
                  <form onSubmit={addReviewNote} className="border-b border-[#e8eef5] bg-[#fbfcfe] px-5 py-4 sm:px-6">
                    <label htmlFor="review-note" className="text-[11px] font-bold text-[#516d86]">Add an internal review note</label>
                    <textarea
                      id="review-note"
                      value={noteText}
                      onChange={(event) => setNoteText(event.target.value)}
                      placeholder="Record an observation or next step..."
                      rows={3}
                      className="mt-2 w-full resize-none rounded-xl border border-[#dce6f0] bg-white px-3 py-2.5 text-[12px] leading-5 text-[#3c5872] outline-none placeholder:text-[#a3b2c1] focus:border-[#8eacc9] focus:ring-2 focus:ring-[#e6eff8]"
                    />
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <span className="text-[10px] text-[#9aabba]">Saved locally in this prototype.</span>
                      <button type="submit" disabled={!noteText.trim()} className="rounded-lg bg-[#315b84] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-[#274b6d] disabled:cursor-not-allowed disabled:opacity-40">
                        Save note
                      </button>
                    </div>
                  </form>
                ) : null}
                <div className="space-y-0 px-5 sm:px-6">
                  {selectedNotes.length ? (
                    selectedNotes.map((note, index) => (
                      <div key={note.id} className={`relative flex gap-3 py-4 ${index < selectedNotes.length - 1 ? "border-b border-[#eef2f6]" : ""}`}>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f0f8] text-[10px] font-extrabold text-[#5b7a99]">
                          AR
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-[11px] font-bold text-[#4a6580]">{note.author}</p>
                            <span className="text-[10px] text-[#9aabba]">{note.role}</span>
                            <span className="text-[10px] text-[#b0bdca]">•</span>
                            <span className="text-[10px] text-[#9aabba]">{note.time}</span>
                          </div>
                          <p className="mt-1.5 text-[12px] leading-5 text-[#657d94]">{note.note}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-9 text-center">
                      <MessageSquareText size={19} className="mx-auto text-[#b0bfcd]" />
                      <p className="mt-2.5 text-[12px] font-bold text-[#6b839a]">No review notes yet</p>
                      <p className="mt-1 text-[11px] text-[#9aabba]">Add a note to keep the review trail clear.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[20px] border border-[#dbe5f0] bg-white shadow-[0_8px_26px_rgba(29,64,101,0.045)]">
                <div className="flex items-center gap-2 border-b border-[#e8eef5] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#91a2b4] sm:px-6">
                  <UserRound size={14} />
                  Driver information
                </div>
                <div className="space-y-3 px-5 py-4 sm:px-6">
                  {[
                    ["Name", selectedReport.driver.name],
                    ["Plate number", selectedReport.driver.plate],
                    ["Association", selectedReport.driver.unit],
                    ["Usual route", selectedReport.driver.route],
                    ["Contact", selectedReport.driver.contact],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-4 border-b border-[#f0f3f6] pb-3 last:border-0 last:pb-0">
                      <p className="text-[10px] font-semibold text-[#94a5b6]">{label}</p>
                      <p className="max-w-[65%] text-right text-[11px] font-bold leading-4 text-[#4a6680]">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mx-5 mb-5 flex items-start gap-2 rounded-xl bg-[#f7f9fc] px-3 py-2.5 sm:mx-6">
                  <LockKeyhole size={13} className="mt-0.5 shrink-0 text-[#8ea3b8]" />
                  <p className="text-[10px] leading-4 text-[#8295a9]">Visible only in this restricted review workspace.</p>
                </div>
              </section>
            </div>

            <section className="rounded-[20px] border border-[#dbe5f0] bg-white shadow-[0_8px_26px_rgba(29,64,101,0.045)]">
              <div className="flex items-center gap-2 border-b border-[#e8eef5] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#91a2b4] sm:px-6">
                <History size={14} />
                Review history
              </div>
              <div className="grid gap-3 px-5 py-4 sm:grid-cols-3 sm:px-6">
                {[
                  ["18 Jun 2024, 08:42", "Report received", "System intake"],
                  ["18 Jun 2024, 08:51", "Review opened", "A. Reyes • PNP reviewer"],
                  ["Current", selectedReport.status, "Awaiting next review action"],
                ].map(([time, title, detail], index) => (
                  <div key={`${time}-${title}`} className="relative flex gap-3 sm:block">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf4fb] text-[#5e80a0] sm:mb-3">
                      {index === 2 ? <Clock3 size={14} /> : <CheckCircle2 size={14} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[#9aabba]">{time}</p>
                      <p className="mt-1 text-[12px] font-bold text-[#526d86]">{title}</p>
                      <p className="mt-1 text-[10px] text-[#8b9daf]">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

export default PNPReview;
import { useEffect, useState } from "react";
import {
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
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";
import { apiRequest, checkApiHealth, getCurrentUser } from "../../../lib/api";
import { requestCurrentDeviceLocation } from "../../../lib/deviceLocation";
import { createLocalReportId, saveOfflineReport } from "../../../lib/offlineReports";
import { getOfflineAccountData } from "../../../lib/offlineAccount";
import { AiConductAssistant } from "./_shared/AiConductAssistant";

type Driver = {
  id: number;
  name: string;
  identifier: string;
  driverCode?: string | null;
  plateNumber?: string | null;
  contactNumber?: string | null;
  todaName?: string | null;
  todaAddress?: string | null;
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

const drivers: Driver[] = [];
/*
  {
    id: 1,
    name: "Rogelio D. Santos",
    identifier: "OS-4821",
    color: "bg-[#dceeff] text-[#1660a8]",
    initials: "RS",
    route: "Old Sagay • Market loop",
  },
  {
    id: 2,
    name: "Maribel A. Cruz",
    identifier: "OS-3176",
    color: "bg-[#fbe8dc] text-[#b85e3d]",
    initials: "MC",
    route: "Old Sagay • Campus loop",
  },
  {
    id: 3,
    name: "Jonas P. Villanueva",
    identifier: "OS-9084",
    color: "bg-[#e8e4fb] text-[#6656a9]",
    initials: "JV",
    route: "Old Sagay • Riverside loop",
  },
];
*/

const categories = [
  "Overcharging",
  "Reckless Driving",
  "Refusal to Transport",
  "Discourteous Behavior",
  "Unsafe Driving",
  "Other",
] as const;

const fallbackCategoryDescriptions: Record<string, string> = {
  Overcharging: "The fare collected differed from the posted or agreed route fare.",
  "Reckless Driving": "The driver used unsafe speed, sudden stops, or risky vehicle operation.",
  "Refusal to Transport": "The driver declined a valid route or passenger request.",
  "Discourteous Behavior": "The driver acted disrespectfully or inappropriately.",
  "Unsafe Driving": "The incident raised a passenger safety concern during the trip.",
  Other: "This concern does not match another category.",
};

function getCategoryDescription(categoryName: string, categoryDescription?: string) {
  return categoryDescription || fallbackCategoryDescriptions[categoryName] || "Choose the category that best matches what you observed.";
}

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

function getDeviceIncidentDateTime() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}

export function SubmitReport() {
  useEffect(() => {
    if (getCurrentUser()?.role !== "STUDENT") {
      window.location.replace(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/Profile`);
    }
  }, []);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [driverSearch, setDriverSearch] = useState("");
  const [liveDrivers, setLiveDrivers] = useState<Driver[]>([]);
  const [liveCategories, setLiveCategories] = useState<{ id: number; name: string; description?: string }[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [categoryDescriptionSeed, setCategoryDescriptionSeed] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [incidentDate, setIncidentDate] = useState(() => getDeviceIncidentDateTime().date);
  const [incidentTime, setIncidentTime] = useState(() => getDeviceIncidentDateTime().time);
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number; accuracy: number; capturedAt: string } | null>(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reportId, setReportId] = useState("");
  const [queuedReportLocalId, setQueuedReportLocalId] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<"submitted" | "queued" | "pending" | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  useEffect(() => {
    const onSynced = (event: Event) => {
      const detail = (event as CustomEvent<{ localReportId: string; trackingNumber: string }>).detail;
      if (!detail || detail.localReportId !== queuedReportLocalId) return;
      setReportId(detail.trackingNumber);
      setSubmissionState("submitted");
      setNotice("Your report reached the server. Use this tracking number to check its progress online.");
    };
    window.addEventListener("app:offline-report-synced", onSynced);
    return () => window.removeEventListener("app:offline-report-synced", onSynced);
  }, [queuedReportLocalId]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiRequest<{ drivers: Array<{ id: number; fullName: string; driverCode?: string | null; tricycleIdentifier: string; plateNumber?: string | null; routeArea: string | null; contactNumber?: string | null; todaName?: string | null; todaBarangay?: string | null; todaCity?: string | null; todaProvince?: string | null }> }>("/drivers"),
      apiRequest<{ categories: Array<{ id: number; name: string; description?: string }> }>("/categories"),
    ])
      .then(([driverData, categoryData]) => {
        if (cancelled) return;
        setLiveDrivers(
          driverData.drivers.map((driver) => ({
            id: driver.id,
            name: driver.fullName,
            identifier: driver.tricycleIdentifier,
            driverCode: driver.driverCode,
            plateNumber: driver.plateNumber,
            contactNumber: driver.contactNumber,
            todaName: driver.todaName,
            todaAddress: [driver.todaBarangay, driver.todaCity, driver.todaProvince].filter(Boolean).join(", "),
            route: driver.routeArea ?? "Old Sagay TODA",
            initials: driver.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
            color: "bg-[#dceeff] text-[#1660a8]",
          })),
        );
        setLiveCategories(categoryData.categories);
        if (categoryData.categories[0]) {
          const firstCategory = categoryData.categories[0];
          setCategory(firstCategory.name);
          const firstDescription = getCategoryDescription(firstCategory.name, firstCategory.description);
          setDescription(firstDescription);
          setCategoryDescriptionSeed(firstDescription);
        }
      })
      .catch(async () => {
        const cached = await getOfflineAccountData().catch(() => null);
        if (cached?.drivers.length && cached.categories.length) {
          setLiveDrivers(cached.drivers.map((driver) => ({
            id: driver.id,
            name: driver.fullName,
            identifier: driver.tricycleIdentifier,
            driverCode: driver.driverCode,
            plateNumber: driver.plateNumber,
            contactNumber: driver.contactNumber,
            todaName: driver.todaName,
            todaAddress: [driver.todaBarangay, driver.todaCity, driver.todaProvince].filter(Boolean).join(", "),
            route: driver.routeArea ?? "Old Sagay TODA",
            initials: driver.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
            color: "bg-[#dceeff] text-[#1660a8]",
          })));
          setLiveCategories(cached.categories);
          const firstCategory = cached.categories[0];
          setCategory(firstCategory.name);
          const firstDescription = getCategoryDescription(firstCategory.name, firstCategory.description);
          setDescription(firstDescription);
          setCategoryDescriptionSeed(firstDescription);
          setNotice("Offline mode: using the account data saved on this device.");
        } else {
          setNotice("Connect once while online to download official drivers and categories before using offline mode.");
        }
      })
      .finally(() => !cancelled && setIsLoadingData(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleDrivers = liveDrivers;
  const filteredDrivers = visibleDrivers.filter((driver) => {
    const query = driverSearch.trim().toLowerCase();
    if (!query) return true;
    return `${driver.name} ${driver.identifier} ${driver.driverCode ?? ""} ${driver.plateNumber ?? ""} ${driver.contactNumber ?? ""} ${driver.route} ${driver.todaName ?? ""} ${driver.todaAddress ?? ""}`.toLowerCase().includes(query);
  });

  const selected = liveDrivers.find((driver) => driver.identifier === selectedDriver);
  const visibleCategories = liveCategories.map((item) => item.name);
  const selectedCategoryRecord = liveCategories.find((item) => item.name === category);
  const selectedCategoryDescription = getCategoryDescription(category, selectedCategoryRecord?.description);

  const selectCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    const nextDescription = getCategoryDescription(
      nextCategory,
      liveCategories.find((item) => item.name === nextCategory)?.description,
    );
    setDescription((current) => {
      if (!current.trim()) return nextDescription;
      if (categoryDescriptionSeed && current.startsWith(categoryDescriptionSeed)) {
        return `${nextDescription}${current.slice(categoryDescriptionSeed.length)}`;
      }
      return `${nextDescription}\n\n${current}`;
    });
    setCategoryDescriptionSeed(nextDescription);
  };

  const removeEvidence = (id: number) => {
    const removedIndex = evidence.findIndex((item) => item.id === id);
    setEvidence((current) => current.filter((item) => item.id !== id));
    if (removedIndex >= 0) setAttachmentFiles((current) => current.filter((_, index) => index !== removedIndex));
  };

  const captureLocation = async () => {
    if (!window.isSecureContext) {
      setLocationStatus("GPS requires a secure HTTPS connection. A plain HTTP address on your local network blocks location access. You can enter the incident location manually.");
      return;
    }
    setIsLocating(true);
    setLocationStatus("Requesting permission and locating your device...");
    try {
      const position = await requestCurrentDeviceLocation();
      const { coords } = position;
      const accuracy = Math.round(coords.accuracy);
      setCoordinates({ latitude: coords.latitude, longitude: coords.longitude, accuracy, capturedAt: new Date(position.timestamp).toISOString() });
      setLocation("GPS location captured (accuracy +/- " + accuracy + " m)");
      setLocationStatus("Current location captured for this report.");
    } catch (error) {
      setLocationStatus(error instanceof Error ? error.message : "Unable to access your location. You can enter the place manually.");
    } finally {
      setIsLocating(false);
    }
  };

  const resetReport = () => {
    setIsSubmitted(false);
    setReportId("");
    setQueuedReportLocalId(null);
    setSubmissionState(null);
    setHasAcknowledged(false);
    const firstCategory = liveCategories[0];
    const firstDescription = firstCategory ? getCategoryDescription(firstCategory.name, firstCategory.description) : "";
    setDescription(firstDescription);
    setCategoryDescriptionSeed(firstDescription);
    setOtherCategory("");
    setCategory(firstCategory?.name ?? "");
    setLocation("");
    setCoordinates(null);
    setLocationStatus("");
    setIsLocating(false);
    const now = getDeviceIncidentDateTime();
    setIncidentDate(now.date);
    setIncidentTime(now.time);
    setEvidence([]);
    setAttachmentFiles([]);
  };

  const submitReport = async () => {
    if (!selected) {
      setNotice(isLoadingData ? "Loading registered drivers from the database?" : "Select the driver or vehicle before submitting.");
      return;
    }
    if (!incidentDate || !incidentTime) {
      setNotice("Please provide the date and approximate time of the incident before submitting.");
      return;
    }
    if (category === "Other" && !otherCategory.trim()) {
      setNotice("Please name the type of concern before submitting.");
      return;
    }
    if (!location.trim() || description.trim().length < 15) {
      setNotice(!location.trim() ? "Please enter where the incident happened." : "Please describe what happened in at least 15 characters.");
      return;
    }
    if (description.trim() === categoryDescriptionSeed.trim()) {
      setNotice("Please add details about what happened beyond the category description.");
      return;
    }
    if (!hasAcknowledged) {
      setNotice("Please confirm that your report is accurate to the best of your knowledge.");
      return;
    }
    const categoryRecord = liveCategories.find((item) => item.name === category);
    if (!categoryRecord) {
      setNotice("Official complaint categories are still loading. Please try again.");
      return;
    }
    setIsSubmitting(true);
    setNotice("");
    const localReportId = createLocalReportId();
    const reportDescription = category === "Other" && otherCategory ? `${otherCategory}\n\n${description}` : description;
    const offlineReport = {
      localReportId,
      driverId: String(selected.id),
      categoryId: String(categoryRecord.id),
      incidentDate,
      incidentTime,
      location,
      description: reportDescription,
      ...(coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude, locationAccuracy: coordinates.accuracy, locationCapturedAt: coordinates.capturedAt } : {}),
      attachments: attachmentFiles,
      status: "Saved offline" as const,
      savedAt: new Date().toISOString(),
      retryCount: 0,
    };
    // navigator.onLine only reports whether Android has a network interface.
    // Use the actual API health endpoint to decide whether this is offline.
    const apiIsReachable = await checkApiHealth();
    if (!apiIsReachable) {
      try {
        await saveOfflineReport(offlineReport);
        setQueuedReportLocalId(localReportId);
        setReportId(`OFFLINE-${localReportId.slice(-8).toUpperCase()}`);
        setSubmissionState("queued");
        setSubmissionMessage("The online API could not be reached. This report is saved on this device and will sync when the API is available.");
        setNotice("No internet connection. Your report was saved on this device.");
        setIsSubmitted(true);
      } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save the report offline."); }
      finally { setIsSubmitting(false); }
      return;
    }
    const body = new FormData();
    body.append("localReportId", localReportId);
    body.append("driverId", String(selected.id));
    body.append("categoryId", String(categoryRecord.id));
    body.append("incidentDate", incidentDate);
    body.append("incidentTime", incidentTime);
    body.append("location", location);
    if (coordinates) {
      body.append("latitude", String(coordinates.latitude));
      body.append("longitude", String(coordinates.longitude));
      body.append("locationAccuracy", String(coordinates.accuracy));
      body.append("locationCapturedAt", coordinates.capturedAt);
    }
    body.append("description", reportDescription);
    attachmentFiles.forEach((file) => body.append("attachments[]", file));
    try {
      const data = await apiRequest<{ complaint: { referenceNumber: string } }>("/complaints", { method: "POST", body });
      if (!data?.complaint?.referenceNumber || !/^TRC-\d{4}-\d{6}$/.test(data.complaint.referenceNumber)) {
        throw new Error("The server accepted the request without returning a tracking number. Check My reports before submitting again.");
      }
      setReportId(data.complaint.referenceNumber);
      setSubmissionState("submitted");
      setIsSubmitted(true);
    } catch (error) {
      try {
        await saveOfflineReport({ ...offlineReport, status: "Upload failed", lastError: error instanceof Error ? error.message : "Upload failed." });
        setQueuedReportLocalId(localReportId);
        // API health was successful, so this was an online attempt. The server
        // did not accept it, therefore it has no tracking number yet.
        setReportId("");
        setSubmissionState("pending");
        const failure = error instanceof Error ? error.message : "The server did not accept the report.";
        setSubmissionMessage(`The server did not accept this report yet. It is saved on this device for retry. No tracking number has been assigned. ${failure}`);
        setNotice("The server did not accept the report. It was saved on this device for retry.");
        setIsSubmitted(true);
        if (navigator.onLine) window.dispatchEvent(new Event("app:offline-report-queued"));
      } catch (offlineError) {
        setNotice(offlineError instanceof Error ? offlineError.message : "Unable to submit or save the complaint.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AppLayout active="Submit report" title="Submit a report" eyebrow="Student space">
        <div className="mx-auto max-w-[820px] py-3 lg:py-9">
          <div className="overflow-hidden rounded-[28px] border border-[#d7e5f1] bg-white shadow-[0_18px_55px_rgba(38,76,114,0.10)]">
            <div className="relative overflow-hidden bg-[#f0f7ff] px-6 pb-9 pt-10 text-center sm:px-12">
              <div className="absolute -right-14 -top-20 h-56 w-56 rounded-full border-[24px] border-white/60" />
              <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full border-[20px] border-[#dceeff]/80" />
              <div className={`relative mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full ${submissionState !== "submitted" ? "bg-[#fff1d3] text-[#a77518] shadow-[0_8px_22px_rgba(167,117,24,0.12)]" : "bg-[#d9f3e8] text-[#16815a] shadow-[0_8px_22px_rgba(21,125,87,0.12)]"}`}>
                {submissionState !== "submitted" ? <CircleAlert size={34} strokeWidth={2.2} /> : <Check size={36} strokeWidth={2.6} />}
              </div>
              <p className="relative mt-6 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#2b906c]">
                {submissionState === "queued" ? "Saved offline on this device" : submissionState === "pending" ? "Waiting for server acceptance" : "Report received"}
              </p>
              <h2 className="relative mt-2 text-[28px] font-extrabold tracking-[-0.04em] text-[#163154] sm:text-[34px]">
                Thank you for speaking up.
              </h2>
              <p className="relative mx-auto mt-3 max-w-[540px] text-[14px] leading-6 text-[#607993]">
                {submissionState === "queued" ? submissionMessage : submissionState === "pending" ? submissionMessage : "Your report has been recorded for review. It is an account for the conduct team to assess, not a confirmed violation."}
              </p>
            </div>
            <div className="space-y-5 px-6 py-6 sm:px-12 sm:py-8">
              {reportId ? <div className="flex items-center justify-between rounded-2xl border border-[#e1eaf2] bg-[#fbfdff] px-4 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a7bb]">{submissionState === "queued" ? "Offline queue reference" : "Online tracking number"}</p>
                  <p className="mt-1 font-mono text-[17px] font-bold tracking-[0.08em] text-[#18385e]">{reportId}</p>
                </div>
                <BadgeCheck size={23} className="text-[#278b68]" />
              </div> : <div className="rounded-2xl border border-[#f2dfb8] bg-[#fff9eb] px-4 py-4 text-[12px] font-semibold leading-5 text-[#82652d]">No tracking number yet. The server assigns one after it accepts the report.</div>}
              <div className="flex gap-3 rounded-2xl bg-[#fff9eb] px-4 py-4 text-[#82652d]">
                <Info size={17} className="mt-0.5 shrink-0" />
                <p className="text-[12px] leading-5">
                  {submissionState === "queued" || submissionState === "pending" ? "Open Pending reports to retry and check its sync status. It will appear in My reports after the server accepts it." : "You can check the status of this report in My reports. Reviews may take time as the team checks the details and any supporting evidence."}
                </p>
              </div>
              {submissionState === "queued" || submissionState === "pending" ? <button type="button" onClick={() => { window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/PendingReports`; }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#b9d2e9] bg-white px-4 py-3 text-[12px] font-extrabold text-[#0c5bce] hover:bg-[#f0f7ff]">View pending reports <ArrowRight size={15} /></button> : null}
              {submissionState === "submitted" && reportId ? <button type="button" onClick={() => { window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/Landing?track=${encodeURIComponent(reportId)}`; }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#b9d2e9] bg-white px-4 py-3 text-[12px] font-extrabold text-[#0c5bce] hover:bg-[#f0f7ff]">Track this report online <ArrowRight size={15} /></button> : null}
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
      <div className="mx-auto min-w-0 max-w-[1220px]">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-7 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eaf2ff] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#0c5bce]">
              <ClipboardCheck size={13} />
              New report
            </div>
            <h2 className="text-[25px] font-extrabold leading-tight tracking-[-0.045em] text-[#163154] sm:text-[36px]">Tell us what happened.</h2>
            <p className="mt-2 max-w-[650px] text-[13px] leading-5 text-[#6d829a]">
              A few clear details help the conduct team understand your experience. You can review everything before it is sent.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 self-start rounded-full border border-[#dbe5f0] bg-white px-3 py-2 text-[10px] font-bold text-[#6e849d] sm:self-auto sm:text-[11px]">
            <ShieldCheck size={15} className="text-[#278b68]" />
            Private student report
          </div>
        </div>

        <div className="mx-auto min-w-0 max-w-[900px]">

          <section className="min-w-0">
            <div className="overflow-hidden rounded-[22px] border border-[#dbe5f0] bg-white shadow-[0_15px_45px_rgba(35,72,108,0.07)] sm:rounded-[26px]">
              <div className="border-b border-[#edf1f5] bg-[#fbfdff] px-5 py-4 sm:px-8 sm:py-5">
                <h3 className="text-[16px] font-extrabold tracking-[-0.025em] text-[#18385e] sm:text-[20px]">Report details</h3>
                <p className="mt-1 text-[11px] text-[#8295aa]">Complete the required fields, then review and send your report.</p>
              </div>

              <div className="space-y-7 bg-white px-4 py-5 sm:px-8 sm:py-8">
                                  <div className="space-y-6">
                    <div>
                      <div className="mb-3 flex items-end justify-between gap-3">
                        <div>
                          <label className="text-[13px] font-extrabold text-[#294664]">Select the driver or vehicle</label>
                          <p className="mt-1 text-[11px] text-[#8ca0b5]">Choose the driver you confirmed during the trip.</p>
                        </div>
                        <span className="hidden text-[10px] font-bold text-[#9aabbe] sm:block">{isLoadingData ? "Loading records" : `${visibleDrivers.length} active records`}</span>
                      </div>
                       <div className="relative">
                         <input
                           type="search"
                           value={driverSearch}
                           onChange={(event) => { setDriverSearch(event.target.value); setSelectedDriver(""); }}
                           disabled={isLoadingData || !liveDrivers.length}
                           placeholder={isLoadingData ? "Loading registered drivers…" : liveDrivers.length ? "Type driver name or vehicle identifier" : "No registered drivers available"}
                           aria-label="Search registered drivers"
                           className="h-12 w-full rounded-xl border border-[#dbe5f0] bg-[#fbfdff] px-4 text-[12px] font-bold text-[#274563] outline-none transition placeholder:font-semibold placeholder:text-[#9aabbe] hover:border-[#76a9e6] focus:border-[#76a9e6] focus:ring-4 focus:ring-[#eaf2ff] disabled:cursor-wait disabled:opacity-60"
                         />
                         {!selected && driverSearch.trim() && liveDrivers.length ? (
                           <div className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-60 overflow-y-auto rounded-xl border border-[#cfe0ef] bg-white p-1.5 shadow-[0_16px_36px_rgba(35,72,108,0.18)]" role="listbox" aria-label="Matching drivers">
                             {filteredDrivers.length ? filteredDrivers.map((driver) => (
                               <button key={driver.identifier} type="button" role="option" aria-selected={false} onClick={() => { setSelectedDriver(driver.identifier); setDriverSearch(`${driver.name} · ${driver.identifier}`); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[#294664] transition hover:bg-[#f5f9fd]">
                                 <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${driver.color}`}>{driver.initials}</span>
                                 <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-extrabold">{driver.name}</span><span className="mt-0.5 block truncate font-mono text-[10px]">{driver.identifier} · {driver.route}</span></span>
                               </button>
                             )) : <p className="px-3 py-4 text-center text-[11px] font-semibold text-[#8295a9]">No matching driver or vehicle.</p>}
                           </div>
                         ) : null}
                       </div>
                      {selected ? (
                        <div className="mt-3 rounded-2xl border border-[#4d91db] bg-[#f3f8ff] p-4 shadow-[0_6px_18px_rgba(48,119,190,0.10)]">
                          <div className="flex items-start gap-3">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold ${selected.color}`}>{selected.initials}</span>
                            <div className="min-w-0 flex-1"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d91db]">Confirmed driver</p><p className="mt-1 break-words text-[13px] font-extrabold text-[#294664]">{selected.name}</p><p className="mt-1 font-mono text-[10px] font-bold tracking-[0.08em] text-[#0c5bce]">{selected.identifier}</p><p className="mt-1 text-[10px] text-[#8ca0b5]">{selected.route}</p></div>
                            <Check size={18} className="shrink-0 text-[#16815a]" strokeWidth={3} />
                          </div>
                        </div>
                      ) : <p className="mt-3 rounded-xl bg-[#f7f9fc] px-3 py-2.5 text-[10px] font-semibold text-[#8295a9]">Select the driver before continuing. The selected driver will be attached to this report.</p>}
                    </div>
                    {selected ? (
                      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                        {[
                          ["Driver code", selected.driverCode],
                          ["Vehicle identifier", selected.identifier],
                          ["Plate number", selected.plateNumber],
                          ["Mobile number", selected.contactNumber],
                          ["Route / service area", selected.route],
                          ["TODA", selected.todaName],
                          ["Registered TODA address", selected.todaAddress],
                        ].map(([label, value]) => (
                          <div key={label} className="min-w-0 rounded-2xl bg-[#f5f9fd] p-4">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#6384a5]">{label}</p>
                            {label === "Mobile number" && value ? <a href={`tel:${value}`} className="mt-2 block break-words text-[14px] font-extrabold text-[#0c5bce] underline">{value}</a> : <p className="mt-2 break-words text-[14px] font-extrabold text-[#17375d]">{value || "Not recorded"}</p>}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex min-w-0 gap-3 rounded-2xl border border-[#dbeaf7] bg-[#f5faff] px-4 py-3.5 text-[#547493]">
                      <Info size={16} className="mt-0.5 shrink-0 text-[#4384c5]" />
                      <p className="min-w-0 break-words text-[11px] leading-5">If you are unsure of the driver name, use the vehicle identifier printed on the tricycle.</p>
                    </div>
                  </div>

                                  <div className="space-y-6">
                    <div>
                      <label className="text-[13px] font-extrabold text-[#294664]">What was the concern?</label>
                      <p className="mt-1 text-[11px] text-[#8ca0b5]">Select the category that best describes the experience.</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {visibleCategories.map((item) => (
                          <button
                            type="button"
                            key={item}
                            onClick={() => selectCategory(item)}
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
                      <p className="mt-2 text-[11px] leading-5 text-[#8295aa]">{selectedCategoryDescription}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#49647e]"><CalendarDays size={15} className="text-[#7190ad]" />Date</span>
                        <input required type="date" value={incidentDate} onChange={(event) => setIncidentDate(event.target.value)} className="h-11 w-full rounded-xl border border-[#dbe5f0] bg-white px-3 text-[12px] font-medium text-[#274563] outline-none focus:border-[#76a9e6] focus:ring-4 focus:ring-[#eaf2ff]" />
                      </label>
                      <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#49647e]"><Clock3 size={15} className="text-[#7190ad]" />Approximate time</span>
                        <input required type="time" value={incidentTime} onChange={(event) => setIncidentTime(event.target.value)} className="h-11 w-full rounded-xl border border-[#dbe5f0] bg-white px-3 text-[12px] font-medium text-[#274563] outline-none focus:border-[#76a9e6] focus:ring-4 focus:ring-[#eaf2ff]" />
                      </label>
                    </div>
                    <p className="-mt-2 text-[10px] text-[#8294a8]">Defaults to this phone’s date and time. Change it if the incident happened earlier.</p>
                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#49647e]"><MapPin size={15} className="text-[#7190ad]" />Where did this happen?</span>
                      <div className="relative">
                        <MapPin size={15} className="absolute left-3.5 top-3.5 text-[#9aaabd]" />
                        <input value={location} onChange={(event) => { setLocation(event.target.value); setCoordinates(null); setLocationStatus(""); }} placeholder="Enter a place or use current location" className="h-11 w-full rounded-xl border border-[#dbe5f0] px-10 pr-10 text-[12px] text-[#274563] outline-none focus:border-[#76a9e6] focus:ring-4 focus:ring-[#eaf2ff]" />
                        <ChevronDown size={15} className="absolute right-3.5 top-3.5 text-[#a0afbd]" />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={captureLocation} disabled={isLocating} className="inline-flex items-center gap-2 rounded-lg border border-[#b9d2e9] bg-[#f5faff] px-3 py-2 text-[11px] font-extrabold text-[#0c5bce] hover:bg-[#eaf3ff] disabled:cursor-wait disabled:opacity-60"><MapPin size={14} />{isLocating ? "Locating..." : "Use my current location"}</button>
                        {coordinates ? <span className="text-[10px] font-bold text-[#319369]">GPS attached: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}</span> : null}
                      </div>
                      <p className="mt-2 text-[10px] leading-4 text-[#8295aa]">Location is captured only when you choose it and submitted with this report.</p>
                      {locationStatus ? <p role="status" aria-live="polite" className="mt-1 text-[10px] font-semibold text-[#52718d]">{locationStatus}</p> : null}
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[12px] font-extrabold text-[#49647e]">What happened?</span>
                      <span className="mb-2 block text-[10px] text-[#8295aa]">The category description is added as a starting point. Edit it to match what you observed.</span>
                      <textarea value={description} maxLength={500} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder="Describe what happened in your own words (at least 15 characters)..." className="w-full resize-none rounded-xl border border-[#dbe5f0] px-3.5 py-3 text-[12px] leading-5 text-[#274563] outline-none placeholder:text-[#a1b0bf] focus:border-[#76a9e6] focus:ring-4 focus:ring-[#eaf2ff]" />
                      <span className="mt-1.5 block text-right text-[10px] text-[#9aaabd]">{description.length}/500</span>
                    </label>
                    <AiConductAssistant task="report" content={`Category: ${category === "Other" ? otherCategory : category}\nReport: ${description}`} onApplyDraft={setDescription} />
                  </div>

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
                      <p className="mt-1 text-[11px] text-[#91a2b4]">Attachments are prepared securely for submission.</p>
                      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#b9d2e9] bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#0c5bce] transition hover:bg-[#f0f7ff]">
                        <Plus size={15} />Add attachment
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="sr-only"
                          onChange={(event) => {
                            const files = Array.from(event.target.files ?? []);
                            const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
                            const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024 && allowedTypes.includes(file.type));
                            if (validFiles.length !== files.length) setNotice("Only JPG, PNG, WebP, or PDF files up to 5 MB each can be attached. Invalid files were skipped.");
                            if (!validFiles.length) { event.target.value = ""; return; }
                            setAttachmentFiles((current) => [...current, ...validFiles]);
                            setEvidence((current) => [
                              ...current,
                              ...validFiles.map((file, index) => ({
                                id: Date.now() + index,
                                name: file.name,
                                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                                kind: file.type.startsWith("image/") ? "image" as const : "note" as const,
                                progress: 100,
                                status: "ready" as const,
                              })),
                            ]);
                            event.target.value = "";
                          }}
                        />
                      </label>
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

                                  <details className="rounded-2xl border border-[#e1eaf2] bg-white px-4 py-3">
                    <summary className="cursor-pointer text-[12px] font-extrabold text-[#294664]">Review report details</summary>
                    <div className="mt-3 space-y-4">
                    <div className="rounded-2xl border border-[#dbeaf7] bg-[#f5faff] px-4 py-4">
                      <div className="flex gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#2875bb]" /><p className="text-[11px] leading-5 text-[#58758f]">Please check your details. Sending a report shares your account of an experience with the conduct team for review.</p></div>
                    </div>
                    <div className="divide-y divide-[#edf1f5] rounded-2xl border border-[#e1eaf2]">
                      <div className="flex items-start justify-between gap-4 px-4 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9aaabd]">Vehicle</p><p className="mt-1 text-[13px] font-extrabold text-[#294664]">{selected?.name ?? "No driver selected"}</p><p className="mt-1 font-mono text-[10px] font-bold tracking-[0.08em] text-[#0c5bce]">{selected?.identifier ?? "Not available"}</p></div><CarFront size={18} className="text-[#6d8baa]" /></div>
                      <div className="flex items-start justify-between gap-4 px-4 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9aaabd]">Concern</p><p className="mt-1 text-[13px] font-extrabold text-[#294664]">{category === "Other" && otherCategory ? otherCategory : category}</p><p className="mt-1 text-[11px] text-[#71859e]">{formatDate(incidentDate)} at {formatTime(incidentTime)}</p></div><ClipboardCheck size={18} className="text-[#6d8baa]" /></div>
                      <div className="flex items-start justify-between gap-4 px-4 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9aaabd]">Place and description</p><p className="mt-1 text-[12px] font-bold text-[#294664]">{location}</p><p className="mt-1 max-w-[480px] text-[11px] leading-5 text-[#71859e]">{description || "No description provided."}</p></div><MapPin size={18} className="shrink-0 text-[#6d8baa]" /></div>
                      <div className="flex items-start justify-between gap-4 px-4 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9aaabd]">Supporting evidence</p><p className="mt-1 text-[12px] font-extrabold text-[#294664]">{evidence.length ? `${evidence.length} attachment${evidence.length === 1 ? "" : "s"}` : "None added"}</p></div><Paperclip size={18} className="text-[#6d8baa]" /></div>
                    </div>
                    </div>
                  </details>
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e0e8f0] bg-[#fbfdff] px-4 py-3.5"><input type="checkbox" checked={hasAcknowledged} onChange={(event) => setHasAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0c5bce]" /><span className="text-[11px] leading-5 text-[#637b93]">I have shared what I observed as accurately as I can. I understand this report will be reviewed and is not a confirmed violation.</span></label>
              </div>

              <div className="flex justify-end border-t border-[#dfeaf4] bg-[#f8fbff] px-4 py-4 sm:px-8">
                <button type="button" onClick={submitReport} disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0c5bce] px-5 py-3.5 text-[12px] font-extrabold text-white shadow-[0_8px_18px_rgba(12,91,206,0.22)] transition hover:bg-[#084da9] disabled:cursor-wait disabled:bg-[#7da5cb] sm:min-h-0 sm:w-auto sm:rounded-xl sm:py-3 sm:shadow-[0_7px_16px_rgba(12,91,206,0.2)]">{isSubmitting ? "Sending..." : "Send report"}<Send size={15} /></button>
              </div>
            </div>
            {notice ? <p className="mt-4 rounded-xl border border-[#f1d7c9] bg-[#fff7f2] px-4 py-3 text-center text-[12px] font-semibold text-[#9b6048]">{notice}</p> : null}
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] leading-4 text-[#9aabba]"><ShieldCheck size={13} />Your report is shown only to the conduct review team.</p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

export default SubmitReport;

import { useState } from "react";
import { AlertCircle, Check, LoaderCircle, Sparkles } from "lucide-react";
import { apiRequest } from "../../../../lib/api";

export type AiAssistResult = {
  summary: string;
  draft?: string | null;
  incidentDescription?: string;
  suggestions: string[];
  missingDetails: string[];
};

export function AiConductAssistant({
  task,
  content,
  onApplyDraft,
  compact = false,
}: {
  task: "report" | "review" | "dashboard";
  content: string;
  onApplyDraft?: (draft: string) => void;
  compact?: boolean;
}) {
  const [result, setResult] = useState<AiAssistResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const runAssistant = async () => {
    if (!content.trim()) {
      setError("Add report details first, then ask the assistant to review them.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await apiRequest<{ result: AiAssistResult }>("/ai/assist", {
        method: "POST",
        body: JSON.stringify({ task, content: content.slice(0, 12000) }),
      });
      setResult(response.result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI assistant is unavailable.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`rounded-2xl border border-[#cfe0f3] bg-[#f5f9ff] ${compact ? "p-4" : "p-5"}`} aria-label="AI conduct assistant">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e2edff] text-[#286dc2]"><Sparkles size={17} /></span>
          <div><p className="text-[12px] font-extrabold text-[#24496f]">AI Conduct Assistant</p><p className="mt-0.5 text-[10px] text-[#71869d]">Writing and workflow support; staff remain responsible for decisions.</p></div>
        </div>
        <button type="button" onClick={runAssistant} disabled={busy || !content.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#0c5bce] px-3.5 py-2.5 text-[11px] font-extrabold text-white hover:bg-[#084da9] disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}{busy ? "Reviewing…" : result ? "Refresh suggestions" : "Get AI suggestions"}
        </button>
      </div>
      <p className="mt-3 text-[9px] leading-4 text-[#8798aa]">Selecting this sends the text shown to your administrator-configured AI provider. Avoid names and other identifying details.</p>
      {error ? <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-[11px] leading-5 text-[#9a5b22]"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</p> : null}
      {result ? <div className="mt-4 space-y-3 rounded-xl border border-[#e1eaf4] bg-white p-4">
        <p className="text-[12px] leading-5 text-[#3f5873]">{result.summary}</p>
        {result.draft && onApplyDraft ? <div className="rounded-xl bg-[#f7faff] p-3"><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#7890a8]">Suggested neutral draft</p><p className="mt-2 whitespace-pre-wrap text-[11px] leading-5 text-[#3f5873]">{result.draft}</p><button type="button" onClick={() => onApplyDraft(result.draft!)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#bdd4eb] bg-white px-3 py-2 text-[10px] font-extrabold text-[#0c5bce]"><Check size={13} />Use draft (review before sending)</button></div> : null}
        {task === "report" && result.incidentDescription ? <div className="rounded-xl border border-[#d6e9df] bg-[#f5fbf7] p-3"><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#54846b]">Description of what happened</p><p className="mt-2 whitespace-pre-wrap text-[11px] leading-5 text-[#3f5873]">{result.incidentDescription}</p>{onApplyDraft ? <button type="button" onClick={() => onApplyDraft(result.incidentDescription!.slice(0, 500))} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#c8dfd1] bg-white px-3 py-2 text-[10px] font-extrabold text-[#287451]"><Check size={13} />Use this description</button> : null}</div> : null}
        {result.suggestions?.length ? <div><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#7890a8]">Suggestions</p><ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] leading-5 text-[#526b84]">{result.suggestions.map((item, index) => <li key={index}>{item}</li>)}</ul></div> : null}
        {result.missingDetails?.length ? <div><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#9a702c]">Details to check</p><ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] leading-5 text-[#806b45]">{result.missingDetails.map((item, index) => <li key={index}>{item}</li>)}</ul></div> : null}
        <p className="border-t border-[#edf1f5] pt-2 text-[9px] leading-4 text-[#8798aa]">AI can miss context. Verify every suggestion against the original report and school procedures.</p>
      </div> : null}
    </section>
  );
}

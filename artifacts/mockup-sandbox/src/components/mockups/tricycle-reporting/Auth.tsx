import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { login, registerStudent } from "../../../lib/api";

type AuthMode = "login" | "register";
type RegistrationStep = 1 | 2 | 3;
type AccountRole = "studentDriver" | "personnel";
type Notice = { type: "error" | "success"; message: string } | null;

const registrationSteps = [
  { number: 1, label: "Account" },
  { number: 2, label: "Student Information" },
  { number: 3, label: "Confirmation" },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "text-white"}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#0c5bce] text-white shadow-[0_8px_22px_rgba(12,91,206,0.22)]">
        <ShieldCheck size={21} strokeWidth={2.2} />
      </span>
      <span>
        <span className="block text-[13px] font-extrabold tracking-[-0.02em] text-current">
          Tricycle Conduct
        </span>
        <span className={`block text-[11px] font-medium ${compact ? "text-[#7890aa]" : "text-[#a5c4dc]"}`}>
          Old Sagay · SUNN
        </span>
      </span>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#617d98]">
          {label}
        </label>
        {hint ? <span className="text-[11px] font-medium text-[#91a6ba]">{hint}</span> : null}
      </div>
      <div className="relative mt-2">
        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a7bb]" size={16} strokeWidth={1.8} />
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[13px] border border-[#d3e2ed] bg-[#fbfdff] py-3.5 pl-10 pr-11 text-[13px] font-semibold text-[#234564] outline-none transition-[border,box-shadow] placeholder:font-medium placeholder:text-[#a5b5c3] focus:border-[#79a9d1] focus:ring-4 focus:ring-[#e0effd]"
          autoComplete={id === "password" ? "current-password" : "new-password"}
          placeholder={id === "password" ? "Enter your password" : "Create a password"}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-[#7f97ab] transition-colors hover:bg-[#edf5fb] hover:text-[#315a7c]"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
        </button>
      </div>
    </div>
  );
}

function NoticeBanner({ notice }: { notice: Notice }) {
  if (!notice) return null;

  const isSuccess = notice.type === "success";
  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`mb-5 flex items-start gap-2.5 rounded-[13px] border px-3.5 py-3 text-[12px] leading-5 ${
        isSuccess
          ? "border-[#cde7df] bg-[#eff9f5] text-[#34766a]"
          : "border-[#f1d7c9] bg-[#fff7f2] text-[#9b6048]"
      }`}
    >
      {isSuccess ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <CircleAlert size={16} className="mt-0.5 shrink-0" />}
      <span>{notice.message}</span>
    </div>
  );
}

function LoadingLabel({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <span aria-hidden="true" className="inline-flex gap-0.5">
        <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:0ms]" />
        <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:140ms]" />
        <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:280ms]" />
      </span>
    </span>
  );
}

export function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<AccountRole>("studentDriver");
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    studentId: "",
    program: "",
    yearLevel: "",
    hasReadNotice: false,
  });

  const updateForm = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
    setNotice(null);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setForgotPassword(false);
    setComplete(false);
    setNotice(null);
    setRegistrationStep(1);
  };

  const validateEmail = () => {
    if (!form.email.trim()) return "Enter the email or account identifier for this preview.";
    if (!form.email.includes("@") && role === "studentDriver") return "Use a valid email address, such as name@sunn.edu.ph.";
    return null;
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailError = validateEmail();
    if (emailError) {
      setNotice({ type: "error", message: emailError });
      return;
    }
    if (!form.password.trim()) {
      setNotice({ type: "error", message: "Enter your password to continue." });
      return;
    }

    setNotice(null);
    setIsLoading(true);
    login(form.email, form.password)
      .then(() => {
        setComplete(true);
        setNotice({ type: "success", message: "Sign-in complete. Your secure session is ready." });
      })
      .catch((error) => {
        setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to sign in." });
      })
      .finally(() => {
      setIsLoading(false);
      });
  };

  const handleForgotPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailError = validateEmail();
    if (emailError) {
      setNotice({ type: "error", message: emailError });
      return;
    }

    setNotice(null);
    setIsLoading(true);
    window.setTimeout(() => {
      setIsLoading(false);
      setComplete(true);
      setNotice({
        type: "success",
        message: "In a live service, reset instructions would be sent to this address.",
      });
    }, 750);
  };

  const handleRegistrationNext = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (registrationStep === 1) {
      const emailError = validateEmail();
      if (emailError) {
        setNotice({ type: "error", message: emailError });
        return;
      }
      if (form.password.length < 8) {
        setNotice({ type: "error", message: "Use at least 8 characters for your password." });
        return;
      }
      if (form.password !== form.confirmPassword) {
        setNotice({ type: "error", message: "The passwords do not match yet." });
        return;
      }
      setNotice(null);
      setRegistrationStep(2);
      return;
    }

    if (registrationStep === 2) {
      if (!form.fullName.trim() || !form.studentId.trim() || !form.program || !form.yearLevel) {
        setNotice({ type: "error", message: "Complete each student information field before continuing." });
        return;
      }
      if (!form.hasReadNotice) {
        setNotice({ type: "error", message: "Please acknowledge the information notice to continue." });
        return;
      }
      setNotice(null);
      setRegistrationStep(3);
      return;
    }

    setNotice(null);
    setIsLoading(true);
    registerStudent({
      fullName: form.fullName,
      studentId: form.studentId,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      program: form.program,
      yearLevel: form.yearLevel,
    })
      .then(() => {
        setComplete(true);
        setNotice({ type: "success", message: "Registration complete. Your student account was created." });
      })
      .catch((error) => {
        setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to complete registration." });
      })
      .finally(() => {
      setIsLoading(false);
      });
  };

  const resetToLogin = () => {
    setMode("login");
    setForgotPassword(false);
    setComplete(false);
    setNotice(null);
    setRegistrationStep(1);
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#f7fbff] text-[#173552]">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(370px,0.82fr)_minmax(580px,1.18fr)]">
        <aside className="relative isolate overflow-hidden bg-[#103651] px-6 py-7 text-white sm:px-10 lg:px-12 lg:py-10">
          <div className="absolute inset-0 -z-10 opacity-50 [background-image:radial-gradient(#6ea5bd_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
          <div className="absolute -right-28 top-20 -z-10 h-[410px] w-[410px] rounded-full border border-[#82bfc5]/20" />
          <div className="absolute -right-16 top-32 -z-10 h-[290px] w-[290px] rounded-full border border-[#82bfc5]/20" />
          <div className="absolute -bottom-24 -left-20 -z-10 h-[310px] w-[310px] rounded-full bg-[#197078]/35 blur-3xl" />

          <BrandMark />

          <div className="mx-auto max-w-[480px] pb-9 pt-20 sm:pt-24 lg:pt-[clamp(100px,17vh,190px)]">
            <div className="mb-7 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#91d0ce]">
              <span className="h-px w-8 bg-[#63b9b3]" />
              A shared record for safer rides
            </div>
            <h1 className="max-w-[490px] text-[clamp(34px,4vw,57px)] font-extrabold leading-[0.98] tracking-[-0.06em] text-[#f4fbff]">
              Speak clearly.
              <span className="block text-[#88d0c8]">Be heard fairly.</span>
            </h1>
            <p className="mt-7 max-w-[420px] text-[14px] leading-7 text-[#b7d0dc]">
              A student-centered way to share transport concerns in Barangay Old Sagay. Details are organized for review; a report is not a confirmed violation.
            </p>

            <div className="mt-11 grid max-w-[450px] gap-3 sm:grid-cols-2">
              <div className="rounded-[17px] border border-[#8dc2cc]/20 bg-[#174560]/75 p-4 backdrop-blur-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d6f0eb]/10 text-[#96ded3]">
                  <LockKeyhole size={16} strokeWidth={1.8} />
                </div>
                <p className="mt-3 text-[12px] font-extrabold text-[#ecf8fa]">Private reference</p>
                <p className="mt-1 text-[11px] leading-5 text-[#9ab9c7]">Keep a personal code to check progress.</p>
              </div>
              <div className="rounded-[17px] border border-[#8dc2cc]/20 bg-[#174560]/75 p-4 backdrop-blur-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5dfb1]/10 text-[#f5d896]">
                  <MapPin size={16} strokeWidth={1.8} />
                </div>
                <p className="mt-3 text-[12px] font-extrabold text-[#ecf8fa]">Local context</p>
                <p className="mt-1 text-[11px] leading-5 text-[#9ab9c7]">For SUNN and Old Sagay communities.</p>
              </div>
            </div>
          </div>

          <div className="mx-auto flex max-w-[480px] items-center justify-between border-t border-[#8dc2cc]/20 pt-5 text-[10px] font-semibold text-[#8eafbd]">
            <span>Prototype workspace</span>
            <span className="flex items-center gap-1.5 text-[#a7d5d1]"><ShieldCheck size={13} /> Information notice</span>
          </div>
        </aside>

        <main className="relative flex min-h-[620px] flex-col bg-[#f7fbff] px-5 py-6 sm:px-10 sm:py-9 lg:px-[clamp(50px,8vw,145px)] lg:py-10">
          <div className="flex items-center justify-between">
            <BrandMark compact />
            <div className="hidden items-center gap-2 text-[11px] font-semibold text-[#8299ad] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#56a895]" />
              Demo mode · fictional data
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[510px] flex-1 flex-col justify-center py-12 lg:py-16">
            {complete ? (
              <div className="animate-[auth-rise_500ms_ease-out_both]">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#e3f5ef] text-[#278b7d]">
                  <CheckCircle2 size={27} strokeWidth={1.8} />
                </div>
                <p className="mt-8 text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#5a9c95]">
                  Preview complete
                </p>
                <h2 className="mt-3 text-[31px] font-extrabold tracking-[-0.055em] text-[#173b5d]">
                  You can keep exploring.
                </h2>
                <p className="mt-4 max-w-[420px] text-[13px] leading-6 text-[#71889e]">
                  This interaction shows how the flow responds. No credentials, account details, or messages were saved.
                </p>
                <div className="mt-7 rounded-[16px] border border-[#d8e8ee] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef4fb] text-[#0c5bce]">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <p className="text-[12px] font-extrabold text-[#315574]">What happens next in a live service</p>
                      <p className="mt-1 text-[11px] leading-5 text-[#7b91a4]">
                        The account holder would return to their appropriate workspace. Review of any report would remain a separate process.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetToLogin}
                  className="mt-7 inline-flex items-center gap-2 rounded-[12px] bg-[#0c5bce] px-5 py-3.5 text-[12px] font-extrabold text-white shadow-[0_9px_20px_rgba(12,91,206,0.16)] transition-transform hover:-translate-y-0.5"
                >
                  Return to sign in <ArrowRight size={15} />
                </button>
              </div>
            ) : forgotPassword ? (
              <section className="animate-[auth-rise_500ms_ease-out_both]" aria-labelledby="forgot-title">
                <button
                  type="button"
                  onClick={() => { setForgotPassword(false); setNotice(null); }}
                  className="mb-9 inline-flex items-center gap-2 text-[12px] font-extrabold text-[#63829a] transition-colors hover:text-[#0c5bce]"
                >
                  <ArrowLeft size={15} /> Back to sign in
                </button>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#5a9c95]">Account help</p>
                <h2 id="forgot-title" className="mt-3 text-[31px] font-extrabold tracking-[-0.055em] text-[#173b5d]">
                  Reset your password
                </h2>
                <p className="mt-3 max-w-[430px] text-[13px] leading-6 text-[#71889e]">
                  Enter the email or account identifier you use for this preview. We will show the next step without sending anything.
                </p>
                <form onSubmit={handleForgotPassword} className="mt-8">
                  <NoticeBanner notice={notice} />
                  <label htmlFor="forgot-email" className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#617d98]">
                    Email or account
                  </label>
                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a7bb]" size={16} strokeWidth={1.8} />
                    <input
                      id="forgot-email"
                      type={role === "studentDriver" ? "email" : "text"}
                      value={form.email}
                      onChange={(event) => updateForm("email", event.target.value)}
                      className="w-full rounded-[13px] border border-[#d3e2ed] bg-[#fbfdff] py-3.5 pl-10 pr-4 text-[13px] font-semibold text-[#234564] outline-none transition-[border,box-shadow] placeholder:font-medium placeholder:text-[#a5b5c3] focus:border-[#79a9d1] focus:ring-4 focus:ring-[#e0effd]"
                      placeholder="name@sunn.edu.ph"
                      autoComplete="email"
                    />
                  </div>
                  <button type="submit" disabled={isLoading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#0c5bce] py-3.5 text-[13px] font-extrabold text-white transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#094fae] disabled:cursor-wait disabled:bg-[#7da5cb]">
                    {isLoading ? <LoadingLabel>Preparing preview</LoadingLabel> : <>Show reset step <ArrowRight size={16} /></>}
                  </button>
                </form>
              </section>
            ) : (
              <section className="animate-[auth-rise_500ms_ease-out_both]" aria-labelledby="auth-title">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#5a9c95]">
                      {mode === "login" ? "Welcome back" : "Create a student account"}
                    </p>
                    <h2 id="auth-title" className="mt-3 text-[31px] font-extrabold tracking-[-0.055em] text-[#173b5d]">
                      {mode === "login" ? "Sign in to continue" : "Start with the basics"}
                    </h2>
                  </div>
                  <div className="hidden h-11 w-11 items-center justify-center rounded-[14px] border border-[#d6e6ef] bg-white text-[#5d8fa1] sm:flex">
                    {mode === "login" ? <KeyRound size={19} strokeWidth={1.7} /> : <UserRound size={19} strokeWidth={1.7} />}
                  </div>
                </div>

                <p className="mt-3 max-w-[440px] text-[13px] leading-6 text-[#71889e]">
                  {mode === "login"
                    ? "Use your account details to view your reports and updates."
                    : "The account is for this prototype only. You can review every detail before the flow is completed."}
                </p>

                {mode === "register" ? (
                  <div className="mt-7 flex items-center">
                    {registrationSteps.map((step, index) => {
                      const isCurrent = registrationStep === step.number;
                      const isDone = registrationStep > step.number;
                      return (
                        <div key={step.number} className={`flex items-center ${index < registrationSteps.length - 1 ? "flex-1" : ""}`}>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold ${
                              isDone ? "bg-[#dff3ed] text-[#298b7d]" : isCurrent ? "bg-[#0c5bce] text-white shadow-[0_5px_12px_rgba(12,91,206,0.2)]" : "bg-[#e8f0f5] text-[#91a5b7]"
                            }`}>
                              {isDone ? <Check size={14} strokeWidth={2.5} /> : step.number}
                            </span>
                            <span className={`hidden text-[10px] font-extrabold sm:block ${isCurrent ? "text-[#315b7b]" : "text-[#9aabba]"}`}>
                              {step.label}
                            </span>
                          </div>
                          {index < registrationSteps.length - 1 ? <span className={`mx-2 h-px flex-1 ${isDone ? "bg-[#9cd6c9]" : "bg-[#dbe7ee]"}`} /> : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <div className="mt-7 rounded-[13px] border border-[#dce9ef] bg-[#eef7f7] p-1">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setRole("studentDriver")}
                      className={`flex items-center justify-center gap-2 rounded-[10px] py-2.5 text-[11px] font-extrabold transition-colors ${role === "studentDriver" ? "bg-white text-[#1c5b75] shadow-sm" : "text-[#7c99a7] hover:text-[#38677e]"}`}
                    >
                      <GraduationCap size={15} /> Student / Driver
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("personnel")}
                      className={`flex items-center justify-center gap-2 rounded-[10px] py-2.5 text-[11px] font-extrabold transition-colors ${role === "personnel" ? "bg-white text-[#1c5b75] shadow-sm" : "text-[#7c99a7] hover:text-[#38677e]"}`}
                    >
                      <Building2 size={15} /> Authorized / TODA President
                    </button>
                  </div>
                </div>

                <form onSubmit={mode === "login" ? handleLogin : handleRegistrationNext} className="mt-6">
                  <NoticeBanner notice={notice} />

                  {mode === "login" ? (
                    <>
                      <label htmlFor="email" className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#617d98]">
                        Email or account
                      </label>
                      <div className="relative mt-2">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a7bb]" size={16} strokeWidth={1.8} />
                        <input
                          id="email"
                          type="text"
                          value={form.email}
                          onChange={(event) => updateForm("email", event.target.value)}
                          className="w-full rounded-[13px] border border-[#d3e2ed] bg-[#fbfdff] py-3.5 pl-10 pr-4 text-[13px] font-semibold text-[#234564] outline-none transition-[border,box-shadow] placeholder:font-medium placeholder:text-[#a5b5c3] focus:border-[#79a9d1] focus:ring-4 focus:ring-[#e0effd]"
                          placeholder={role === "studentDriver" ? "student@sunn.edu.ph or driver account" : "toda-president@oldsagay.gov.ph"}
                          autoComplete="email"
                        />
                      </div>
                      <div className="mt-5">
                        <PasswordField id="password" label="Password" value={form.password} onChange={(value) => updateForm("password", value)} visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-[#71889e]">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(event) => setRememberMe(event.target.checked)}
                            className="h-4 w-4 rounded border-[#c6d8e4] accent-[#0c5bce]"
                          />
                          Remember this device
                        </label>
                        <button type="button" onClick={() => { setForgotPassword(true); setNotice(null); setComplete(false); }} className="text-[12px] font-extrabold text-[#0c5bce] hover:text-[#084b9e]">
                          Forgot password?
                        </button>
                      </div>
                      <button type="submit" disabled={isLoading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#0c5bce] py-3.5 text-[13px] font-extrabold text-white shadow-[0_9px_20px_rgba(12,91,206,0.16)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#094fae] disabled:cursor-wait disabled:bg-[#7da5cb]">
                        {isLoading ? <LoadingLabel>Checking details</LoadingLabel> : <>Sign in <ArrowRight size={16} /></>}
                      </button>
                      <div className="mt-5 rounded-[14px] border border-[#d8e8ee] bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef4fb] text-[#0c5bce]">
                            <KeyRound size={15} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#7c99ab]">Testing accounts</p>
                            <div className="mt-3 space-y-2 text-[12px]">
                              <div className="flex flex-col gap-1 rounded-xl bg-[#f7fbff] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                <span className="font-bold text-[#315574]">Student</span>
                                <span className="font-mono text-[11px] font-bold text-[#0c5bce]">student@sunn.edu.ph</span>
                              </div>
                              <div className="flex flex-col gap-1 rounded-xl bg-[#f7fbff] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                <span className="font-bold text-[#315574]">Driver</span>
                                <span className="font-mono text-[11px] font-bold text-[#0c5bce]">driver@oldsagay-toda.ph</span>
                              </div>
                              <div className="flex flex-col gap-1 rounded-xl bg-[#f7fbff] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                <span className="font-bold text-[#315574]">Admin</span>
                                <span className="font-mono text-[11px] font-bold text-[#0c5bce]">admin@oldsagay.gov.ph</span>
                              </div>
                              <div className="flex flex-col gap-1 rounded-xl bg-[#f7fbff] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                <span className="font-bold text-[#315574]">TODA Officer</span>
                                <span className="font-mono text-[11px] font-bold text-[#0c5bce]">officer@oldsagay.gov.ph</span>
                              </div>
                              <div className="flex flex-col gap-1 rounded-xl bg-[#fff9eb] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                <span className="font-bold text-[#82652d]">Password</span>
                                <span className="font-mono text-[11px] font-extrabold text-[#9b6011]">Password123!</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : registrationStep === 1 ? (
                    <>
                      <label htmlFor="register-email" className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#617d98]">
                        Email or account
                      </label>
                      <div className="relative mt-2">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a7bb]" size={16} strokeWidth={1.8} />
                        <input
                          id="register-email"
                          type="email"
                          value={form.email}
                          onChange={(event) => updateForm("email", event.target.value)}
                          className="w-full rounded-[13px] border border-[#d3e2ed] bg-[#fbfdff] py-3.5 pl-10 pr-4 text-[13px] font-semibold text-[#234564] outline-none transition-[border,box-shadow] placeholder:font-medium placeholder:text-[#a5b5c3] focus:border-[#79a9d1] focus:ring-4 focus:ring-[#e0effd]"
                          placeholder="name@sunn.edu.ph"
                          autoComplete="email"
                        />
                      </div>
                      <div className="mt-5">
                        <PasswordField id="register-password" label="Create password" hint="8+ characters" value={form.password} onChange={(value) => updateForm("password", value)} visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />
                      </div>
                      <div className="mt-5">
                        <PasswordField id="confirm-password" label="Confirm password" value={form.confirmPassword} onChange={(value) => updateForm("confirmPassword", value)} visible={showConfirmation} onToggle={() => setShowConfirmation((visible) => !visible)} />
                      </div>
                      <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#0c5bce] py-3.5 text-[13px] font-extrabold text-white shadow-[0_9px_20px_rgba(12,91,206,0.16)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#094fae]">
                        Continue to student information <ArrowRight size={16} />
                      </button>
                    </>
                  ) : registrationStep === 2 ? (
                    <>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label htmlFor="full-name" className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#617d98]">Full name</label>
                          <div className="relative mt-2">
                            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a7bb]" size={16} strokeWidth={1.8} />
                            <input id="full-name" value={form.fullName} onChange={(event) => updateForm("fullName", event.target.value)} className="w-full rounded-[13px] border border-[#d3e2ed] bg-[#fbfdff] py-3.5 pl-10 pr-4 text-[13px] font-semibold text-[#234564] outline-none transition-[border,box-shadow] placeholder:font-medium placeholder:text-[#a5b5c3] focus:border-[#79a9d1] focus:ring-4 focus:ring-[#e0effd]" placeholder="Your name as it appears on school records" autoComplete="name" />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="student-id" className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#617d98]">Student ID</label>
                          <input id="student-id" value={form.studentId} onChange={(event) => updateForm("studentId", event.target.value)} className="mt-2 w-full rounded-[13px] border border-[#d3e2ed] bg-[#fbfdff] px-4 py-3.5 text-[13px] font-semibold text-[#234564] outline-none transition-[border,box-shadow] placeholder:font-medium placeholder:text-[#a5b5c3] focus:border-[#79a9d1] focus:ring-4 focus:ring-[#e0effd]" placeholder="e.g. 2024-01482" />
                        </div>
                        <div>
                          <label htmlFor="year-level" className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#617d98]">Year level</label>
                          <select id="year-level" value={form.yearLevel} onChange={(event) => updateForm("yearLevel", event.target.value)} className="mt-2 w-full appearance-none rounded-[13px] border border-[#d3e2ed] bg-[#fbfdff] px-4 py-3.5 text-[13px] font-semibold text-[#234564] outline-none transition-[border,box-shadow] focus:border-[#79a9d1] focus:ring-4 focus:ring-[#e0effd]">
                            <option value="">Select year</option>
                            <option value="1st year">1st year</option>
                            <option value="2nd year">2nd year</option>
                            <option value="3rd year">3rd year</option>
                            <option value="4th year">4th year</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="program" className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#617d98]">Program or department</label>
                          <input id="program" value={form.program} onChange={(event) => updateForm("program", event.target.value)} className="mt-2 w-full rounded-[13px] border border-[#d3e2ed] bg-[#fbfdff] px-4 py-3.5 text-[13px] font-semibold text-[#234564] outline-none transition-[border,box-shadow] placeholder:font-medium placeholder:text-[#a5b5c3] focus:border-[#79a9d1] focus:ring-4 focus:ring-[#e0effd]" placeholder="e.g. Bachelor of Science in Education" />
                        </div>
                      </div>
                      <label className="mt-5 flex cursor-pointer items-start gap-2.5 rounded-[13px] border border-[#dbe8ee] bg-[#f1f8f8] p-3.5 text-[11px] leading-5 text-[#6c8796]">
                        <input type="checkbox" checked={form.hasReadNotice} onChange={(event) => updateForm("hasReadNotice", event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c6d8e4] accent-[#278b7d]" />
                        <span>I understand that this prototype uses the information only to demonstrate the registration flow.</span>
                      </label>
                      <div className="mt-6 flex gap-3">
                        <button type="button" onClick={() => { setRegistrationStep(1); setNotice(null); }} className="flex items-center justify-center gap-2 rounded-[12px] border border-[#d3e2ed] bg-white px-4 py-3.5 text-[12px] font-extrabold text-[#62809a] transition-colors hover:bg-[#f2f7fb]">
                          <ArrowLeft size={15} /> Back
                        </button>
                        <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#0c5bce] py-3.5 text-[13px] font-extrabold text-white shadow-[0_9px_20px_rgba(12,91,206,0.16)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#094fae]">
                          Review details <ArrowRight size={16} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-[16px] border border-[#d8e8ee] bg-white p-4">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#7c99ab]">Account details</p>
                        <div className="mt-3 divide-y divide-[#edf2f5]">
                          <div className="flex items-center justify-between gap-4 py-2.5 text-[12px]">
                            <span className="text-[#879bac]">Email</span><span className="max-w-[250px] truncate font-extrabold text-[#315574]">{form.email}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 py-2.5 text-[12px]">
                            <span className="text-[#879bac]">Name</span><span className="max-w-[250px] truncate font-extrabold text-[#315574]">{form.fullName}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 py-2.5 text-[12px]">
                            <span className="text-[#879bac]">Student ID</span><span className="font-extrabold text-[#315574]">{form.studentId}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 py-2.5 text-[12px]">
                            <span className="text-[#879bac]">Program</span><span className="max-w-[250px] truncate font-extrabold text-[#315574]">{form.program}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 pt-2.5 text-[12px]">
                            <span className="text-[#879bac]">Year level</span><span className="font-extrabold text-[#315574]">{form.yearLevel}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-start gap-2.5 rounded-[13px] border border-[#d2e9e5] bg-[#eff9f6] p-3.5 text-[11px] leading-5 text-[#4b8179]">
                        <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                        <span>Review the details above. Completing this step only demonstrates the prototype; it does not create a live account.</span>
                      </div>
                      <div className="mt-6 flex gap-3">
                        <button type="button" onClick={() => { setRegistrationStep(2); setNotice(null); }} className="flex items-center justify-center gap-2 rounded-[12px] border border-[#d3e2ed] bg-white px-4 py-3.5 text-[12px] font-extrabold text-[#62809a] transition-colors hover:bg-[#f2f7fb]">
                          <ArrowLeft size={15} /> Edit
                        </button>
                        <button type="submit" disabled={isLoading} className="flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#278b7d] py-3.5 text-[13px] font-extrabold text-white shadow-[0_9px_20px_rgba(39,139,125,0.16)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#20786d] disabled:cursor-wait disabled:bg-[#8abeb5]">
                          {isLoading ? <LoadingLabel>Completing preview</LoadingLabel> : <>Complete registration <Check size={16} /></>}
                        </button>
                      </div>
                    </>
                  )}
                </form>

                <div className="mt-8 border-t border-[#dce8ef] pt-6 text-center text-[12px] font-semibold text-[#8299ad]">
                  {mode === "login" ? (
                    <>
                      New to this prototype?{" "}
                      <button type="button" onClick={() => switchMode("register")} className="font-extrabold text-[#0c5bce] hover:text-[#084b9e]">Create a student account <ChevronRight className="inline" size={13} /></button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button type="button" onClick={() => switchMode("login")} className="font-extrabold text-[#0c5bce] hover:text-[#084b9e]">Sign in instead <ChevronRight className="inline" size={13} /></button>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>

          <div className="mx-auto flex w-full max-w-[510px] items-center justify-between gap-4 border-t border-[#dce8ef] pt-5 text-[10px] font-semibold text-[#91a4b4]">
            <span className="flex items-center gap-1.5"><LockKeyhole size={12} /> No live credentials collected</span>
            <span>Barangay Old Sagay · Sagay City</span>
          </div>
        </main>
      </div>
      <style>{`
        @keyframes auth-rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

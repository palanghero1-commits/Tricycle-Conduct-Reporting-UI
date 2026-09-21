import { useState, type FormEvent } from "react";
import { AlertCircle, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { clearAuthToken, login } from "../../../lib/api";

const ADMIN_DASHBOARD = "AdminDashboard";

function previewUrl(component: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/preview/tricycle-reporting/${component}`;
}

export function AdminAccess() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    login(email.trim(), password)
      .then((data) => {
        if (data.user.role !== "SUPERADMIN") {
          clearAuthToken();
          throw new Error("This sign-in is restricted to the superadmin account.");
        }
        window.location.href = previewUrl(ADMIN_DASHBOARD);
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Unable to sign in.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#eef5fb] px-4 py-8 text-[#173552]">
      <section className="w-full max-w-[430px] rounded-[24px] border border-[#d6e4ef] bg-white p-7 shadow-[0_20px_55px_rgba(34,76,112,0.12)] sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#123f72] text-white">
            <ShieldCheck size={22} />
          </span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6d8aa5]">Restricted access</p>
            <h1 className="text-[21px] font-extrabold tracking-[-0.03em]">Administrator sign in</h1>
          </div>
        </div>

        {error ? (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-[#f1d7c9] bg-[#fff7f2] px-3.5 py-3 text-[12px] leading-5 text-[#9b6048]" role="alert">
            <AlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#617d98]">Admin email</label>
            <input id="admin-email" type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-[13px] border border-[#d3e2ed] bg-[#fbfdff] px-3.5 py-3.5 text-[13px] font-semibold outline-none focus:border-[#79a9d1] focus:ring-4 focus:ring-[#e0effd]" placeholder="Enter admin email" />
          </div>

          <div>
            <label htmlFor="admin-password" className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#617d98]">Password</label>
            <div className="relative mt-2">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a7bb]" size={16} />
              <input id="admin-password" type={showPassword ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-[13px] border border-[#d3e2ed] bg-[#fbfdff] py-3.5 pl-10 pr-11 text-[13px] font-semibold outline-none focus:border-[#79a9d1] focus:ring-4 focus:ring-[#e0effd]" placeholder="Enter password" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#7f97ab]" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-[13px] bg-[#123f72] px-4 py-3.5 text-[13px] font-extrabold text-white transition hover:bg-[#0d3159] disabled:cursor-wait disabled:opacity-60">
            {loading ? "Signing in…" : "Sign in to admin console"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-5 text-[#7890a7]">This page is not linked from the public site. Access is still protected by the server.</p>
      </section>
    </main>
  );
}

export default AdminAccess;

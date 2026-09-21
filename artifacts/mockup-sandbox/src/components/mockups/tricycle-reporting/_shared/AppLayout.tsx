import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  CheckCheck,
  ClipboardList,
  FileCheck2,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { apiRequest, clearAuthToken, fetchProfilePhoto, formatPhilippineDateTime, getCurrentUser, getUserInitials } from "../../../../lib/api";

type AppLayoutProps = {
  children: ReactNode;
  active?: string;
  officer?: boolean;
  title?: string;
  eyebrow?: string;
};

type NavItem = {
  label: string;
  icon: typeof Gauge;
  component: string;
  hash?: string;
};

type HeaderNotification = {
  id: string;
  type: string;
  message: string;
  relatedComplaintId: string | null;
  reportReference: string | null;
  readAt: string | null;
  createdAt: string;
};

function notificationTitle(type: string) {
  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^| )\w/g, (match) => match.toUpperCase());
}

function notificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}

const studentNav = [
  { label: "Dashboard", icon: LayoutDashboard, component: "StudentDashboard" },
  { label: "Submit report", icon: ClipboardList, component: "SubmitReport" },
  { label: "My reports", icon: FileCheck2, component: "MyReports" },
  { label: "Notifications", icon: Bell, component: "Notifications" },
  { label: "Profile", icon: UserRound, component: "Profile" },
];

const driverNav = [
  { label: "Dashboard", icon: LayoutDashboard, component: "StudentDashboard" },
  { label: "My reports", icon: FileCheck2, component: "MyReports" },
  { label: "Violations", icon: ShieldCheck, component: "Violations" },
  { label: "Notifications", icon: Bell, component: "Notifications" },
  { label: "Profile", icon: UserRound, component: "Profile" },
];

const officerNav = [
  { label: "Dashboard", icon: Gauge, component: "OfficerDashboard" },
  { label: "Reports", icon: ClipboardList, component: "PNPReview" },
  { label: "Drivers", icon: UsersRound, component: "DriverDirectory" },
  { label: "Violations", icon: ShieldCheck, component: "Violations" },
  { label: "Analytics", icon: BarChart3, component: "Analytics" },
  { label: "Notifications", icon: Bell, component: "Notifications" },
];

const adminNav = [
  { label: "Dashboard", icon: Gauge, component: "AdminDashboard" },
  { label: "Reports", icon: ClipboardList, component: "ReviewWorkspace" },
  { label: "Drivers", icon: UsersRound, component: "DriverDirectory" },
  { label: "Violations", icon: ShieldCheck, component: "Violations" },
  { label: "Analytics", icon: BarChart3, component: "Analytics" },
  { label: "Notifications", icon: Bell, component: "Notifications" },
];

const pnpNav = [
  { label: "Dashboard", icon: Gauge, component: "OfficerDashboard" },
  { label: "Reports", icon: ClipboardList, component: "PNPReview" },
  { label: "Drivers", icon: UsersRound, component: "DriverDirectory" },
  { label: "Violations", icon: ShieldCheck, component: "Violations" },
  { label: "Analytics", icon: BarChart3, component: "Analytics" },
  { label: "Notifications", icon: Bell, component: "Notifications" },
];

function previewUrl(component: string, hash = "") {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/preview/tricycle-reporting/${component}${hash}`;
}

function navigateTo(component: string, hash?: string) {
  window.location.href = previewUrl(component, hash);
}

function signOut() {
  clearAuthToken();
  window.location.href = previewUrl("Landing");
}

export function AppLayout({
  children,
  active = "Dashboard",
  officer = false,
  title,
  eyebrow,
}: AppLayoutProps) {
  const currentUser = getCurrentUser();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [headerNotifications, setHeaderNotifications] = useState<HeaderNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedHeaderNotification, setSelectedHeaderNotification] = useState<HeaderNotification | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const roleUsesReviewWorkspace = ["TODA_PRESIDENT", "AUTHORIZED_PERSONNEL", "PNP", "SUPERADMIN"].includes(currentUser?.role ?? "");
  const workspaceOfficer = officer || roleUsesReviewWorkspace;
  const navItems: NavItem[] = currentUser?.role === "SUPERADMIN" ? adminNav : currentUser?.role === "PNP" ? pnpNav : currentUser?.role === "DRIVER" ? driverNav : workspaceOfficer ? (currentUser?.role === "AUTHORIZED_PERSONNEL" ? [...officerNav, { label: "TODAs", icon: UsersRound, component: "OfficerDashboard", hash: "#todas" }] : officerNav) : studentNav;
  const initials = getUserInitials(currentUser);
  const displayTitle = title ?? (workspaceOfficer ? "Officer workspace" : "Student workspace");

  useEffect(() => {
    let active = true;
    const loadUnread = () => {
      apiRequest<{ unread: number; notifications: HeaderNotification[] }>("/notifications")
        .then(({ unread, notifications }) => {
          if (!active) return;
          setUnreadNotifications(unread);
          setHeaderNotifications(notifications);
        })
        .catch(() => { if (active) setUnreadNotifications(0); });
    };
    loadUnread();
    const timer = window.setInterval(loadUnread, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    fetchProfilePhoto().then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setProfilePhotoUrl(objectUrl);
    }).catch(() => undefined);
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const markNotificationAsRead = (notificationId: string) => {
    apiRequest(`/notifications/${notificationId}/read`, { method: "PATCH" })
      .then(() => {
        setHeaderNotifications((current) => current.map((notification) => notification.id === notificationId ? { ...notification, readAt: notification.readAt ?? new Date().toISOString() } : notification));
        setUnreadNotifications((current) => Math.max(0, current - 1));
      })
      .catch(() => undefined);
  };

  const markAllNotificationsAsRead = () => {
    if (unreadNotifications === 0) return;
    apiRequest("/notifications/read-all", { method: "PATCH" })
      .then(() => {
        setHeaderNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt ?? new Date().toISOString() })));
        setUnreadNotifications(0);
      })
      .catch(() => undefined);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#132238]">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 flex-col overflow-hidden border-r border-[#dbe5f0] bg-white px-5 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#0c5bce] text-white shadow-[0_6px_18px_rgba(12,91,206,0.22)]">
              <ShieldCheck size={21} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[13px] font-extrabold tracking-[-0.02em] text-[#12305a]">Tricycle Conduct</p>
              <p className="text-[11px] font-medium text-[#7890aa]">Old Sagay • SUNN</p>
            </div>
          </div>

          <div className="mt-11">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9aabbe]">
              {workspaceOfficer ? "Review center" : "My space"}
            </p>
            <nav className="mt-3 space-y-1.5">
              {navItems.map(({ label, icon: Icon, component, hash }) => {
                const isActive = active === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigateTo(component, hash)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                      isActive
                        ? "bg-[#eaf2ff] text-[#0c5bce]"
                        : "text-[#71859e] hover:bg-[#f4f7fb] hover:text-[#23405f]"
                    }`}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    {label}
                    {label === "Notifications" ? (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e8794f] px-1 text-[10px] font-extrabold text-white">
                        {unreadNotifications}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto">
            <div className="mb-4 rounded-2xl bg-[#f0f7ff] p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9ebff] text-[#0c5bce]">
                  <ShieldCheck size={16} />
                </div>
                <span className="rounded-full bg-[#dcf5eb] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#20885d]">
                  Secure
                </span>
              </div>
              <p className="mt-3 text-[12px] font-bold text-[#23405f]">Conduct reporting</p>
              <p className="mt-1 text-[11px] leading-4 text-[#71859e]">
                Reports are reviewed by authorized personnel.
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#71859e] hover:bg-[#f4f7fb]"
            >
              <LogOut size={17} strokeWidth={1.8} />
              Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-20 lg:pb-0">
          <header className="sticky top-0 z-10 flex h-[74px] items-center justify-between border-b border-[#dbe5f0]/80 bg-[#f4f7fb]/90 px-5 backdrop-blur lg:px-10">
            <div className="flex items-center gap-3">
              <button type="button" className="rounded-xl p-2 text-[#6f849d] hover:bg-white lg:hidden" aria-label="Open navigation">
                <Menu size={20} />
              </button>
              <div>
                {eyebrow ? (
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8ca0b6]">{eyebrow}</p>
                ) : null}
                <h1 className="text-[17px] font-extrabold tracking-[-0.02em] text-[#163154] lg:text-[20px]">{displayTitle}</h1>
                {currentUser ? <p className="mt-0.5 text-[11px] font-semibold text-[#879bb0]">{currentUser.fullName} / {currentUser.role.replace("_", " ")}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={() => setNotificationsOpen((current) => !current)} className="relative rounded-xl border border-[#dbe5f0] bg-white p-2.5 text-[#6d8199] shadow-sm" aria-label="Notifications" aria-expanded={notificationsOpen}>
                <Bell size={17} strokeWidth={1.8} />
                {unreadNotifications > 0 ? <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#e8794f]" /> : null}
              </button>
              <button type="button" onClick={() => navigateTo("Profile")} className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#d9ebff] text-[12px] font-extrabold text-[#0c5bce] transition hover:bg-[#c6e2ff] sm:flex" aria-label="Open profile">
                {profilePhotoUrl ? <img src={profilePhotoUrl} alt="Profile" className="h-full w-full rounded-full object-cover" /> : initials}
              </button>
            </div>
            {notificationsOpen ? (
              <div className="absolute right-5 top-[66px] z-40 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-[#e2dff4] bg-white shadow-[0_22px_60px_rgba(47,35,105,0.2)] lg:right-10" role="dialog" aria-label="Notification inbox">
                <div className="flex items-center justify-between border-b border-[#eeeaf8] px-5 py-4">
                  <button type="button" className="flex items-center gap-2 text-[20px] font-medium text-[#5429c7]" onClick={() => navigateTo("Notifications")}>
                    All Notifications <span className="text-[18px]">⌄</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={markAllNotificationsAsRead} disabled={unreadNotifications === 0} className="rounded-lg p-2 text-[#5429c7] hover:bg-[#f5f1ff] disabled:opacity-40" aria-label="Mark all notifications as read"><CheckCheck size={20} /></button>
                    <button type="button" onClick={() => navigateTo("Profile")} className="rounded-lg p-2 text-[#5429c7] hover:bg-[#f5f1ff]" aria-label="Notification settings"><Settings size={20} /></button>
                  </div>
                </div>
                <div className="max-h-[430px] space-y-2 overflow-y-auto bg-white p-3">
                  {headerNotifications.length > 0 ? headerNotifications.slice(0, 5).map((notification) => (
                    <button key={notification.id} type="button" onClick={() => { if (!notification.readAt) markNotificationAsRead(notification.id); setSelectedHeaderNotification({ ...notification, readAt: notification.readAt ?? new Date().toISOString() }); setNotificationsOpen(false); }} className={`group w-full rounded-[18px] p-4 text-left transition hover:bg-[#f8f5ff] ${notification.readAt ? "bg-white" : "bg-[#f7f3ff]"}`}>
                      <div className="flex items-start gap-3">
                        <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-[#5429c7]" style={{ opacity: notification.readAt ? 0 : 1 }} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-[14px] font-extrabold text-[#20212a]">{notificationTitle(notification.type)}</span>
                            <span className="shrink-0 text-[11px] text-[#555766]">{notificationTime(notification.createdAt)}</span>
                          </span>
                          <span className="mt-1 block text-[13px] leading-[1.4] text-[#4f5362]">{notification.message}</span>
                          <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#6b35d1]">{notification.reportReference ?? "System notification"} <ArrowUpRight size={12} /></span>
                        </span>
                      </div>
                    </button>
                  )) : (
                    <div className="px-4 py-10 text-center text-[13px] text-[#7b7d8c]">No notifications yet.</div>
                  )}
                </div>
                <div className="border-t border-[#eeeaf8] px-5 py-3">
                  <button type="button" onClick={() => navigateTo("Notifications")} className="flex items-center gap-2 text-[13px] font-bold text-[#5429c7] hover:text-[#3f1a9e]"><Bell size={15} /> View all notifications <ArrowUpRight size={14} /></button>
                </div>
              </div>
            ) : null}
          </header>
          <div className="mx-auto w-full max-w-[1460px] px-5 py-7 lg:px-10 lg:py-9">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-[72px] items-center justify-around border-t border-[#dbe5f0] bg-white/95 px-2 backdrop-blur lg:hidden">
        {navItems.slice(0, 5).map(({ label, icon: Icon, component, hash }) => {
          const isActive = active === label;
          return (
            <button key={label} type="button" onClick={() => navigateTo(component, hash)} className={`flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold ${isActive ? "text-[#0c5bce]" : "text-[#8ca0b6]"}`}>
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{label === "Submit report" ? "Report" : label.replace("My ", "")}</span>
            </button>
          );
        })}
      </nav>
      {selectedHeaderNotification ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17304d]/35 px-4 backdrop-blur-[2px]" onClick={() => setSelectedHeaderNotification(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="header-notification-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-[500px] rounded-[24px] border border-[#e2dff4] bg-white p-6 shadow-[0_24px_80px_rgba(47,35,105,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b78c5]">Notification detail</p>
                <h2 id="header-notification-title" className="mt-2 text-[20px] font-extrabold text-[#20212a]">{notificationTitle(selectedHeaderNotification.type)}</h2>
              </div>
              <button type="button" onClick={() => setSelectedHeaderNotification(null)} className="rounded-xl p-2 text-[#8092a6] hover:bg-[#f5f1ff]" aria-label="Close notification detail"><X size={18} /></button>
            </div>
            <p className="mt-5 text-[13px] leading-6 text-[#4f5362]">{selectedHeaderNotification.message}</p>
            <div className="mt-5 grid gap-3 rounded-2xl bg-[#f8f5ff] p-4 text-[11px] text-[#687080]">
              <div className="flex justify-between gap-4"><span>Report</span><span className="font-mono font-bold text-[#3e2d79]">{selectedHeaderNotification.reportReference ?? selectedHeaderNotification.relatedComplaintId ?? "System notification"}</span></div>
              <div className="flex justify-between gap-4"><span>Received</span><span className="font-semibold text-[#3e2d79]">{formatPhilippineDateTime(selectedHeaderNotification.createdAt)}</span></div>
              <div className="flex justify-between gap-4"><span>Status</span><span className="font-semibold text-[#3e2d79]">Read</span></div>
            </div>
            <button type="button" onClick={() => { setSelectedHeaderNotification(null); navigateTo("Notifications"); }} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5429c7] px-4 py-3 text-[12px] font-extrabold text-white hover:bg-[#4520aa]">View all notifications <ArrowUpRight size={15} /></button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MobileCloseButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl p-2 text-[#6f849d] hover:bg-[#f4f7fb]" aria-label="Close">
      <X size={18} />
    </button>
  );
}

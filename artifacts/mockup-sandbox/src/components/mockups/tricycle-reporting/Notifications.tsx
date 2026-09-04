import { useMemo, useState } from "react";
import {
  Archive,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Check,
  CheckCheck,
  CircleCheck,
  GitBranch,
  Inbox,
  PencilLine,
  SearchCheck,
} from "lucide-react";
import { AppLayout } from "./_shared/AppLayout";

type NotificationFilter = "all" | "unread";

type NotificationItem = {
  id: number;
  title:
    | "Your report has been received"
    | "Your report is now under review"
    | "Your report has been updated"
    | "Your report has been referred"
    | "Your report has been resolved"
    | "Your report has been closed";
  message: string;
  time: string;
  reportId: string;
  read: boolean;
  icon: typeof Bell;
  accent: string;
  iconBackground: string;
};

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "Your report has been received",
    message:
      "Your report is in the system and ready for an initial check by the authorized review team.",
    time: "12 minutes ago",
    reportId: "TR-24018",
    read: false,
    icon: Inbox,
    accent: "#0c5bce",
    iconBackground: "#e7f0ff",
  },
  {
    id: 2,
    title: "Your report is now under review",
    message:
      "The review team is checking the details you provided. You may receive a follow-up if clarification is needed.",
    time: "Yesterday, 4:36 PM",
    reportId: "TR-24012",
    read: false,
    icon: SearchCheck,
    accent: "#a56a12",
    iconBackground: "#fff2d9",
  },
  {
    id: 3,
    title: "Your report has been updated",
    message:
      "A status note was added to your report. View the report to see the latest information.",
    time: "Yesterday, 10:08 AM",
    reportId: "TR-23997",
    read: false,
    icon: PencilLine,
    accent: "#9c4e76",
    iconBackground: "#f9e8f0",
  },
  {
    id: 4,
    title: "Your report has been referred",
    message:
      "Your report was referred to the appropriate authorized personnel for the next part of the review.",
    time: "2 days ago",
    reportId: "TR-23984",
    read: true,
    icon: GitBranch,
    accent: "#5c55a8",
    iconBackground: "#eeedff",
  },
  {
    id: 5,
    title: "Your report has been resolved",
    message:
      "The review team marked the concern as resolved and recorded the outcome on your report.",
    time: "5 days ago",
    reportId: "TR-23941",
    read: true,
    icon: BadgeCheck,
    accent: "#20885d",
    iconBackground: "#e2f5ea",
  },
  {
    id: 6,
    title: "Your report has been closed",
    message:
      "This report is now closed. A closed report does not indicate a confirmed violation.",
    time: "8 days ago",
    reportId: "TR-23908",
    read: true,
    icon: Archive,
    accent: "#587087",
    iconBackground: "#e9f0f5",
  },
];

export function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );
  const visibleNotifications = useMemo(
    () =>
      filter === "unread"
        ? notifications.filter((notification) => !notification.read)
        : notifications,
    [filter, notifications],
  );

  const markAsRead = (notificationId: number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  };

  return (
    <AppLayout
      active="Notifications"
      title="Notifications"
      eyebrow="My space / updates"
    >
      <div className="mx-auto max-w-[920px]">
        <section className="relative overflow-hidden rounded-[26px] border border-[#dbe5f0] bg-[#12305a] px-5 py-6 text-white shadow-[0_14px_34px_rgba(30,65,105,0.12)] sm:px-7 sm:py-7">
          <div className="absolute -right-12 -top-20 h-48 w-48 rounded-full border-[24px] border-[#2e6fc8]/30" />
          <div className="absolute -bottom-24 right-24 h-40 w-40 rounded-full border-[18px] border-[#e8794f]/20" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-[560px]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15">
                <Bell size={21} strokeWidth={1.9} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a9c7ed]">
                Report activity
              </p>
              <h2 className="mt-2 text-[27px] font-extrabold tracking-[-0.04em] sm:text-[32px]">
                Keep track of every update.
              </h2>
              <p className="mt-2 max-w-[500px] text-[13px] leading-5 text-[#c9d9ed]">
                See what is happening with your reports to the authorized
                personnel in Barangay Old Sagay.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 sm:min-w-[138px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a9c7ed]">
                To check
              </p>
              <p className="mt-1 text-[25px] font-extrabold tracking-[-0.04em]">
                {unreadCount}
                <span className="ml-1.5 text-[13px] font-semibold tracking-normal text-[#c9d9ed]">
                  {unreadCount === 1 ? "update" : "updates"}
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#8ca0b6]">
                Inbox
              </p>
              <h3 className="mt-1 text-[21px] font-extrabold tracking-[-0.03em] text-[#163154]">
                Report updates
              </h3>
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#cddbea] bg-white px-4 text-[12px] font-bold text-[#35516f] shadow-[0_4px_12px_rgba(37,69,105,0.05)] transition hover:border-[#9db9db] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-45 sm:self-auto"
            >
              <CheckCheck size={16} strokeWidth={2} />
              Mark all as read
            </button>
          </div>

          <div className="mt-5 flex w-fit rounded-xl border border-[#dbe5f0] bg-[#eaf0f6] p-1">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`min-h-10 rounded-lg px-4 text-[12px] font-bold transition ${
                filter === "all"
                  ? "bg-white text-[#163154] shadow-[0_2px_7px_rgba(33,67,104,0.1)]"
                  : "text-[#71859e] hover:text-[#35516f]"
              }`}
            >
              All updates
              <span className="ml-1.5 text-[11px] font-semibold text-[#8ca0b6]">
                {notifications.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`min-h-10 rounded-lg px-4 text-[12px] font-bold transition ${
                filter === "unread"
                  ? "bg-white text-[#163154] shadow-[0_2px_7px_rgba(33,67,104,0.1)]"
                  : "text-[#71859e] hover:text-[#35516f]"
              }`}
            >
              Unread
              <span
                className={`ml-1.5 text-[11px] font-semibold ${
                  unreadCount > 0 ? "text-[#e8794f]" : "text-[#8ca0b6]"
                }`}
              >
                {unreadCount}
              </span>
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {visibleNotifications.length > 0 ? (
              visibleNotifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <article
                    key={notification.id}
                    className={`relative rounded-2xl border p-4 transition sm:p-5 ${
                      notification.read
                        ? "border-[#dbe5f0] bg-white"
                        : "border-[#b9d2f4] bg-[#f7fbff] shadow-[0_8px_22px_rgba(35,83,141,0.07)]"
                    }`}
                  >
                    {!notification.read ? (
                      <span
                        className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[#e8794f] ring-4 ring-[#fff2eb]"
                        aria-label="Unread"
                      />
                    ) : null}
                    <div className="flex items-start gap-3.5">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                        style={{
                          backgroundColor: notification.iconBackground,
                          color: notification.accent,
                        }}
                      >
                        <Icon size={20} strokeWidth={1.9} />
                      </div>
                      <div className="min-w-0 flex-1 pr-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                          <h4 className="text-[14px] font-extrabold leading-5 text-[#1c3858]">
                            {notification.title}
                          </h4>
                          <time className="shrink-0 text-[11px] font-medium text-[#8ca0b6]">
                            {notification.time}
                          </time>
                        </div>
                        <p className="mt-1.5 max-w-[650px] text-[12px] leading-[1.55] text-[#71859e]">
                          {notification.message}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-[#edf2f7] px-2 py-1 font-mono text-[10px] font-bold tracking-[0.04em] text-[#587087]">
                            {notification.reportId}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${
                              notification.read
                                ? "bg-[#f0f3f6] text-[#8ca0b6]"
                                : "bg-[#e8f1ff] text-[#0c5bce]"
                            }`}
                          >
                            {notification.read ? (
                              <Check size={12} strokeWidth={2.5} />
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            )}
                            {notification.read ? "Read" : "Unread"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!notification.read ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#c6d9f2] bg-white px-3 text-[12px] font-bold text-[#0c5bce] transition hover:bg-[#edf5ff] sm:absolute sm:bottom-5 sm:right-5 sm:mt-0 sm:w-auto"
                      >
                        <Check size={15} strokeWidth={2.3} />
                        Mark as read
                      </button>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#bcd0e4] bg-white px-6 py-12 text-center shadow-[0_5px_18px_rgba(35,83,141,0.04)]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#e5f4ed] text-[#20885d]">
                  <CircleCheck size={27} strokeWidth={1.8} />
                </div>
                <h4 className="mt-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#1c3858]">
                  You are all caught up
                </h4>
                <p className="mx-auto mt-2 max-w-[360px] text-[12px] leading-5 text-[#71859e]">
                  There are no unread report updates right now. New activity
                  will appear here when it is available.
                </p>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0c5bce] px-4 text-[12px] font-bold text-white shadow-[0_7px_16px_rgba(12,91,206,0.18)] transition hover:bg-[#0a4fae]"
                >
                  View all updates
                  <ArrowUpRight size={15} strokeWidth={2.2} />
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#dbe5f0] bg-[#f0f7ff] px-4 py-3.5 text-[#587087]">
            <Bell className="mt-0.5 shrink-0 text-[#0c5bce]" size={16} strokeWidth={1.8} />
            <p className="text-[11px] leading-5">
              Updates shown in this prototype are sample records. A report is
              not a confirmed violation, and its status may change during
              review.
            </p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
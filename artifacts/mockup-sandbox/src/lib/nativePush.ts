import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { apiRequest } from "./api";

let listenersReady = false;
let resolveRegistration: (() => void) | null = null;
let rejectRegistration: ((error: Error) => void) | null = null;

export async function enableNativePushNotifications() {
  if (!Capacitor.isNativePlatform()) throw new Error("Push notifications are available in the installed Android app.");

  const localPermission = await LocalNotifications.requestPermissions();
  if (localPermission.display !== "granted") throw new Error("Notification permission was denied. Enable notifications in Android settings, then try again.");

  let pushPermission = await PushNotifications.checkPermissions();
  if (pushPermission.receive !== "granted") pushPermission = await PushNotifications.requestPermissions();
  if (pushPermission.receive !== "granted") throw new Error("Push notification permission was denied. Enable notifications in Android settings, then try again.");

  if (!listenersReady) {
    await PushNotifications.createChannel({ id: "report-updates", name: "Report updates", description: "Status changes and updates about your conduct reports.", importance: 4, visibility: 1 });
    await PushNotifications.addListener("registration", ({ value: token }) => {
      void apiRequest("/push/register", { method: "POST", body: JSON.stringify({ token, platform: Capacitor.getPlatform() }) })
        .then(() => resolveRegistration?.())
        .catch((error: unknown) => {
          console.error("Could not register push token with the backend:", error);
          rejectRegistration?.(error instanceof Error ? error : new Error("Could not register this device with the notification service."));
        });
    });
    await PushNotifications.addListener("registrationError", (error) => {
      console.error("Push notification registration failed:", error);
      rejectRegistration?.(new Error("Push registration failed. Confirm Firebase is configured for this Android app."));
      window.dispatchEvent(new CustomEvent("app:push-error", { detail: "Push registration failed. Confirm Firebase is configured for this app." }));
    });
    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      window.dispatchEvent(new Event("app:notifications-updated"));
      void LocalNotifications.schedule({ notifications: [{ id: Math.floor(Date.now() % 2_000_000_000), title: notification.title || "Report update", body: notification.body || "There is an update to your report.", channelId: "report-updates", extra: notification.data }] });
    });
    await PushNotifications.addListener("pushNotificationActionPerformed", () => {
      window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/preview/tricycle-reporting/Notifications`;
    });
    listenersReady = true;
  }

  const registered = new Promise<void>((resolve, reject) => {
    resolveRegistration = resolve;
    rejectRegistration = reject;
  });
  try {
    await PushNotifications.register();
    let timeoutId = 0;
    try {
      await Promise.race([registered, new Promise<never>((_, reject) => { timeoutId = window.setTimeout(() => reject(new Error("Push registration timed out. Check your network and Firebase setup.")), 15_000); })]);
    } finally {
      window.clearTimeout(timeoutId);
    }
  } finally {
    resolveRegistration = null;
    rejectRegistration = null;
  }
}

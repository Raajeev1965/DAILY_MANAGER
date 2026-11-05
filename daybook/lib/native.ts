import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Task, Appt } from "./store";

export const isNative = () => Capacitor.isNativePlatform();
const CH = "daybook-alarm";
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (Math.abs(h) % 2000000000) + 1; };

async function ensureChannel() {
  await LocalNotifications.createChannel({ id: CH, name: "Alarms", description: "Reminder and appointment alarms", importance: 5, visibility: 1, sound: "alarm.wav", vibration: true, lights: true });
}

// Asks for notification and exact-alarm permission. Returns a message for the person.
export async function setupAlarms(): Promise<string> {
  if (!isNative()) return "";
  try {
    const p = await LocalNotifications.requestPermissions();
    await ensureChannel();
    try {
      const e = await LocalNotifications.checkExactNotificationSetting();
      if (e.exact_alarm !== "granted") await LocalNotifications.changeExactNotificationSetting();
    } catch {}
    return p.display === "granted" ? "Alarms are on. They will ring even when the app is closed." : "Notifications are blocked. Allow them in Android Settings > Apps > Daybook > Notifications.";
  } catch {
    return "Could not set up alarms on this phone.";
  }
}

// Re-schedules every upcoming alarm with Android so they ring even when the app is closed.
export async function syncAlarms(tasks: Task[], appts: Appt[]) {
  if (!isNative()) return;
  try {
    await ensureChannel();
    const now = Date.now(), horizon = now + 90 * 864e5;
    const items = [
      ...tasks.filter((t) => t.alarm && !t.done && t.due && t.due > now && t.due < horizon).map((t) => ({ id: hash(t.id + t.due), at: t.due as number, title: "Reminder", body: t.title })),
      ...appts.filter((a) => a.alarm && a.at - a.remind * 6e4 > now && a.at < horizon).map((a) => ({ id: hash(a.id + a.at), at: a.at - a.remind * 6e4, title: "Appointment", body: a.title })),
    ].slice(0, 400);
    const pend = await LocalNotifications.getPending();
    if (pend.notifications.length) await LocalNotifications.cancel({ notifications: pend.notifications.map((n) => ({ id: n.id })) });
    if (items.length)
      await LocalNotifications.schedule({
        notifications: items.map((i) => ({ id: i.id, title: i.title, body: i.body, channelId: CH, sound: "alarm.wav", autoCancel: true, schedule: { at: new Date(i.at), allowWhileIdle: true } })),
      });
  } catch {}
}

export async function snoozeNative(body: string, minutes: number) {
  try {
    await LocalNotifications.schedule({ notifications: [{ id: hash(body + Date.now()), title: "Reminder", body, channelId: CH, sound: "alarm.wav", schedule: { at: new Date(Date.now() + minutes * 6e4), allowWhileIdle: true } }] });
  } catch {}
}

export async function clearDelivered() {
  try { await LocalNotifications.removeAllDeliveredNotifications(); } catch {}
}

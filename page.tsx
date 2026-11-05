"use client";
import { useEffect, useRef, useState } from "react";
import { Home, ListChecks, CalendarDays, Wallet, Settings, Mic, BellRing, StickyNote } from "lucide-react";
import { useStore, uid, money, Note, Task, Appt, Txn } from "@/lib/store";
import { parse, listen, Intent, Mic as MicCtl } from "@/lib/voice";
import { App as CapApp } from "@capacitor/app";
import { startRing, stopRing } from "@/lib/alarm";
import { isNative, setupAlarms, syncAlarms, snoozeNative, clearDelivered } from "@/lib/native";
import Today from "@/components/Today";
import Money from "@/components/Money";
import More from "@/components/More";
import Notes from "@/components/Notes";
import { Tasks, Calendar } from "@/components/Plan";

const TABS = [["today", "Today", Home], ["tasks", "Tasks", ListChecks], ["cal", "Calendar", CalendarDays], ["money", "Money", Wallet], ["notes", "Notes", StickyNote], ["more", "More", Settings]] as const;

function describe(i: Intent) {
  if (i.kind === "txn") return `${i.type === "income" ? "Income" : "Expense"} ${money(i.amount)} · ${i.cat}`;
  if (i.kind === "task") return `Task “${i.title}”${i.due ? " · " + new Date(i.due).toLocaleString("en-IN") + " · alarm" : ""}`;
  if (i.kind === "appt") return `Appointment “${i.title}” · ${new Date(i.at).toLocaleString("en-IN")}`;
  return `Note “${i.text}”`;
}

export default function App() {
  const [tab, setTab] = useState<string>("today");
  const [notes, setNotes] = useStore<Note[]>("notes", []);
  const [tasks, setTasks] = useStore<Task[]>("tasks", []);
  const [appts, setAppts] = useStore<Appt[]>("appts", []);
  const [txns, setTxns] = useStore<Txn[]>("txns", []);
  const [fired, setFired] = useStore<string[]>("fired", []);
  const [sheet, setSheet] = useState(false);
  const [heard, setHeard] = useState("");
  const [rec, setRec] = useState(false);
  const [status, setStatus] = useState("");
  const [lang, setLang] = useStore<string>("lang", "en-IN");
  const micRef = useRef<MicCtl | null>(null);
  const heardRef = useRef("");
  const quickRef = useRef<string | null>(null); // null = normal; otherwise quick mode with a text prefix
  const sheetRef = useRef(false);
  const [last, setLast] = useState<{ kind: string; id: string; text: string } | null>(null);
  const [autoListen, setAutoListen] = useStore<boolean>("autolisten", false);
  const readLang = () => { try { return JSON.parse(localStorage.getItem("daybook:lang") || '"en-IN"'); } catch { return "en-IN"; } };
  const [ring, setRing] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => { if (!isNative()) navigator.serviceWorker?.register("/sw.js").catch(() => {}); }, []);
  const [installEv, setInstallEv] = useState<any>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstallEv(e); };
    const done = () => setInstallEv(null);
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", h); window.removeEventListener("appinstalled", done); };
  }, []);
  const install = async () => { if (!installEv) return; installEv.prompt(); await installEv.userChoice; setInstallEv(null); };
  // In the Android app: ask for alarm permission once, then keep Android's alarms in step with your tasks and appointments.
  useEffect(() => { if (isNative() && !localStorage.getItem("daybook:alarmsetup")) { localStorage.setItem("daybook:alarmsetup", "1"); setupAlarms(); } }, []);
  useEffect(() => { const t = setTimeout(() => syncAlarms(tasks, appts), 800); return () => clearTimeout(t); }, [tasks, appts]);

  // Check every 5 seconds for reminders that are due.
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now(), recent = now - 36e5;
      const due = [
        ...tasks.filter((x) => x.alarm && !x.done && x.due && x.due <= now && x.due > recent).map((x) => ({ id: x.id + x.due, title: x.title })),
        ...appts.filter((a) => a.alarm && a.at - a.remind * 6e4 <= now && a.at > recent).map((a) => ({ id: a.id + a.at, title: a.title })),
      ];
      const d = due.find((x) => !fired.includes(x.id));
      if (d && !ring) {
        setFired((f) => [...f.slice(-200), d.id]);
        setRing(d); if (!isNative()) startRing();
        if (!isNative() && typeof Notification !== "undefined" && Notification.permission === "granted")
          navigator.serviceWorker?.ready.then((r) => r.showNotification("Reminder", { body: d.title, vibrate: [300, 150, 300], requireInteraction: true } as NotificationOptions));
      }
    }, 5000);
    return () => clearInterval(t);
  }, [tasks, appts, ring, fired, setFired]);

  const stop = () => { stopRing(); setRing(null); if (isNative()) clearDelivered(); };
  const snooze = () => { const r = ring; stop(); if (r) { if (isNative()) snoozeNative(r.title, 5); else setTimeout(() => { setRing(r); startRing(); }, 5 * 6e4); } };

  const mic = () => {
    micRef.current?.stop();
    heardRef.current = ""; sheetRef.current = true;
    setHeard(""); setStatus(""); setSheet(true); setRec(true);
    const m = listen(readLang(), { onText: (t) => { heardRef.current = t; setHeard(t); }, onStatus: setStatus, onEnd: () => { setRec(false); finishQuick(); } });
    if (!m) {
      setRec(false);
      setStatus("Voice input isn't available in this browser. Type your command below, or use your keyboard's mic key.");
    }
    micRef.current = m;
  };
  const closeSheet = () => { micRef.current?.stop(); sheetRef.current = false; quickRef.current = null; setSheet(false); setStatus(""); };
  const intent = heard.trim() ? parse(heard) : null;
  const apply = (i: Intent) => {
    const id = uid(), at = Date.now();
    if (i.kind === "note") setNotes((p) => [{ id, text: i.text, at }, ...p]);
    if (i.kind === "task") setTasks((p) => [{ id, title: i.title, due: i.due, done: false, alarm: i.alarm }, ...p]);
    if (i.kind === "appt") setAppts((p) => [...p, { id, title: i.title, at: i.at, remind: 10, alarm: true }]);
    if (i.kind === "txn") setTxns((p) => [{ id, type: i.type, amount: i.amount, cat: i.cat, note: i.note, at }, ...p]);
    setLast({ kind: i.kind, id, text: describe(i) });
  };
  const save = () => { if (!intent) return; apply(intent); closeSheet(); setHeard(""); };
  const undo = () => {
    if (!last) return;
    const keep = (x: { id: string }) => x.id !== last.id;
    if (last.kind === "note") setNotes((p) => p.filter(keep));
    if (last.kind === "task") setTasks((p) => p.filter(keep));
    if (last.kind === "appt") setAppts((p) => p.filter(keep));
    if (last.kind === "txn") setTxns((p) => p.filter(keep));
    setLast(null);
  };
  // Quick mode: when speaking ends, save straight away and show an Undo bar.
  const finishQuick = () => {
    const q = quickRef.current, t = heardRef.current.trim();
    if (q === null || !t) return;
    quickRef.current = null;
    apply(parse(q + t));
    sheetRef.current = false; setSheet(false); setHeard("");
  };
  const quickMic = (prefix = "") => { if (sheetRef.current) return; quickRef.current = prefix; mic(); };
  useEffect(() => { if (!last) return; const t = setTimeout(() => setLast(null), 7000); return () => clearTimeout(t); }, [last]);
  // Opened from a shortcut or link (daybook://voice, /?voice=note) or with "start listening on open" switched on.
  useEffect(() => {
    const auto = () => localStorage.getItem("daybook:autolisten") === "true";
    const modeOf = (u: string) => { const m = /(?:mode|voice)=(\w+)/.exec(u)?.[1]; return m === "note" ? "Note: " : m === "reminder" ? "Remind me to " : ""; };
    if (!isNative()) { if (/[?&]voice=/.test(location.search)) quickMic(modeOf(location.search)); return; }
    let h1: any, h2: any;
    CapApp.getLaunchUrl().then((r) => { if (r?.url?.includes("voice")) quickMic(modeOf(r.url)); else if (auto()) quickMic(); });
    CapApp.addListener("appUrlOpen", (e) => { if (e.url.includes("voice")) quickMic(modeOf(e.url)); }).then((h) => { h1 = h; });
    CapApp.addListener("appStateChange", (st) => { if (st.isActive && auto()) quickMic(); }).then((h) => { h2 = h; });
    return () => { h1?.remove(); h2?.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importData = async (f: File) => {
    try {
      const d = JSON.parse(await f.text());
      if (Array.isArray(d.notes)) setNotes(d.notes);
      if (Array.isArray(d.tasks)) setTasks(d.tasks);
      if (Array.isArray(d.appts)) setAppts(d.appts);
      if (Array.isArray(d.txns)) setTxns(d.txns);
    } catch { alert("That file is not a Daybook backup."); }
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ notes, tasks, appts, txns }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "daybook-backup.json"; a.click();
  };

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-32 pt-6">
      <h1 className="mb-4 text-2xl font-bold">{TABS.find((t) => t[0] === tab)![1]}</h1>
      {installEv && tab === "today" && (
        <div className="card mb-4 flex items-center justify-between gap-3">
          <span className="text-sm">Install Daybook on your phone for one-tap access.</span>
          <button className="btn" onClick={install}>Install</button>
        </div>
      )}
      {tab === "today" && <Today notes={notes} setNotes={setNotes} tasks={tasks} appts={appts} txns={txns} />}
      {tab === "tasks" && <Tasks tasks={tasks} setTasks={setTasks} />}
      {tab === "cal" && <Calendar appts={appts} setAppts={setAppts} />}
      {tab === "money" && <Money txns={txns} setTxns={setTxns} />}
      {tab === "notes" && <Notes notes={notes} setNotes={setNotes} />}
      {tab === "more" && <More canInstall={!!installEv} install={install} exportData={exportData} importData={importData} autoListen={autoListen} setAutoListen={setAutoListen} testAlarm={() => { setRing({ id: "test", title: "Test alarm" }); startRing(); }} />}

      <button aria-label="Voice command" onClick={() => { quickRef.current = null; mic(); }} className={`fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-alarm text-[#2A1C00] shadow-lg active:scale-95 ${rec ? "ring-pulse" : ""}`}>
        <Mic />
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md">
          {TABS.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${tab === id ? "font-bold text-brand" : "text-mute"}`}>
              <Icon size={22} />{label}
            </button>
          ))}
        </div>
      </nav>

      {sheet && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/50" onClick={closeSheet}>
          <div className="mx-auto w-full max-w-md space-y-3 rounded-t-3xl bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="font-semibold">{rec ? "Listening…" : "Check what I heard"}</div>
              <select aria-label="Voice language" className="rounded-lg bg-paper px-2 py-1 text-sm" value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="en-IN">English</option><option value="hi-IN">हिन्दी</option><option value="gu-IN">ગુજરાતી</option>
              </select>
            </div>
            {status && <div className="rounded-xl bg-paper p-3 text-sm text-mute" role="status">{status}</div>}
            <input className="inp" placeholder="Or type a command, e.g. Spent 450 on fuel" value={heard} onChange={(e) => setHeard(e.target.value)} />
            {intent && <div className="rounded-xl bg-paper p-3 text-sm">{describe(intent)}</div>}
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded-xl border border-line py-2.5" onClick={() => (rec ? micRef.current?.stop() : mic())}>{rec ? "Stop" : "Speak again"}</button>
              <button className="btn" onClick={save} disabled={!intent}>Save</button>
            </div>
          </div>
        </div>
      )}

      {last && (
        <div role="status" className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-ink p-4 text-paper shadow-lg">
          <span className="text-sm">Saved: {last.text}</span>
          <button className="font-semibold underline" onClick={undo}>Undo</button>
        </div>
      )}

      {ring && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-alarm p-8 text-center text-[#2A1C00]">
          <BellRing size={72} className="ring-pulse" />
          <div className="text-3xl font-bold">{ring.title}</div>
          <div className="flex w-full max-w-xs gap-3">
            <button className="flex-1 rounded-xl border-2 border-[#2A1C00] py-3 font-semibold" onClick={snooze}>Snooze 5 min</button>
            <button className="flex-1 rounded-xl bg-[#2A1C00] py-3 font-semibold text-alarm" onClick={stop}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}

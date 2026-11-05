"use client";
import { useState } from "react";
import { Circle, CheckCircle2, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import VoiceField from "@/components/VoiceField";
import { Task, Appt, uid, tm, dt, toLocalInput, Setter } from "@/lib/store";

function TaskRow({ t, setTasks }: { t: Task; setTasks: Setter<Task[]> }) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(t.title);
  const [due, setDue] = useState("");
  const [alarm, setAlarm] = useState(t.alarm);
  const open = () => { setTitle(t.title); setDue(t.due ? toLocalInput(t.due) : ""); setAlarm(t.alarm); setEdit(true); };
  const save = () => {
    if (!title.trim()) return;
    const d = due ? new Date(due).getTime() : undefined;
    setTasks((p) => p.map((x) => (x.id === t.id ? { ...x, title: title.trim(), due: d, alarm: alarm && !!d } : x)));
    setEdit(false);
  };
  if (edit) return (
    <div className="card space-y-2">
      <VoiceField value={title} onChange={setTitle} placeholder="Task" />
      <input className="inp" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={alarm} onChange={(e) => setAlarm(e.target.checked)} />Ring an alarm at the due time</label>
      <div className="grid grid-cols-2 gap-2"><button className="rounded-xl border border-line py-2.5" onClick={() => setEdit(false)}>Cancel</button><button className="btn" onClick={save}>Save changes</button></div>
    </div>
  );
  return (
    <div className="card flex items-center gap-3 py-3">
      <button aria-label="Toggle done" onClick={() => setTasks((p) => p.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}>
        {t.done ? <CheckCircle2 className="text-brand" /> : <Circle className="text-mute" />}
      </button>
      <div className="flex-1">
        <div className={t.done ? "text-mute line-through" : ""}>{t.title}</div>
        {t.due && <div className="text-xs text-mute">{dt(t.due)}, {tm(t.due)}{t.alarm ? " · alarm on" : ""}</div>}
      </div>
      <button aria-label="Edit task" onClick={open}><Pencil size={18} className="text-mute" /></button>
      <button aria-label="Delete task" onClick={() => setTasks((p) => p.filter((x) => x.id !== t.id))}><Trash2 size={18} className="text-mute" /></button>
    </div>
  );
}

export function Tasks({ tasks, setTasks }: { tasks: Task[]; setTasks: Setter<Task[]> }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [alarm, setAlarm] = useState(true);
  const add = () => {
    if (!title.trim()) return;
    setTasks((p) => [{ id: uid(), title: title.trim(), due: due ? new Date(due).getTime() : undefined, done: false, alarm: alarm && !!due }, ...p]);
    setTitle(""); setDue("");
  };
  const sorted = [...tasks].sort((a, b) => +a.done - +b.done || (a.due ?? 9e15) - (b.due ?? 9e15));
  return (
    <div className="space-y-4">
      <div className="card space-y-2">
        <VoiceField placeholder="New task or reminder" value={title} onChange={setTitle} />
        <input className="inp" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={alarm} onChange={(e) => setAlarm(e.target.checked)} />Ring an alarm at the due time</label>
        <button className="btn w-full" onClick={add}>Add task</button>
      </div>
      {sorted.length === 0 && <p className="text-mute">No tasks yet. Add one above or use the mic.</p>}
      {sorted.map((t) => <TaskRow key={t.id} t={t} setTasks={setTasks} />)}
    </div>
  );
}

const REMIND = [[0, "At start time"], [10, "10 minutes before"], [60, "1 hour before"], [1440, "1 day before"]] as const;

function ApptRow({ a, setAppts }: { a: Appt; setAppts: Setter<Appt[]> }) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(a.title);
  const [when, setWhen] = useState("");
  const [remind, setRemind] = useState(a.remind);
  const [alarm, setAlarm] = useState(a.alarm);
  const open = () => { setTitle(a.title); setWhen(toLocalInput(a.at)); setRemind(a.remind); setAlarm(a.alarm); setEdit(true); };
  const save = () => {
    if (!title.trim() || !when) return;
    setAppts((p) => p.map((x) => (x.id === a.id ? { ...x, title: title.trim(), at: new Date(when).getTime(), remind, alarm } : x)));
    setEdit(false);
  };
  if (edit) return (
    <div className="card space-y-2">
      <VoiceField value={title} onChange={setTitle} placeholder="Appointment title" />
      <input className="inp" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      <select className="inp" value={remind} onChange={(e) => setRemind(+e.target.value)}>
        {REMIND.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={alarm} onChange={(e) => setAlarm(e.target.checked)} />Ring an alarm</label>
      <div className="grid grid-cols-2 gap-2"><button className="rounded-xl border border-line py-2.5" onClick={() => setEdit(false)}>Cancel</button><button className="btn" onClick={save}>Save changes</button></div>
    </div>
  );
  return (
    <div className="card flex items-center gap-3 py-3">
      <span className="w-20 text-sm text-mute">{tm(a.at)}</span>
      <span className="flex-1">{a.title}{a.alarm && <span className="text-xs text-mute"> · alarm</span>}</span>
      <button aria-label="Edit appointment" onClick={open}><Pencil size={18} className="text-mute" /></button>
      <button aria-label="Delete appointment" onClick={() => setAppts((p) => p.filter((x) => x.id !== a.id))}><Trash2 size={18} className="text-mute" /></button>
    </div>
  );
}

export function Calendar({ appts, setAppts }: { appts: Appt[]; setAppts: Setter<Appt[]> }) {
  const [m, setM] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const [sel, setSel] = useState(new Date().toDateString());
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [remind, setRemind] = useState(10);
  const [alarm, setAlarm] = useState(true);
  const lead = m.getDay();
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const dayStr = (d: number) => new Date(m.getFullYear(), m.getMonth(), d).toDateString();
  const has = (d: number) => appts.some((a) => new Date(a.at).toDateString() === dayStr(d));
  const list = appts.filter((a) => new Date(a.at).toDateString() === sel).sort((a, b) => a.at - b.at);
  const shift = (n: number) => setM(new Date(m.getFullYear(), m.getMonth() + n, 1));
  const add = () => {
    if (!title.trim() || !when) return;
    setAppts((p) => [...p, { id: uid(), title: title.trim(), at: new Date(when).getTime(), remind, alarm }]);
    setTitle(""); setWhen("");
  };
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <button aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft /></button>
          <div className="font-semibold">{m.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
          <button aria-label="Next month" onClick={() => shift(1)}><ChevronRight /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="text-mute">{d}</div>)}
          {cells.map((d, i) => d === null ? <div key={i} /> : (
            <button key={i} onClick={() => setSel(dayStr(d))}
              className={`relative rounded-lg py-2 ${sel === dayStr(d) ? "bg-brand text-paper" : ""} ${dayStr(d) === new Date().toDateString() ? "font-bold" : ""}`}>
              {d}{has(d) && <span className="absolute bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-alarm" />}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {list.length === 0 && <p className="text-mute">No appointments on this day.</p>}
        {list.map((a) => <ApptRow key={a.id} a={a} setAppts={setAppts} />)}
      </div>
      <div className="card space-y-2">
        <VoiceField placeholder="Appointment title" value={title} onChange={setTitle} />
        <input className="inp" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        <select className="inp" value={remind} onChange={(e) => setRemind(+e.target.value)}>
          {REMIND.map(([v, l]) => <option key={v} value={v}>{l === "At start time" ? "Remind at start time" : l}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={alarm} onChange={(e) => setAlarm(e.target.checked)} />Ring an alarm</label>
        <button className="btn w-full" onClick={add}>Add appointment</button>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import VoiceField from "@/components/VoiceField";
import { BellRing } from "lucide-react";
import { Note, Task, Appt, Txn, money, tm, dt, uid, Setter } from "@/lib/store";

export default function Today({ notes, setNotes, tasks, appts, txns }:
  { notes: Note[]; setNotes: Setter<Note[]>; tasks: Task[]; appts: Appt[]; txns: Txn[] }) {
  const [text, setText] = useState("");
  const today = new Date().toDateString();
  const isToday = (n: number) => new Date(n).toDateString() === today;
  const spent = txns.filter((x) => x.type === "expense" && isToday(x.at)).reduce((s, x) => s + x.amount, 0);
  const open = tasks.filter((x) => !x.done).length;
  const nx = [
    ...appts.map((a) => ({ t: a.title, at: a.at, k: "Appointment" })),
    ...tasks.filter((x) => !x.done && x.due).map((x) => ({ t: x.title, at: x.due!, k: "Reminder" })),
  ].filter((u) => u.at > Date.now()).sort((a, b) => a.at - b.at)[0];
  const feed = [
    ...notes.filter((n) => isToday(n.at)).map((n) => ({ id: n.id, at: n.at, text: n.text, tag: "Note" })),
    ...txns.filter((x) => isToday(x.at)).map((x) => ({ id: x.id, at: x.at, text: `${x.type === "income" ? "+" : "−"}${money(x.amount)} ${x.cat}`, tag: "Money" })),
  ].sort((a, b) => b.at - a.at);
  const add = () => {
    if (!text.trim()) return;
    setNotes((p) => [{ id: uid(), text: text.trim(), at: Date.now() }, ...p]);
    setText("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-alarm p-5 text-[#2A1C00]">
        <div className="flex items-center gap-2 text-sm font-medium"><BellRing size={16} />{nx ? `${nx.k} · ${dt(nx.at)}` : "Nothing scheduled"}</div>
        {nx ? (
          <>
            <div className="mt-1 text-5xl font-bold tracking-tight">{tm(nx.at)}</div>
            <div className="mt-1 text-lg">{nx.t}</div>
          </>
        ) : (
          <div className="mt-2 text-lg">Tap the mic and say “Remind me to pay the bill tomorrow at 6 pm”.</div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card"><div className="text-sm text-mute">Open tasks</div><div className="text-2xl font-bold">{open}</div></div>
        <div className="card"><div className="text-sm text-mute">Spent today</div><div className="text-2xl font-bold">{money(spent)}</div></div>
      </div>
      <div className="flex items-start gap-2">
        <div className="flex-1"><VoiceField placeholder="Write a note…" value={text} onChange={setText} onEnter={add} /></div>
        <button className="btn" onClick={add}>Save</button>
      </div>
      <div className="space-y-2">
        {feed.length === 0 && <p className="text-mute">No entries yet today. Notes and expenses you add will appear here.</p>}
        {feed.map((f) => (
          <div key={f.id} className="card flex gap-3 py-3">
            <span className="w-16 shrink-0 text-sm text-mute">{tm(f.at)}</span>
            <span className="flex-1">{f.text}</span>
            <span className="text-xs text-mute">{f.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

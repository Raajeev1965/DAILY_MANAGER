"use client";
import { useState } from "react";
import { Trash2, Search } from "lucide-react";
import { uid, Note } from "@/lib/store";

export default function Notes({ notes, setNotes }: { notes: Note[]; setNotes: (f: (p: Note[]) => Note[]) => void }) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const add = () => {
    const t = text.trim();
    if (!t) return;
    setNotes((p) => [{ id: uid(), text: t, at: Date.now() }, ...p]);
    setText("");
  };
  const shown = notes.filter((n) => n.text.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-2xl border border-line bg-card p-3">
        <textarea className="inp min-h-24 w-full" placeholder="Write a note…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn w-full" onClick={add} disabled={!text.trim()}>Add note</button>
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
        <input className="inp w-full pl-9" placeholder="Search notes" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {shown.length === 0 && <p className="text-center text-sm text-mute">{notes.length ? "No matching notes." : "No notes yet. Type one above or tap the mic and say “note …”."}</p>}
      <ul className="space-y-2">
        {shown.map((n) => (
          <li key={n.id} className="flex items-start gap-3 rounded-2xl border border-line bg-card p-3">
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap break-words">{n.text}</p>
              <p className="mt-1 text-xs text-mute">{new Date(n.at).toLocaleString("en-IN")}</p>
            </div>
            <button aria-label="Delete note" className="text-mute" onClick={() => setNotes((p) => p.filter((x) => x.id !== n.id))}><Trash2 size={18} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

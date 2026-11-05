"use client";
import { useState } from "react";
import { Trash2, Pencil, Check, Search } from "lucide-react";
import { Note, uid, tm, dt, Setter } from "@/lib/store";

const tagsOf = (t: string): string[] => t.match(/#\w+/g) ?? [];

export default function Notes({ notes, setNotes }: { notes: Note[]; setNotes: Setter<Note[]> }) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [edit, setEdit] = useState<{ id: string; text: string } | null>(null);
  const all = notes.flatMap((n) => tagsOf(n.text)).filter((t, i, a) => a.indexOf(t) === i);
  const list = notes
    .filter((n) => (!q || n.text.toLowerCase().includes(q.toLowerCase())) && (!tag || tagsOf(n.text).includes(tag)))
    .sort((a, b) => b.at - a.at);
  const add = () => {
    if (!text.trim()) return;
    setNotes((p) => [{ id: uid(), text: text.trim(), at: Date.now() }, ...p]);
    setText("");
  };
  const saveEdit = () => {
    if (edit && edit.text.trim()) setNotes((p) => p.map((n) => (n.id === edit.id ? { ...n, text: edit.text.trim() } : n)));
    setEdit(null);
  };
  return (
    <div className="space-y-4">
      <div className="card space-y-2">
        <textarea className="inp min-h-24" placeholder="Write a note. Add #tags to find it later." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn w-full" onClick={add}>Save note</button>
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-3.5 text-mute" />
        <input className="inp pl-9" placeholder="Search notes" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {all.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["", ...all].map((t) => (
            <button key={t} onClick={() => setTag(t)} className={`rounded-full border px-3 py-1 text-sm ${tag === t ? "border-brand bg-brand text-paper" : "border-line"}`}>{t || "All"}</button>
          ))}
        </div>
      )}
      {list.length === 0 && <p className="text-mute">{notes.length ? "No notes match your search." : "No notes yet. Write one above or tap the mic and say “Note: …”."}</p>}
      {list.map((n) => (
        <div key={n.id} className="card space-y-2">
          {edit?.id === n.id ? (
            <>
              <textarea className="inp min-h-20" value={edit.text} onChange={(e) => setEdit({ id: n.id, text: e.target.value })} />
              <button className="btn flex items-center gap-1" onClick={saveEdit}><Check size={16} />Save changes</button>
            </>
          ) : (
            <>
              <p className="whitespace-pre-wrap">{n.text}</p>
              <div className="flex items-center justify-between text-xs text-mute">
                <span>{dt(n.at)}, {tm(n.at)}</span>
                <span className="flex gap-4">
                  <button aria-label="Edit note" onClick={() => setEdit({ id: n.id, text: n.text })}><Pencil size={16} /></button>
                  <button aria-label="Delete note" onClick={() => setNotes((p) => p.filter((x) => x.id !== n.id))}><Trash2 size={16} /></button>
                </span>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

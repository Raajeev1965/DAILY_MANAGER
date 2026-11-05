"use client";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Txn, CATS, money, tm, dt, Setter } from "@/lib/store";

const dayOf = (n: number) => new Date(n).toLocaleDateString("en-CA");

export default function TxnRow({ x, setTxns, showDate }: { x: Txn; setTxns: Setter<Txn[]>; showDate?: boolean }) {
  const [edit, setEdit] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [cat, setCat] = useState(x.cat);
  const [date, setDate] = useState("");
  const open = () => { setAmount(String(x.amount)); setNote(x.note); setCat(x.cat); setDate(dayOf(x.at)); setEdit(true); };
  const save = () => {
    const n = parseFloat(amount);
    if (!n || n <= 0 || !date) return;
    const at = date === dayOf(x.at) ? x.at : new Date(date + "T12:00:00").getTime();
    setTxns((p) => p.map((t) => (t.id === x.id ? { ...t, amount: n, note, at, cat: x.type === "income" ? "Income" : cat } : t)));
    setEdit(false);
  };
  if (edit) return (
    <div className="card space-y-2">
      <input className="inp" inputMode="decimal" aria-label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <input className="inp" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      <input className="inp" type="date" aria-label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
      {x.type === "expense" && (
        <select className="inp" aria-label="Head" value={cat} onChange={(e) => setCat(e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
      )}
      <div className="grid grid-cols-2 gap-2"><button className="rounded-xl border border-line py-2.5" onClick={() => setEdit(false)}>Cancel</button><button className="btn" onClick={save}>Save changes</button></div>
    </div>
  );
  return (
    <div className="card flex items-center gap-3 py-3">
      <div className="flex-1">
        <div>{x.type === "income" ? "Income" : x.cat}</div>
        {x.note && <div className="text-sm text-mute">{x.note}</div>}
        <div className="text-xs text-mute">{showDate ? dt(x.at) : tm(x.at)}</div>
      </div>
      <div className={x.type === "income" ? "font-semibold text-inc" : "font-semibold text-out"}>{x.type === "income" ? "+" : "−"}{money(x.amount)}</div>
      <button aria-label="Edit entry" onClick={open}><Pencil size={18} className="text-mute" /></button>
      <button aria-label="Delete entry" onClick={() => setTxns((p) => p.filter((t) => t.id !== x.id))}><Trash2 size={18} className="text-mute" /></button>
    </div>
  );
}

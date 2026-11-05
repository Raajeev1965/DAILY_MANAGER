"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
import { Txn, CATS, money, tm, Setter } from "@/lib/store";

type Mode = "day" | "week" | "month" | "custom";
const key = (n: number | Date) => {
  const d = new Date(n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const sum = (l: Txn[]) => l.reduce((s, x) => s + x.amount, 0);

export default function Records({ txns, setTxns }: { txns: Txn[]; setTxns: Setter<Txn[]> }) {
  const [mode, setMode] = useState<Mode>("month");
  const [anchor, setAnchor] = useState(startOfDay(new Date()));
  const [from, setFrom] = useState(key(addDays(new Date(), -6)));
  const [to, setTo] = useState(key(new Date()));
  const [head, setHead] = useState("");

  let start: Date, end: Date; // end is exclusive
  if (mode === "day") { start = anchor; end = addDays(anchor, 1); }
  else if (mode === "week") { start = addDays(anchor, -((anchor.getDay() + 6) % 7)); end = addDays(start, 7); } // weeks run Monday to Sunday
  else if (mode === "month") { start = new Date(anchor.getFullYear(), anchor.getMonth(), 1); end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1); }
  else { start = new Date(from + "T00:00:00"); end = addDays(new Date(to + "T00:00:00"), 1); }
  const ok = !isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() > start.getTime();

  const dayList: Date[] = [];
  if (ok) for (let d = start; d.getTime() < end.getTime() && dayList.length < 366; d = addDays(d, 1)) dayList.push(d);

  const inRange = ok ? txns.filter((x) => x.at >= start.getTime() && x.at < end.getTime()) : [];
  const exp = inRange.filter((x) => x.type === "expense");
  const income = sum(inRange.filter((x) => x.type === "income"));
  const spent = sum(exp);
  const byHead = CATS.map((c) => ({ c, v: sum(exp.filter((x) => x.cat === c)), n: exp.filter((x) => x.cat === c).length }));
  const shown = inRange.filter((x) => !head || (head === "Income" ? x.type === "income" : x.type === "expense" && x.cat === head));

  const groups: Record<string, Txn[]> = {};
  shown.forEach((x) => { (groups[key(x.at)] ||= []).push(x); });
  const groupKeys = Object.keys(groups).sort().reverse();

  const shift = (n: number) => {
    if (mode === "day") setAnchor(addDays(anchor, n));
    else if (mode === "week") setAnchor(addDays(anchor, 7 * n));
    else setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + n, 1));
  };
  const label = !ok ? "Pick a valid range"
    : mode === "day" ? fmt(start)
    : mode === "month" ? start.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : `${fmt(start)} – ${fmt(addDays(end, -1))}`;

  const exportCsv = () => {
    const rows = [["Date", "Time", "Type", "Head", "Note", "Amount"],
      ...[...shown].sort((a, b) => a.at - b.at).map((x) => [key(x.at), tm(x.at), x.type, x.cat, x.note, String(x.amount)])];
    const body = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + body], { type: "text/csv" }));
    a.download = `daybook-${key(start)}-to-${key(addDays(end, -1))}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {(["day", "week", "month", "custom"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-xl border py-2 text-sm font-medium capitalize ${mode === m ? "border-brand bg-brand text-paper" : "border-line"}`}>{m}</button>
        ))}
      </div>

      {mode === "custom" ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-mute">From<input className="inp" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="text-xs text-mute">To<input className="inp" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <button aria-label="Previous" onClick={() => shift(-1)}><ChevronLeft /></button>
          <div className="text-center font-semibold">{label}</div>
          <button aria-label="Next" onClick={() => shift(1)}><ChevronRight /></button>
        </div>
      )}
      {mode === "custom" && !ok && <p className="text-sm text-out">{label}. The end date must be on or after the start date.</p>}

      <div className="card">
        <div className="text-sm text-mute">Total spent</div>
        <div className="text-4xl font-bold">{money(spent)}</div>
        <div className="mt-2 flex gap-6 text-sm"><span className="text-inc">Income {money(income)}</span><span>Balance {money(income - spent)}</span></div>
      </div>

      <div className="card space-y-3">
        <div className="font-semibold">By head</div>
        {byHead.map(({ c, v, n }) => (
          <button key={c} className="block w-full text-left" onClick={() => setHead(head === c ? "" : c)}>
            <div className="flex justify-between text-sm"><span>{c} <span className="text-mute">({n})</span></span><span>{money(v)}{spent ? ` · ${Math.round((v / spent) * 100)}%` : ""}</span></div>
            <div className="h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-brand" style={{ width: `${spent ? (v / spent) * 100 : 0}%` }} /></div>
          </button>
        ))}
      </div>

      {dayList.length > 1 && dayList.length <= 31 && (
        <div className="card overflow-x-auto">
          <div className="mb-2 font-semibold">Day by day, under each head</div>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-card pr-3 text-left font-normal text-mute">Head</th>
                {dayList.map((d) => <th key={key(d)} className="px-2 text-center font-normal text-mute"><div>{"SMTWTFS"[d.getDay()]}</div><div>{d.getDate()}</div></th>)}
                <th className="pl-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...byHead.map((h) => h.c), "All heads"].map((c) => (
                <tr key={c} className={c === "All heads" ? "border-t border-line font-semibold" : ""}>
                  <td className="sticky left-0 bg-card py-1 pr-3 whitespace-nowrap">{c}</td>
                  {dayList.map((d) => {
                    const v = sum(exp.filter((x) => key(x.at) === key(d) && (c === "All heads" || x.cat === c)));
                    return <td key={key(d)} className="px-2 text-right">{v ? v.toLocaleString("en-IN") : "–"}</td>;
                  })}
                  <td className="pl-3 text-right">{money(sum(exp.filter((x) => c === "All heads" || x.cat === c)))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {["", ...CATS, "Income"].map((c) => (
          <button key={c} onClick={() => setHead(c)} className={`rounded-full border px-3 py-1 text-sm ${head === c ? "border-brand bg-brand text-paper" : "border-line"}`}>{c || "All"}</button>
        ))}
      </div>

      <button className="btn flex w-full items-center justify-center gap-2" onClick={exportCsv} disabled={!shown.length}><Download size={18} />Download these records (CSV)</button>

      {groupKeys.length === 0 && <p className="text-mute">No records in this period.</p>}
      {groupKeys.map((k) => (
        <div key={k} className="space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span>{new Date(k + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
            <span className="text-out">{money(sum(groups[k].filter((x) => x.type === "expense")))}</span>
          </div>
          {groups[k].sort((a, b) => b.at - a.at).map((x) => (
            <div key={x.id} className="card flex items-center gap-3 py-3">
              <div className="flex-1">
                {x.type === "expense" ? (
                  <select aria-label="Change head" className="rounded-lg bg-paper px-1 py-0.5 text-sm" value={x.cat}
                    onChange={(e) => setTxns((p) => p.map((t) => (t.id === x.id ? { ...t, cat: e.target.value } : t)))}>
                    {CATS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                ) : <div>Income</div>}
                {x.note && <div className="text-sm text-mute">{x.note}</div>}
                <div className="text-xs text-mute">{tm(x.at)}</div>
              </div>
              <div className={x.type === "income" ? "font-semibold text-inc" : "font-semibold text-out"}>{x.type === "income" ? "+" : "−"}{money(x.amount)}</div>
              <button aria-label="Delete" onClick={() => setTxns((p) => p.filter((t) => t.id !== x.id))}><Trash2 size={18} className="text-mute" /></button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

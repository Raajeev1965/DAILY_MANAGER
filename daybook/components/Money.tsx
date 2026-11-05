"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Txn, CATS, uid, money, dt, Setter } from "@/lib/store";
import { guess } from "@/lib/category";

const sum = (l: Txn[]) => l.reduce((s, x) => s + x.amount, 0);

export default function Money({ txns, setTxns }: { txns: Txn[]; setTxns: Setter<Txn[]> }) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [note, setNote] = useState("");
  const [manual, setManual] = useState(false);
  const now = new Date();
  const mt = txns.filter((x) => { const d = new Date(x.at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const inc = sum(mt.filter((x) => x.type === "income"));
  const exp = sum(mt.filter((x) => x.type === "expense"));
  const by = CATS.map((c) => [c, sum(mt.filter((x) => x.type === "expense" && x.cat === c))] as const);
  const max = Math.max(1, ...by.map((b) => b[1]));
  const add = () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    setTxns((p) => [{ id: uid(), type, amount: n, cat: type === "income" ? "Income" : cat, note, at: Date.now() }, ...p]);
    setAmount(""); setNote(""); setManual(false); setCat(CATS[0]);
  };
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-sm text-mute">{now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })} balance</div>
        <div className="text-4xl font-bold">{money(inc - exp)}</div>
        <div className="mt-2 flex gap-6 text-sm">
          <span className="text-inc">Income {money(inc)}</span><span className="text-out">Spent {money(exp)}</span>
        </div>
      </div>
      <div className="card space-y-3">
        {by.map(([c, v]) => (
          <div key={c}>
            <div className="flex justify-between text-sm"><span>{c}</span><span>{money(v)}</span></div>
            <div className="h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-brand" style={{ width: `${(v / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="card space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {(["expense", "income"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`rounded-xl border py-2 font-medium ${type === t ? "border-brand bg-brand text-paper" : "border-line"}`}>
              {t === "expense" ? "Expense" : "Income"}
            </button>
          ))}
        </div>
        <input className="inp" inputMode="decimal" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="inp" placeholder={type === "expense" ? "What was it for? e.g. petrol, milk, Jio recharge" : "Note (optional)"} value={note}
          onChange={(e) => { setNote(e.target.value); if (!manual) setCat(guess(e.target.value).cat); }} />
        {type === "expense" && (
          <div>
            <div className="mb-1 text-xs text-mute">{manual ? "Head chosen by you" : "Head sorted automatically. Tap to change."}</div>
            <div className="flex flex-wrap gap-2">
              {CATS.map((c) => (
                <button key={c} onClick={() => { setCat(c); setManual(true); }} className={`rounded-full border px-3 py-1 text-sm ${cat === c ? "border-brand bg-brand text-paper" : "border-line"}`}>{c}</button>
              ))}
            </div>
          </div>
        )}
        <button className="btn w-full" onClick={add}>Save {type}</button>
      </div>
      {txns.length === 0 && <p className="text-mute">No transactions yet. Add your first one above.</p>}
      {txns.slice(0, 50).map((x) => (
        <div key={x.id} className="card flex items-center gap-3 py-3">
          <div className="flex-1">
            {x.type === "expense" ? (
              <select aria-label="Change head" className="rounded-lg bg-paper px-1 py-0.5 text-sm" value={x.cat}
                onChange={(e) => setTxns((p) => p.map((t) => (t.id === x.id ? { ...t, cat: e.target.value } : t)))}>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
            ) : <div>Income</div>}
            {x.note && <div className="text-sm text-mute">{x.note}</div>}
            <div className="text-xs text-mute">{dt(x.at)}</div>
          </div>
          <div className={x.type === "income" ? "font-semibold text-inc" : "font-semibold text-out"}>{x.type === "income" ? "+" : "−"}{money(x.amount)}</div>
          <button aria-label="Delete" onClick={() => setTxns((p) => p.filter((t) => t.id !== x.id))}><Trash2 size={18} className="text-mute" /></button>
        </div>
      ))}
    </div>
  );
}

"use client";
import { useState } from "react";
import VoiceField from "@/components/VoiceField";
import { Trash2 } from "lucide-react";
import { Txn, CATS, uid, money, dt, Setter } from "@/lib/store";
import { guess } from "@/lib/category";
import { amountIn } from "@/lib/voice";
import Records from "@/components/Records";
import TxnRow from "@/components/TxnRow";

const sum = (l: Txn[]) => l.reduce((s, x) => s + x.amount, 0);

export default function Money({ txns, setTxns }: { txns: Txn[]; setTxns: Setter<Txn[]> }) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [note, setNote] = useState("");
  const [manual, setManual] = useState(false);
  const [view, setView] = useState<"add" | "records">("add");
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const now = new Date();
  const mt = txns.filter((x) => { const d = new Date(x.at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const inc = sum(mt.filter((x) => x.type === "income"));
  const exp = sum(mt.filter((x) => x.type === "expense"));
  const by = CATS.map((c) => [c, sum(mt.filter((x) => x.type === "expense" && x.cat === c))] as const);
  const max = Math.max(1, ...by.map((b) => b[1]));
  const add = () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    setTxns((p) => [{ id: uid(), type, amount: n, cat: type === "income" ? "Income" : cat, note, at: date === new Date().toLocaleDateString("en-CA") ? Date.now() : new Date(date + "T12:00:00").getTime() }, ...p]);
    setAmount(""); setNote(""); setManual(false); setCat(CATS[0]);
  };
  const seg = (
    <div className="grid grid-cols-2 gap-2">
      {([["add", "Add & this month"], ["records", "Records"]] as const).map(([v, l]) => (
        <button key={v} onClick={() => setView(v)} className={`rounded-xl border py-2 font-medium ${view === v ? "border-brand bg-brand text-paper" : "border-line"}`}>{l}</button>
      ))}
    </div>
  );
  if (view === "records") return <div className="space-y-4">{seg}<Records txns={txns} setTxns={setTxns} /></div>;
  return (
    <div className="space-y-4">
      {seg}
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
        <input className="inp" type="date" aria-label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="inp" inputMode="decimal" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <VoiceField placeholder={type === "expense" ? "What was it for? e.g. petrol, milk, Jio recharge" : "Note (optional)"} value={note}
          onChange={(v) => { setNote(v); if (!manual) setCat(guess(v).cat); if (!amount) { const n = amountIn(v); if (n) setAmount(String(n)); } }} />
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
      {txns.slice(0, 50).map((x) => <TxnRow key={x.id} x={x} setTxns={setTxns} showDate />)}
    </div>
  );
}

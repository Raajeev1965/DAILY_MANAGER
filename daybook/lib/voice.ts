import { CATS } from "./store";

export type Intent =
  | { kind: "note"; text: string }
  | { kind: "task"; title: string; due?: number; alarm: boolean }
  | { kind: "appt"; title: string; at: number }
  | { kind: "txn"; type: "income" | "expense"; amount: number; cat: string; note: string };

const KEYS: Record<string, string[]> = {
  Grocery: ["grocery", "groceries", "vegetable", "milk", "kirana"],
  Health: ["health", "medicine", "doctor", "hospital", "medical"],
  Communication: ["communication", "recharge", "mobile", "phone", "internet", "wifi"],
  Bills: ["bill", "electricity", "rent", "water", "gas"],
  Fuel: ["fuel", "petrol", "diesel"],
};

function when(s: string): { at?: number; rest: string } {
  const now = new Date(), d = new Date(now);
  let t = s, day = false;
  if (/\btomorrow\b/.test(t)) { d.setDate(d.getDate() + 1); day = true; t = t.replace(/\btomorrow\b/, ""); }
  t = t.replace(/\btoday\b/, "");
  ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].forEach((n, i) => {
    if (new RegExp("\\b" + n + "\\b").test(t)) {
      d.setDate(now.getDate() + ((i - now.getDay() + 7) % 7 || 7)); day = true; t = t.replace(n, "");
    }
  });
  let h = -1, mi = 0;
  const a = t.match(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\b\.?/);
  const b = t.match(/\bat\s+(\d{1,2})(?::(\d{2}))?/);
  if (a) { h = (+a[1] % 12) + (a[3] === "p" ? 12 : 0); mi = +(a[2] || 0); t = t.replace(a[0], ""); }
  else if (b) { h = +b[1]; mi = +(b[2] || 0); t = t.replace(b[0], ""); }
  if (h < 0 && !day) return { rest: t };
  d.setHours(h < 0 ? 9 : h, mi, 0, 0);
  if (!day && d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return { at: d.getTime(), rest: t };
}

const cap = (x: string) => x.replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());

export function parse(raw: string): Intent {
  const s = raw.trim(), l = s.toLowerCase();
  const amt = l.match(/(\d+(?:\.\d+)?)/);
  if (/^(spent|paid|expense|bought)\b/.test(l) && amt) {
    const cat = CATS.find((c) => KEYS[c]?.some((k) => l.includes(k)) || l.includes(c.toLowerCase())) || "Miscellaneous";
    return { kind: "txn", type: "expense", amount: +amt[1], cat, note: cap(s) };
  }
  if (/^(received|earned|income|salary|got)\b/.test(l) && amt)
    return { kind: "txn", type: "income", amount: +amt[1], cat: "Income", note: cap(s) };

  const w = when(l);
  const title = (re: RegExp) => cap(w.rest.replace(re, ""));
  if (/^(remind|reminder)/.test(l))
    return { kind: "task", title: title(/^\s*(remind me to|remind me|reminder)\s*/), due: w.at, alarm: !!w.at };
  if (/^(add task|task|todo)/.test(l))
    return { kind: "task", title: title(/^\s*(add task|task|todo)\s*/), due: w.at, alarm: !!w.at };
  if (/^(appointment|meeting|schedule)/.test(l))
    return { kind: "appt", title: title(/^\s*(appointment with|appointment|meeting with|meeting|schedule)\s*/), at: w.at ?? Date.now() + 864e5 };
  return { kind: "note", text: cap(s.replace(/^note[:,]?\s*/i, "")) };
}

export function listen(onText: (t: string) => void, onEnd: () => void): boolean {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return false;
  const r = new SR();
  r.lang = "en-IN";
  r.onresult = (e: any) => onText(e.results[0][0].transcript);
  r.onend = onEnd;
  r.onerror = onEnd;
  r.start();
  return true;
}

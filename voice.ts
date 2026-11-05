import { guess } from "./category";

export type Intent =
  | { kind: "note"; text: string }
  | { kind: "task"; title: string; due?: number; alarm: boolean }
  | { kind: "appt"; title: string; at: number }
  | { kind: "txn"; type: "income" | "expense"; amount: number; cat: string; note: string };

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
  const s = raw.trim();
  const l = s.toLowerCase().replace(/(\d),(\d{3})/g, "$1$2");
  const w = when(l);
  const title = (re: RegExp) => cap(w.rest.replace(re, ""));

  if (/^note\b/.test(l)) return { kind: "note", text: cap(s.replace(/^note[:,]?\s*/i, "")) };
  if (/^(remind|reminder)/.test(l))
    return { kind: "task", title: title(/^\s*(remind me to|remind me|reminder)\s*/), due: w.at, alarm: !!w.at };
  if (/^(add task|task|todo)/.test(l))
    return { kind: "task", title: title(/^\s*(add task|task|todo)\s*/), due: w.at, alarm: !!w.at };
  if (/^(appointment|meeting|schedule)/.test(l))
    return { kind: "appt", title: title(/^\s*(appointment with|appointment|meeting with|meeting|schedule)\s*/), at: w.at ?? Date.now() + 864e5 };

  // Money: needs a number, plus a money word, an expense verb, or a known category word.
  const amt = l.match(/(\d+(?:\.\d+)?)/);
  if (amt) {
    const g = guess(l);
    const isIncome = /\b(received|earned|income|salary|credited|bonus|refund|got paid)\b/.test(l);
    const isExpense = /^(spent|paid|expense|bought|purchased|gave)\b/.test(l) || /\b(rupees|rs|inr)\b|₹/.test(l) || g.score > 0;
    if (isIncome) return { kind: "txn", type: "income", amount: +amt[1], cat: "Income", note: cap(s) };
    if (isExpense) return { kind: "txn", type: "expense", amount: +amt[1], cat: g.cat, note: cap(s) };
  }
  return { kind: "note", text: cap(s) };
}

export type Mic = { stop: () => void };

const ERRORS: Record<string, string> = {
  "not-allowed": "The microphone is blocked. Allow it in the browser's site settings, then tap Speak again.",
  "service-not-allowed": "Voice input is blocked here. If Daybook is on your Home Screen, open it in Chrome instead, or type below.",
  "no-speech": "I didn't hear anything. Tap Speak again and talk closer to the phone.",
  "audio-capture": "No microphone was found.",
  network: "Voice input needs an internet connection.",
  "language-not-supported": "Your phone's voice engine doesn't support this language.",
};

export function listen(lang: string, o: { onText: (t: string) => void; onStatus: (s: string) => void; onEnd: () => void }): Mic | null {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  let active = true, finalText = "", silent = 0, r: any;
  // Phones end a session after a short pause, so we restart it until the person taps stop.
  const begin = () => {
    r = new SR();
    r.lang = lang; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
    let heard = false;
    r.onstart = () => o.onStatus("Listening… tap the mic again when you are done");
    r.onresult = (e: any) => {
      heard = true;
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += (finalText ? " " : "") + res[0].transcript.trim();
        else interim += res[0].transcript;
      }
      o.onText((finalText + " " + interim).trim());
    };
    r.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      active = false;
      o.onStatus(ERRORS[e.error] || "Voice error: " + e.error);
    };
    r.onend = () => {
      if (!active) { o.onEnd(); return; }
      silent = heard ? 0 : silent + 1;
      if (silent >= 2) {
        active = false;
        o.onStatus(finalText ? "" : "I didn't hear anything. Tap the mic and talk closer to the phone.");
        o.onEnd();
        return;
      }
      setTimeout(() => { if (active) { try { begin(); } catch { active = false; o.onEnd(); } } }, 200);
    };
    r.start();
  };
  try { begin(); } catch { o.onStatus("Could not start the microphone."); return null; }
  return { stop: () => { active = false; o.onStatus(""); try { r.stop(); } catch {} } };
}

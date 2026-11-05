"use client";
import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { listen, Mic as Ctl } from "@/lib/voice";

type Props = { value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; onEnter?: () => void };

// A text box with a built-in mic button: speak and the words are typed in for you.
export default function VoiceField({ value, onChange, placeholder, multiline, onEnter }: Props) {
  const [on, setOn] = useState(false);
  const [msg, setMsg] = useState("");
  const ctl = useRef<Ctl | null>(null);

  const toggle = () => {
    if (on) { ctl.current?.stop(); return; }
    const base = value.trim();
    let lang = "en-IN";
    try { lang = JSON.parse(localStorage.getItem("daybook:lang") || '"en-IN"'); } catch {}
    setMsg(""); setOn(true);
    const c = listen(lang, { onText: (t) => onChange(base ? base + " " + t : t), onStatus: setMsg, onEnd: () => setOn(false) });
    if (!c) { setOn(false); setMsg("Voice input isn't supported in this browser. Use your keyboard's mic key."); }
    ctl.current = c;
  };

  return (
    <div>
      <div className="relative">
        {multiline ? (
          <textarea className="inp min-h-24 pr-12" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input className="inp pr-12" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onEnter?.()} />
        )}
        <button type="button" aria-label={on ? "Stop listening" : "Speak"} onClick={toggle}
          className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full ${on ? "ring-pulse bg-out text-paper" : "bg-alarm text-[#2A1C00]"}`}>
          {on ? <Square size={16} /> : <Mic size={18} />}
        </button>
      </div>
      {msg && <div role="status" className="mt-1 text-xs text-mute">{msg}</div>}
    </div>
  );
}

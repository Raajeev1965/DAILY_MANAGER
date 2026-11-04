"use client";
import { useEffect, useState, Dispatch, SetStateAction } from "react";

export type Note = { id: string; text: string; at: number };
export type Task = { id: string; title: string; due?: number; done: boolean; alarm: boolean };
export type Appt = { id: string; title: string; at: number; remind: number; alarm: boolean };
export type Txn = { id: string; type: "income" | "expense"; amount: number; cat: string; note: string; at: number };
export type Set<T> = Dispatch<SetStateAction<T>>;

export const CATS = ["Grocery", "Health", "Communication", "Bills", "Fuel", "Miscellaneous"];
export const uid = () => Math.random().toString(36).slice(2, 10);
export const money = (n: number) => "₹" + n.toLocaleString("en-IN");
export const tm = (n: number) => new Date(n).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
export const dt = (n: number) => new Date(n).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// Local-first storage: state is kept in the browser (localStorage) on this device.
export function useStore<T>(key: string, init: T) {
  const [v, setV] = useState<T>(init);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem("daybook:" + key); if (s) setV(JSON.parse(s)); } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => { if (ready) localStorage.setItem("daybook:" + key, JSON.stringify(v)); }, [key, v, ready]);
  return [v, setV] as const;
}

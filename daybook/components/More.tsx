"use client";
import { useState } from "react";

export default function More({ testAlarm, exportData }: { testAlarm: () => void; exportData: () => void }) {
  const [perm, setPerm] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const ask = async () => { if (typeof Notification !== "undefined") setPerm(await Notification.requestPermission()); };
  return (
    <div className="space-y-3">
      <div className="card space-y-2">
        <div className="font-semibold">Alarms</div>
        <p className="text-sm text-mute">Notifications: {perm}. The ringing alarm plays while the app is open. When it is closed, you get a notification instead.</p>
        <button className="btn w-full" onClick={ask}>Allow notifications</button>
        <button className="btn w-full" onClick={testAlarm}>Test alarm sound</button>
      </div>
      <div className="card space-y-2">
        <div className="font-semibold">Backup</div>
        <p className="text-sm text-mute">Data is stored only on this device. Download a copy regularly.</p>
        <button className="btn w-full" onClick={exportData}>Download backup (JSON)</button>
      </div>
    </div>
  );
}

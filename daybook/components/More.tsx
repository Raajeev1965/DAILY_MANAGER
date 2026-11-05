"use client";
import { useState } from "react";
import { isNative, setupAlarms } from "@/lib/native";

type Props = { testAlarm: () => void; exportData: () => void; importData: (f: File) => void; canInstall: boolean; install: () => void };

export default function More({ testAlarm, exportData, importData, canInstall, install }: Props) {
  const native = isNative();
  const [perm, setPerm] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const [msg, setMsg] = useState("");
  const installed = native || (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches);
  const ask = async () => {
    if (native) setMsg(await setupAlarms());
    else if (typeof Notification !== "undefined") setPerm(await Notification.requestPermission());
  };
  return (
    <div className="space-y-3">
      {!native && (
        <div className="card space-y-2">
          <div className="font-semibold">Install on your phone</div>
          {installed ? <p className="text-sm text-mute">Daybook is installed and running as an app.</p> : canInstall ? (
            <>
              <p className="text-sm text-mute">Add Daybook to your home screen so it opens like a normal app.</p>
              <button className="btn w-full" onClick={install}>Install Daybook</button>
            </>
          ) : (
            <p className="text-sm text-mute">Open this page in Chrome on Android, tap the ⋮ menu, then choose “Install app” (or “Add to Home screen”).</p>
          )}
        </div>
      )}
      <div className="card space-y-2">
        <div className="font-semibold">Alarms</div>
        <p className="text-sm text-mute">
          {native ? msg || "Alarms ring at the set time even when the app is closed. If one does not ring, tap the button below and allow notifications and alarms." : `Notifications: ${perm}. The ringing alarm plays while the app is open. When it is closed, you get a notification instead.`}
        </p>
        <button className="btn w-full" onClick={ask}>{native ? "Set up alarms" : "Allow notifications"}</button>
        <button className="btn w-full" onClick={testAlarm}>Test alarm sound</button>
      </div>
      <div className="card space-y-2">
        <div className="font-semibold">Backup</div>
        <p className="text-sm text-mute">Data is stored only on this device. Download a copy regularly. Restoring replaces what is on this device.</p>
        <button className="btn w-full" onClick={exportData}>Download backup (JSON)</button>
        <label className="btn block cursor-pointer text-center">
          Restore from backup
          <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ""; }} />
        </label>
      </div>
    </div>
  );
}

let ctx: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | undefined;

export function startRing() {
  stopRing();
  try {
    ctx = new AudioContext();
    const beep = () => {
      if (!ctx) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "square"; o.frequency.value = 880; g.gain.value = 0.2;
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.25);
      navigator.vibrate?.([300, 150, 300]);
    };
    beep();
    timer = setInterval(beep, 900);
  } catch {}
}

export function stopRing() {
  clearInterval(timer);
  ctx?.close().catch(() => {});
  ctx = null;
}

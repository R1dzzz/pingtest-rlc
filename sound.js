// Nada singkat dibuat dengan Web Audio (tanpa berkas audio). Hanya diputar jika Member
// mengaktifkan "Suara" di Pusat Pengaturan.
let ctx = null;
let enabled = false;

export function setSoundEnabled(on) { enabled = !!on; }

function tone(freq, start, dur, vol = 0.05, type = 'sine') {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.02);
}

export function playSound(name) {
  if (!enabled) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    if (name === 'start') { tone(660, 0, 0.09); }
    else if (name === 'done') { tone(660, 0, 0.12); tone(880, 0.13, 0.12); tone(1175, 0.26, 0.2); }
    else if (name === 'error') { tone(220, 0, 0.22, 0.06, 'triangle'); tone(165, 0.2, 0.3, 0.06, 'triangle'); }
    else if (name === 'tick') { tone(900, 0, 0.04, 0.03); }
  } catch { /* abaikan: suara bersifat opsional */ }
}

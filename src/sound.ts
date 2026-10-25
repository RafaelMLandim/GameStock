/**
 * Música tema e efeitos sonoros, sintetizados na hora pelo Web Audio (nenhum arquivo para baixar).
 * Os navegadores só liberam som depois de um toque na tela: `unlock()` é chamado no primeiro toque.
 */

const PREFS_KEY = 'fronteira-do-estoque:som';

interface Prefs {
  music: boolean;
  effects: boolean;
}

function loadPrefs(): Prefs {
  try {
    return { music: true, effects: true, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') };
  } catch {
    return { music: true, effects: true };
  }
}

let prefs = loadPrefs();
const listeners = new Set<() => void>();

let ctx: AudioContext | null = null;
let musicBus: GainNode | null = null;
let fxBus: GainNode | null = null;

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.08;
  musicBus.connect(ctx.destination);
  fxBus = ctx.createGain();
  fxBus.gain.value = 0.5;
  fxBus.connect(ctx.destination);
  return ctx;
}

export function soundPrefs(): Prefs {
  return prefs;
}

export function setSoundPrefs(changes: Partial<Prefs>) {
  prefs = { ...prefs, ...changes };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  if (prefs.music) startMusic();
  else stopMusic();
  listeners.forEach((l) => l());
}

export function onSoundPrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Chamado no primeiro toque: só então o navegador deixa tocar. */
/**
 * Chamado a cada toque/clique/tecla até o som estar liberado. No celular só o fim do toque
 * libera áudio (o começo não conta), e o play() precisa acontecer dentro do próprio toque.
 */
export function unlock() {
  const c = audio();
  if (c && c.state !== 'running') {
    // resume() demora um instante: a trilha sintetizada só começa depois dele.
    void c.resume().then(() => {
      if (prefs.music && musicReady && !themeEl) startSynth(c);
    });
  }
  if (prefs.music && !musicPlaying()) startMusic();
}

const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
GESTURES.forEach((type) => window.addEventListener(type, unlock, { capture: true, passive: true }));

// Com a aba escondida (celular bloqueado, outro app), pausa tudo para poupar bateria.
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) void ctx.suspend();
  else void ctx.resume();
});

/* ---------- peças de síntese ---------- */

function freq(note: string): number {
  const m = /^([A-G])(#|b)?(\d)$/.exec(note)!;
  const base = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1] as 'A'];
  const semis = base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * 2 ** (semis / 12);
}

function envelope(g: GainNode, at: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
}

function tone(out: AudioNode, type: OscillatorType, f: number, at: number, peak: number, attack: number, decay: number, slideTo?: number) {
  const c = ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, at);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + attack + decay);
  envelope(g, at, peak, attack, decay);
  o.connect(g).connect(out);
  o.start(at);
  o.stop(at + attack + decay + 0.05);
}

let noiseBuffer: AudioBuffer | null = null;
function noise(out: AudioNode, at: number, peak: number, decay: number, filter: BiquadFilterType, cutoff: number) {
  const c = ctx!;
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  const f = c.createBiquadFilter();
  f.type = filter;
  f.frequency.value = cutoff;
  const g = c.createGain();
  envelope(g, at, peak, 0.004, decay);
  src.connect(f).connect(g).connect(out);
  src.start(at);
  src.stop(at + decay + 0.05);
}

/** Eco de cânion para o tiro. */
function canyonEcho(): AudioNode {
  const c = ctx!;
  const input = c.createGain();
  const delay = c.createDelay();
  delay.delayTime.value = 0.23;
  const feedback = c.createGain();
  feedback.gain.value = 0.32;
  const tail = c.createBiquadFilter();
  tail.type = 'lowpass';
  tail.frequency.value = 1400;
  input.connect(fxBus!);
  input.connect(delay);
  delay.connect(tail).connect(feedback).connect(delay);
  tail.connect(fxBus!);
  // O eco realimenta a si mesmo: desmonta depois que some, para não acumular a cada tiro.
  window.setTimeout(() => [input, delay, feedback, tail].forEach((n) => n.disconnect()), 3000);
  return input;
}

/* ---------- efeitos ---------- */

function play(build: (c: AudioContext, now: number, out: AudioNode) => void) {
  if (!prefs.effects) return;
  const c = audio();
  if (!c || !fxBus) return;
  if (c.state === 'suspended') void c.resume();
  build(c, c.currentTime + 0.01, fxBus);
}

export const sfx = {
  /** Tiro de revólver com eco. */
  shot: () =>
    play((_c, t) => {
      const out = canyonEcho();
      noise(out, t, 1, 0.35, 'lowpass', 2600);
      noise(out, t, 0.6, 0.08, 'highpass', 3000);
      tone(out, 'sine', 140, t, 0.9, 0.003, 0.25, 40);
    }),
  /** Sino do duelo. */
  bell: () =>
    play((_c, t, out) => {
      tone(out, 'sine', 880, t, 0.5, 0.003, 1.2);
      tone(out, 'sine', 2213, t, 0.18, 0.003, 0.6);
      tone(out, 'sine', 1320, t, 0.12, 0.003, 0.9);
    }),
  correct: () =>
    play((_c, t, out) => {
      tone(out, 'triangle', freq('E5'), t, 0.35, 0.01, 0.12);
      tone(out, 'triangle', freq('A5'), t + 0.09, 0.35, 0.01, 0.2);
    }),
  wrong: () =>
    play((_c, t, out) => {
      tone(out, 'square', 170, t, 0.12, 0.01, 0.25, 110);
    }),
  /** Virar carta, mover item. */
  flip: () =>
    play((_c, t, out) => {
      noise(out, t, 0.35, 0.05, 'highpass', 2500);
    }),
  /** Acertar o alvo (garrafa, cacto). */
  hit: () =>
    play((_c, t, out) => {
      noise(out, t, 0.5, 0.06, 'highpass', 1800);
      tone(out, 'sine', 1500, t, 0.25, 0.002, 0.18);
      tone(out, 'sine', 2350, t, 0.15, 0.002, 0.12);
    }),
  /** Casco de cavalo (corrida). */
  hoof: () =>
    play((_c, t, out) => {
      tone(out, 'sine', 420, t, 0.4, 0.002, 0.05, 260);
      noise(out, t, 0.2, 0.03, 'bandpass', 1200);
    }),
  /** Caixa registradora: "tchan-tchin" de moedas (troca no armazém). */
  coins: () =>
    play((_c, t, out) => {
      noise(out, t, 0.35, 0.06, 'bandpass', 3000);
      tone(out, 'triangle', freq('B5'), t + 0.02, 0.3, 0.003, 0.12);
      tone(out, 'triangle', freq('E6'), t + 0.12, 0.35, 0.003, 0.5);
      tone(out, 'sine', freq('B6'), t + 0.12, 0.12, 0.003, 0.35);
      [0.2, 0.27, 0.33].forEach((d) => tone(out, 'sine', 2600 + d * 900, t + d, 0.1, 0.002, 0.08));
    }),
  /** Fanfarra de vitória. */
  win: () =>
    play((_c, t, out) => {
      ['C5', 'E5', 'G5'].forEach((n, i) => tone(out, 'triangle', freq(n), t + i * 0.11, 0.3, 0.01, 0.16));
      ['C5', 'E5', 'G5', 'C6'].forEach((n) => tone(out, 'triangle', freq(n), t + 0.36, 0.18, 0.02, 0.9));
    }),
  /** "Uá, uá, uá, uáaa" de derrota. */
  lose: () =>
    play((c, t, out) => {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 900;
      f.connect(out);
      ['G4', 'F#4', 'F4'].forEach((n, i) => tone(f, 'sawtooth', freq(n) / 2, t + i * 0.32, 0.25, 0.04, 0.26));
      tone(f, 'sawtooth', freq('E4') / 2, t + 0.96, 0.25, 0.05, 0.9, freq('D4') / 2);
    }),
};

/* ---------- música tema ---------- */

const BPM = 96;
const BEAT = 60 / BPM;

// Cadência andaluza (Lá menor, Sol, Fá, Mi), a cara dos filmes de faroeste. Uma nota por compasso.
const CHORDS: string[][] = [
  ['A2', 'A3', 'C4', 'E4'],
  ['A2', 'A3', 'C4', 'E4'],
  ['G2', 'G3', 'B3', 'D4'],
  ['G2', 'G3', 'B3', 'D4'],
  ['F2', 'F3', 'A3', 'C4'],
  ['F2', 'F3', 'A3', 'C4'],
  ['E2', 'E3', 'G#3', 'B3'],
  ['E2', 'E3', 'G#3', 'B3'],
];

// Melodia assobiada: [nota ou '-' para pausa, duração em tempos], 4 tempos por compasso.
const MELODY: [string, number][] = [
  ['E5', 1.5], ['D5', 0.5], ['E5', 2],
  ['A4', 1], ['C5', 1], ['E5', 1], ['A5', 1],
  ['G5', 2], ['F5', 0.5], ['E5', 0.5], ['D5', 1],
  ['B4', 3], ['-', 1],
  ['A4', 1.5], ['C5', 0.5], ['F5', 2],
  ['E5', 1], ['D5', 1], ['C5', 1], ['A4', 1],
  ['B4', 2], ['G#4', 1], ['B4', 1],
  ['E5', 3], ['-', 1],
];

const LOOP_BEATS = CHORDS.length * 4;

function whistle(note: string, at: number, beats: number) {
  const c = ctx!;
  const dur = beats * BEAT;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq(note) * 0.97, at);
  o.frequency.exponentialRampToValueAtTime(freq(note), at + 0.06);
  // vibrato do assobio
  const lfo = c.createOscillator();
  const depth = c.createGain();
  lfo.frequency.value = 5.5;
  depth.gain.value = freq(note) * 0.008;
  lfo.connect(depth).connect(o.frequency);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.5, at + 0.05);
  g.gain.setValueAtTime(0.5, at + dur * 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur * 0.98);
  o.connect(g).connect(session!);
  o.start(at);
  lfo.start(at);
  o.stop(at + dur);
  lfo.stop(at + dur);
}

function pluck(note: string, at: number, peak: number) {
  const c = ctx!;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(2400, at);
  f.frequency.exponentialRampToValueAtTime(500, at + 0.3);
  f.connect(session!);
  tone(f, 'sawtooth', freq(note), at, peak, 0.004, 0.45);
}

/** Um compasso de violão "bum-chique" e o trote do cavalo. */
function bar(chord: string[], at: number) {
  const [root, ...upper] = chord;
  const fifth = freq(root) * 1.5;
  for (let beat = 0; beat < 4; beat++) {
    const t = at + beat * BEAT;
    if (beat % 2 === 0) {
      // baixo alternando tônica e quinta
      const c = ctx!;
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 600;
      f.connect(session!);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'triangle';
      o.frequency.value = beat === 0 ? freq(root) : fifth;
      envelope(g, t, 0.55, 0.005, 0.4);
      o.connect(g).connect(f);
      o.start(t);
      o.stop(t + 0.5);
    } else {
      // acorde dedilhado rapidinho
      upper.forEach((n, i) => pluck(n, t + i * 0.012, 0.09));
    }
    // trote: ta-ta-TUM
    const hoof = (when: number, peak: number) => tone(session!, 'sine', 380, when, peak, 0.002, 0.04, 250);
    hoof(t, 0.18);
    hoof(t + BEAT * 0.5, 0.1);
    hoof(t + BEAT * 0.75, 0.13);
  }
}

let timer: number | null = null;
let nextLoopAt = 0;
// Cada vez que a música sintetizada começa ganha um volume próprio; ao parar, ele é
// desligado e as notas já agendadas somem junto (sem tocar dobrado ao religar).
let session: GainNode | null = null;

function scheduleLoop(at: number) {
  CHORDS.forEach((chord, i) => bar(chord, at + i * 4 * BEAT));
  let beat = 0;
  for (const [note, beats] of MELODY) {
    if (note !== '-') whistle(note, at + beat * BEAT, beats);
    beat += beats;
  }
}

function startSynth(c: AudioContext) {
  if (timer !== null) return;
  session = c.createGain();
  session.connect(musicBus!);
  nextLoopAt = c.currentTime + 0.2;
  // Agenda uma volta inteira da música por vez, um pouco antes de a anterior acabar.
  const tick = () => {
    if (!ctx) return;
    while (nextLoopAt < ctx.currentTime + 1.5) {
      scheduleLoop(nextLoopAt);
      nextLoopAt += LOOP_BEATS * BEAT;
    }
  };
  tick();
  timer = window.setInterval(tick, 500);
}

function stopSynth() {
  if (timer !== null) clearInterval(timer);
  timer = null;
  if (ctx && session) {
    const old = session;
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    window.setTimeout(() => old.disconnect(), 400);
  }
  session = null;
}

/**
 * Música própria: se existir um arquivo em public/musica/tema.mp3 (ex.: uma música
 * licenciada pela empresa), ele toca em vez da trilha sintetizada.
 */
const THEME_FILE = '/musica/tema.mp3';
// O arquivo é verificado ao abrir o app, para o primeiro toque já poder dar play na hora.
let themeEl: HTMLAudioElement | null = null;
let musicReady = false;

void fetch(THEME_FILE, { method: 'HEAD' })
  // Sem o arquivo, o servidor devolve a página do app: só vale se for mesmo áudio.
  .then((res) => (res.ok && res.headers.get('content-type')?.startsWith('audio') ? THEME_FILE : null))
  .catch(() => null)
  .then((url) => {
    if (url) {
      themeEl = new Audio(url);
      themeEl.loop = true;
      themeEl.volume = 0.2;
      themeEl.preload = 'auto';
    }
    musicReady = true;
  });

function musicPlaying(): boolean {
  return themeEl ? !themeEl.paused : timer !== null;
}

function startMusic() {
  if (!prefs.music || !musicReady) return;
  if (themeEl) {
    // Se o navegador ainda não liberou o som, o próximo toque tenta de novo.
    void themeEl.play().catch(() => undefined);
    return;
  }
  const c = audio();
  if (c?.state === 'running') startSynth(c);
}

function stopMusic() {
  stopSynth();
  themeEl?.pause();
}

// O arquivo de música não passa pelo AudioContext: pausa junto quando a aba some.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) themeEl?.pause();
  else if (themeEl && prefs.music) void themeEl.play().catch(() => undefined);
});

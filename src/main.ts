import * as Tone from "tone"
import TapTempo from "./helpers/tapTempo";
import './style.css';

const range = document.getElementById("myRange") as HTMLInputElement | null;
const display = document.getElementById("rangeDisplay") as HTMLElement | null;

let audioStarted = false;
async function ensureAudioStarted() {
  if (audioStarted) return;
  try {
    await Tone.start();
    audioStarted = true;
  } catch (e) {
    console.warn('Audio start failed:', e);
  }
}

function safeSetBpm(value: number | null) {
  if (typeof value !== 'number' || !isFinite(value)) return;
  const clamped = Math.min(240, Math.max(30, Math.round(value)));
  Tone.getTransport().bpm.value = clamped;
  if (display) display.textContent = String(clamped);
  if (range) range.value = String(clamped);
}

if (display && range) display.textContent = range.value;

if (range) {
  range.addEventListener("input", async () => {
    await ensureAudioStarted();
    const tempo = Number(range.value);
    safeSetBpm(tempo);
  });
}

const tempoUp = document.getElementById("tempoUp") as HTMLButtonElement | null;
const tempoUp5 = document.getElementById("tempoUp5") as HTMLButtonElement | null;
const tempoDown = document.getElementById("tempoDown") as HTMLButtonElement | null;
const tempoDown5 = document.getElementById("tempoDown5") as HTMLButtonElement | null;

if (tempoUp) tempoUp.addEventListener('click', () => { range!.valueAsNumber += 1; safeSetBpm(Number(range!.value)); });
if (tempoUp5) tempoUp5.addEventListener('click', () => { range!.valueAsNumber += 5; safeSetBpm(Number(range!.value)); });
if (tempoDown) tempoDown.addEventListener('click', () => { range!.valueAsNumber -= 1; safeSetBpm(Number(range!.value)); });
if (tempoDown5) tempoDown5.addEventListener('click', () => { range!.valueAsNumber -= 5; safeSetBpm(Number(range!.value)); });

const playBtn = document.getElementById("playButton") as HTMLButtonElement | null;
const stopBtn = document.getElementById("stopButton") as HTMLButtonElement | null;
function getBeatDots() {
  return Array.from(document.querySelectorAll(".beat-dot")) as HTMLElement[];
}

// create three distinct synths for accent, beat, and subdivision
const accentGain = new Tone.Gain(1).toDestination();
const beatGain = new Tone.Gain(0.9).toDestination();
const subGain = new Tone.Gain(0.6).toDestination();

const accentSynth = new Tone.Synth({
  oscillator: { type: 'sine' },
  envelope: { attack: 0, decay: 0.15, sustain: 0, release: 0.1 }
});
const beatSynth = new Tone.Synth({
  oscillator: { type: 'square' },
  envelope: { attack: 0, decay: 0.12, sustain: 0, release: 0.08 }
});
const subSynth = new Tone.Synth({
  oscillator: { type: 'triangle' },
  envelope: { attack: 0, decay: 0.08, sustain: 0, release: 0.05 }
});

accentSynth.connect(accentGain);
beatSynth.connect(beatGain);
subSynth.connect(subGain);

const accent = document.getElementById("accentButton") as HTMLInputElement | null;

function highlightBeat(i: number) {
  const dots = getBeatDots();
  if (!dots.length) return;
  const idx = i % dots.length;
  const el = dots[idx];
  if (!el) return;
  el.classList.add('active');
  if ((accent && accent.checked) && idx === 0) {
    el.classList.add("accent");
  }
  setTimeout(() => el.classList.remove('active', 'accent'), 120);
}

// beat count and subdivisions
let beatCount = 4;
const beatsCountEl = document.getElementById('beatsCount') as HTMLElement | null;

function renderBeatDots() {
  const container = document.querySelector('.beats');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < beatCount; i++) {
    const d = document.createElement('div');
    d.className = 'beat-dot w-6 h-6 rounded-full bg-gray-400';
    container.appendChild(d);
  }
  if (beatsCountEl) beatsCountEl.textContent = String(beatCount);
}

renderBeatDots();

let subdivision: '4n' | '8n' | '8t' | '16n' | 'dotted' = '4n';
let scheduledId: number | null = null;
let subTick = 0;

function rescheduleSubdivision() {
  if (scheduledId !== null) Tone.Transport.clear(scheduledId);
  subTick = 0;
  let interval = subdivision === 'dotted' ? '16n' : subdivision;
  let perBeat = subdivision === '4n' ? 1 : subdivision === '8n' ? 2 : subdivision === '16n' ? 4 : subdivision === '8t' ? 3 : 4;

  scheduledId = Tone.getTransport().scheduleRepeat((time) => {
    const idxInBeat = subTick % perBeat;

    // determine if we should play on this subdivision
    let shouldPlay = true;
    if (subdivision === 'dotted') {
      // pattern: [0,3] within 4 sixteenth subdivisions
      shouldPlay = idxInBeat === 0 || idxInBeat === 3;
    }

    if (shouldPlay) {
      const beatIndex = Math.floor(subTick / perBeat) % beatCount;
      // visual
      if (Tone.getDraw && Tone.getDraw().schedule) {
        Tone.getDraw().schedule(() => highlightBeat(beatIndex), time);
      } else {
        const now = Tone.now();
        const delayMs = Math.max(0, (time - now) * 1000);
        setTimeout(() => requestAnimationFrame(() => highlightBeat(beatIndex)), delayMs);
      }

      // audio: choose synth based on position
      const isDownbeat = idxInBeat === 0;
      const isAccent = isDownbeat && (accent && accent.checked) && (Math.floor(subTick / perBeat) % beatCount === 0);
      if (isAccent) {
        accentSynth.triggerAttackRelease(480, 0.12, time);
      } else if (isDownbeat) {
        beatSynth.triggerAttackRelease(440, 0.1, time);
      } else {
        // subdivision click
        subSynth.triggerAttackRelease(520, 0.06, time);
      }
    }

    subTick++;
  }, interval) as unknown as number;
}

// start with default subdivision
rescheduleSubdivision();

// beat up/down handlers
const beatsUp = document.getElementById('beatsUp');
const beatsDown = document.getElementById('beatsDown');
if (beatsUp) beatsUp.addEventListener('click', () => { beatCount = Math.min(12, beatCount + 1); renderBeatDots(); });
if (beatsDown) beatsDown.addEventListener('click', () => { beatCount = Math.max(1, beatCount - 1); renderBeatDots(); });

// subdivision buttons
const subQuarter = document.getElementById('subQuarter');
const subEighth = document.getElementById('subEighth');
const subTriplet = document.getElementById('subTriplet');
const subSixteenth = document.getElementById('subSixteenth');
const subDotted = document.getElementById('subDotted');

function clearSubActive() {
  [subQuarter, subEighth, subTriplet, subSixteenth, subDotted].forEach(b => b && b.classList.remove('active'));
}

if (subQuarter) subQuarter.addEventListener('click', () => { subdivision = '4n'; clearSubActive(); subQuarter.classList.add('active'); rescheduleSubdivision(); });
if (subEighth) subEighth.addEventListener('click', () => { subdivision = '8n'; clearSubActive(); subEighth.classList.add('active'); rescheduleSubdivision(); });
if (subTriplet) subTriplet.addEventListener('click', () => { subdivision = '8t'; clearSubActive(); subTriplet.classList.add('active'); rescheduleSubdivision(); });
if (subSixteenth) subSixteenth.addEventListener('click', () => { subdivision = '16n'; clearSubActive(); subSixteenth.classList.add('active'); rescheduleSubdivision(); });
if (subDotted) subDotted.addEventListener('click', () => { subdivision = 'dotted'; clearSubActive(); subDotted.classList.add('active'); rescheduleSubdivision(); });

if (playBtn) playBtn.addEventListener('click', async () =>{
  await ensureAudioStarted();
  Tone.getTransport().start();
});

if (stopBtn) stopBtn.addEventListener('click', () => {
  Tone.getTransport().stop();
});

const tapTempoBtn = document.getElementById("tapTempoButton") as HTMLButtonElement | null;
const tapTempo = new TapTempo();

tapTempo.addEventListener('bpm', (ev) => {
  const bpm = (ev as CustomEvent).detail.bpm as number;
  console.log('BPM from taps:', bpm);
});

if (tapTempoBtn) tapTempoBtn.addEventListener('click', async () => {
  await ensureAudioStarted();
  const bpm = tapTempo.tap();
  if (bpm) safeSetBpm(bpm);
});

// make touch interactions also ensure audio started
['tempoUp','tempoUp5','tempoDown','tempoDown5','playButton','tapTempoButton'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('touchstart', () => ensureAudioStarted());
});

// keyboard shortcuts: Space toggles play/stop, T = tap, arrows adjust tempo
window.addEventListener('keydown', async (ev) => {
  if (ev.code === 'Space') {
    ev.preventDefault();
    if (Tone.getTransport().state === 'started') {
      Tone.getTransport().stop();
    } else {
      await ensureAudioStarted();
      Tone.getTransport().start();
    }
  } else if (ev.key.toLowerCase() === 't') {
    ev.preventDefault();
    const bpm = tapTempo.tap();
    if (bpm) safeSetBpm(bpm);
  } else if (ev.code === 'ArrowUp') {
    range!.valueAsNumber += 1; safeSetBpm(Number(range!.value));
  } else if (ev.code === 'ArrowDown') {
    range!.valueAsNumber -= 1; safeSetBpm(Number(range!.value));
  } else if (ev.code === 'ArrowRight') {
    range!.valueAsNumber += 5; safeSetBpm(Number(range!.value));
  } else if (ev.code === 'ArrowLeft') {
    range!.valueAsNumber -= 5; safeSetBpm(Number(range!.value));
  }
});

Tone.getTransport().bpm.value = 100;
Tone.getTransport().timeSignature = 4;
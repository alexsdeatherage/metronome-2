import * as Tone from "tone"
import TapTempo from "./helpers/tapTempo";

const range = document.getElementById("myRange") as HTMLInputElement;
const display = document.getElementById("rangeDisplay") as HTMLInputElement;

display.textContent = range.value;

range.addEventListener("input", () => {
    display.textContent = range.value;    
    let tempo = range.value;
    Tone.getTransport().bpm.value = Number(tempo);
})


const tempoUp = document.getElementById("tempoUp") as HTMLButtonElement;
const tempoUp5 = document.getElementById("tempoUp5") as HTMLButtonElement;
const tempoDown = document.getElementById("tempoDown") as HTMLButtonElement;
const tempoDown5 = document.getElementById("tempoDown5") as HTMLButtonElement;

tempoUp.addEventListener('click', () => {
    range.valueAsNumber += 1
    display.textContent = range.value;    
    let tempo = range.value;
    Tone.getTransport().bpm.value = Number(tempo);
});

tempoUp5.addEventListener('click', () => {
    range.valueAsNumber += 5
    display.textContent = range.value;    
    let tempo = range.value;
    Tone.getTransport().bpm.value = Number(tempo);
});

tempoDown.addEventListener('click', () => {
    range.valueAsNumber -= 1
    display.textContent = range.value;
    let tempo = range.value;
    Tone.getTransport().bpm.value = Number(tempo);
});

tempoDown5.addEventListener('click', () => {
    range.valueAsNumber -= 5
    display.textContent = range.value;
    let tempo = range.value;
    Tone.getTransport().bpm.value = Number(tempo);
});


const playBtn = document.getElementById("playButton") as HTMLButtonElement;
const stopBtn = document.getElementById("stopButton") as HTMLButtonElement;

let gain = new Tone.Gain().toDestination();
let metroSynth = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0, decay: 0.5, sustain: 0, release: 0.1 }
});
gain.gain.value = 0.9;
metroSynth.chain(gain);

let beat = 0
let accent = document.getElementById("accentButton") as HTMLInputElement;
Tone.getTransport().scheduleRepeat((time) => {
  console.log("tick");
  if ((beat % 4 === 0) && (accent.checked == true)) {
    metroSynth.triggerAttackRelease(480, 0.1, time);
  } else {
    metroSynth.triggerAttackRelease(440, 0.1, time);
  }
  beat++;
}, "4n");


playBtn.addEventListener('click', () =>{
    Tone.start();
    Tone.getTransport().start();
});

stopBtn.addEventListener('click', () => {
    Tone.getTransport().stop();
    beat = 0
})

const tapTempoBtn = document.getElementById("tapTempoButton") as HTMLButtonElement;
const tapTempo = new TapTempo();

tapTempo.addEventListener('bpm', (ev) => {
  const bpm = (ev as CustomEvent).detail.bpm as number;
  console.log('BPM from taps:', bpm);
})

tapTempoBtn.addEventListener('click', () => {
  const bpm = tapTempo.tap();
  Tone.getTransport().bpm.value = Number(bpm);
  display.textContent = String(bpm)
  range.value = String(bpm)

})



Tone.getTransport().bpm.value = 100;
Tone.getTransport().timeSignature = 4;
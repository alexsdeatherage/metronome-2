import * as Tone from "tone"

const range = document.getElementById("myRange") as HTMLInputElement;
const display = document.getElementById("rangeDisplay") as HTMLInputElement;

display.textContent = range.value;

range.addEventListener("input", () => {
    display.textContent = range.value;    
    let tempo = range.value;
    Tone.Transport.bpm.value = Number(tempo);
})


const tempoUp = document.getElementById("tempoUp") as HTMLButtonElement;
const tempoDown = document.getElementById("tempoDown") as HTMLButtonElement;

tempoUp.addEventListener('click', () => {
    range.valueAsNumber += 1
    display.textContent = range.value;    
    let tempo = range.value;
    Tone.Transport.bpm.value = Number(tempo);
});

tempoDown.addEventListener('click', () => {
    range.valueAsNumber -= 1
    display.textContent = range.value;
    let tempo = range.value;
    Tone.Transport.bpm.value = Number(tempo);
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

Tone.Transport.scheduleRepeat((time) => {
  console.log("tick");
  metroSynth.triggerAttackRelease(440, 0.1, time);
}, "4n");


playBtn.addEventListener('click', () =>{
    Tone.start();
    Tone.Transport.start();
});

stopBtn.addEventListener('click', () => {
    Tone.Transport.stop();
})



Tone.Transport.bpm.value = 100;

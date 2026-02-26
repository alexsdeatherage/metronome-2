export default class tapTempo extends EventTarget {

private taps: number[] = [];
private maxTaps = 8;
private resetAfterMs = 2000;

tap(): number | null {
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    if (this.taps.length && (now - this.taps[this.taps.length - 1] > this.resetAfterMs)) {
        this.taps = [];
    }
    this.taps.push(now);
    if (this.taps.length > this.maxTaps) this.taps.shift();

    let bpm = this.calculateBpm();
    if (bpm !== null) {
        if (bpm > 240) {
            bpm = 240
        }
        this.dispatchEvent(new CustomEvent('bpm', { detail: { bpm } }));
    }

    return bpm;
}

private calculateBpm(): number | null {
    if (this.taps.length < 2) return null;
    let sum = 0;
    for (let i = 1; i < this.taps.length; i++) sum += (this.taps[i] - this.taps[i - 1]);
    const avgMs = sum / (this.taps.length - 1);
    return Math.round(60000 / avgMs);
}

getBpm(): number | null { return this.calculateBpm(); }

    

}
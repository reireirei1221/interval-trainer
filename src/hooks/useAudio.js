import { useRef } from "react";

// === ユーティリティ ===
const SEMITONE = Math.pow(2, 1 / 12);
const toFreq = (rootHz, semitones) => rootHz * Math.pow(SEMITONE, semitones);

export function useAudio() {
    const ctxRef = useRef(null);

    function ensure() {
        if (!ctxRef.current) {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;
            ctxRef.current = new AudioContextClass();
        }
        if (ctxRef.current.state === "suspended") {
            ctxRef.current.resume();
        }
        return ctxRef.current;
    }

    function playOne(ctx, freq, startTime, duration) {
        const g = ctx.createGain();
        g.connect(ctx.destination);

        const o1 = ctx.createOscillator();
        o1.type = "triangle";
        o1.frequency.value = freq;

        const o2 = ctx.createOscillator();
        o2.type = "sine";
        o2.frequency.value = freq * 2;

        o1.connect(g);
        o2.connect(g);

        g.gain.setValueAtTime(0, startTime);
        g.gain.linearRampToValueAtTime(0.25, startTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        o1.start(startTime);
        o2.start(startTime);

        o1.stop(startTime + duration + 0.05);
        o2.stop(startTime + duration + 0.05);
    }

    // === API ===

    function playDyad(rootHz, semitones, { duration = 2.4 } = {}) {
        const ctx = ensure();
        const now = ctx.currentTime + 0.01;

        playOne(ctx, rootHz, now, duration);
        playOne(ctx, toFreq(rootHz, semitones), now, duration);
    }

    function playMelodic(rootHz, semitones, { duration = 1.4, gap = 0.3 } = {}) {
        const ctx = ensure();
        const now = ctx.currentTime + 0.01;

        playOne(ctx, rootHz, now, duration);
        playOne(ctx, toFreq(rootHz, semitones), now + gap, duration);
    }

    function playChord(rootHz, semitoneArray, { duration = 2.4 } = {}) {
        const ctx = ensure();
        const now = ctx.currentTime + 0.01;

        semitoneArray.forEach((semi) => {
            playOne(ctx, toFreq(rootHz, semi), now, duration);
        });
    }

    function playSuccess() {
        const ctx = ensure();
        const now = ctx.currentTime;

        const freqs = [523.25, 659.25, 783.99];

        freqs.forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();

            o.type = "sine";
            o.frequency.value = freq;

            o.connect(g);
            g.connect(ctx.destination);

            const t = now + i * 0.08;

            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.3, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

            o.start(t);
            o.stop(t + 0.45);
        });
    }

    function playError() {
        const ctx = ensure();
        const now = ctx.currentTime;

        const o = ctx.createOscillator();
        const g = ctx.createGain();

        o.type = "sawtooth";
        o.frequency.value = 220;

        o.connect(g);
        g.connect(ctx.destination);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.3, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        o.start(now);
        o.stop(now + 0.5);
    }

    return {
        playDyad,
        playMelodic,
        playChord,
        playSuccess,
        playError,
        ensure,
    };
}

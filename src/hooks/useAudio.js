import { useRef } from "react";

export function useAudio() {
    const ctxRef = useRef(null);

    const resonanceRef = useRef({
        voices: [],
        masterGain: null,
    });

    // =========================
    // 初期化
    // =========================
    function ensure() {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function getCtx() {
        ensure();
        return ctxRef.current;
    }

    // =========================
    // 🔥 倍音リッチ音源
    // =========================
    function createVoice(ctx, freq, destination) {
        const partials = [
            { ratio: 1, gain: 1.0, type: "triangle" },
            { ratio: 2, gain: 0.5, type: "sine" },
            { ratio: 3, gain: 0.3, type: "sine" },
            { ratio: 4, gain: 0.2, type: "sine" },
            { ratio: 5, gain: 0.1, type: "sine" },
            { ratio: 6, gain: 0.05, type: "sine" },
            { ratio: 7, gain: 0.01, type: "sine" }
        ];

        const nodes = [];

        partials.forEach(p => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();

            osc.type = p.type;
            osc.frequency.value = freq * p.ratio;

            // 🔥 微デチューン（共鳴強化）
            osc.detune.value = (Math.random() - 0.5) * 6;

            g.gain.value = p.gain;

            osc.connect(g).connect(destination);

            nodes.push({ osc, gain: g });
        });

        return nodes;
    }

    // =========================
    // 🔥 エンベロープ
    // =========================
    function applyEnvelope(gain, now, duration = 2, sustain = false) {
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.01);

        if (sustain) {
            gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
        } else {
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        }
    }

    // =========================
    // 再生ユーティリティ
    // =========================
    function startVoices(voices, time) {
        voices.forEach(v => v.osc.start(time));
    }

    function stopVoices(voices, time) {
        voices.forEach(v => {
            try {
                v.osc.stop(time);
            } catch (e) { }
        });
    }

    // =========================
    // ワンショット
    // =========================
    function playOsc(freq, duration = 2) {
        stopResonance();

        const ctx = getCtx();
        const now = ctx.currentTime;

        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        applyEnvelope(gain, now, duration, false);

        const voices = createVoice(ctx, freq, gain);

        startVoices(voices, now);
        stopVoices(voices, now + duration + 0.05);
    }

    // =========================
    // 同時インターバル
    // =========================
    function playDyad(rootHz, semitones) {
        stopResonance();

        const ratio = Math.pow(2, semitones / 12);

        playOsc(rootHz, 2);
        playOsc(rootHz * ratio, 2);
    }

    // =========================
    // 順次インターバル
    // =========================
    function playMelodic(rootHz, semitones) {
        stopResonance();

        const ctx = getCtx();
        const now = ctx.currentTime;

        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        applyEnvelope(gain, now, 5, false);

        const v1 = createVoice(ctx, rootHz, gain);
        const v2 = createVoice(ctx, rootHz * Math.pow(2, semitones / 12), gain);

        startVoices(v1, now);
        startVoices(v2, now + 0.3);

        const stop = now + 5.05;

        stopVoices(v1, stop);
        stopVoices(v2, stop);
    }

    // =========================
    // 和音
    // =========================
    function playChord(rootHz, semitonesArray) {
        stopResonance();

        semitonesArray.forEach(semi => {
            playOsc(rootHz * Math.pow(2, semi / 12), 2);
        });
    }

    // =========================
    // 🔥 共鳴（強化版）
    // =========================
    function startResonance(rootHz, semitones, ratio, cents) {
        stopResonance();

        const ctx = getCtx();
        const now = ctx.currentTime;

        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);

        applyEnvelope(masterGain, now, 0, true);

        const v1 = createVoice(ctx, rootHz, masterGain);
        const v2 = createVoice(ctx, rootHz * ratio, masterGain);

        startVoices(v1, now);
        startVoices(v2, now);

        resonanceRef.current = {
            voices: [v1, v2],
            masterGain,
        };
    }

    // =========================
    // デチューン更新
    // =========================
    function updateDetune(cents) {
        const ctx = getCtx();
        const { voices } = resonanceRef.current;

        if (!voices.length) return;

        const upper = voices[1];

        upper.forEach(v => {
            v.osc.detune.cancelScheduledValues(ctx.currentTime);
            v.osc.detune.linearRampToValueAtTime(cents, ctx.currentTime + 0.05);
        });
    }

    // =========================
    // 停止
    // =========================
    function stopResonance() {
        const ctx = getCtx();
        const { voices, masterGain } = resonanceRef.current;

        if (masterGain) {
            masterGain.gain.cancelScheduledValues(ctx.currentTime);
            masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
        }

        setTimeout(() => {
            voices.flat().forEach(v => {
                try {
                    v.osc.stop();
                } catch (e) { }
            });
        }, 60);

        resonanceRef.current = {
            voices: [],
            masterGain: null,
        };
    }

    function playDetunedInterval(rootHz, semitones, ratio, cents) {
        if (!resonanceRef.current.voices.length) {
            startResonance(rootHz, semitones, ratio, cents);
        }
        updateDetune(cents);
    }

    // =========================
    // 効果音
    // =========================
    function playSuccess() {
        const ctx = getCtx();
        const now = ctx.currentTime;

        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        applyEnvelope(gain, now, 0.6, false);

        [523.25, 659.25, 783.99].forEach((f, i) => {
            const v = createVoice(ctx, f, gain);
            startVoices(v, now + i * 0.08);
            stopVoices(v, now + 0.7);
        });
    }

    function playError() {
        const ctx = getCtx();
        const now = ctx.currentTime;

        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        applyEnvelope(gain, now, 0.5, false);

        const v = createVoice(ctx, 400, gain);

        v.forEach(node => {
            node.osc.frequency.setValueAtTime(400, now);
            node.osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);
        });

        startVoices(v, now);
        stopVoices(v, now + 0.5);
    }

    return {
        ensure,
        playDyad,
        playMelodic,
        playChord,
        playDetunedInterval,
        updateDetune,
        stopResonance,
        playSuccess,
        playError,
    };
}
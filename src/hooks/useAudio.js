import { useRef } from "react";

export function useAudio() {
    const ctxRef = useRef(null);

    // 共鳴用（持続音）
    const resonanceRef = useRef({
        osc1: null,
        osc2: null,
        gain: null,
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
    // 共通：ワンショット音
    // =========================
    function playOsc(freq, duration) {
        const ctx = getCtx();

        const startTime = ctx.currentTime;

        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        // ===== メイン音 =====
        const osc1 = ctx.createOscillator();
        osc1.type = "triangle";
        osc1.frequency.value = freq;

        // ===== 倍音（1つだけ）=====
        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.value = freq * 2;

        osc1.connect(gain);
        osc2.connect(gain);

        // ===== ゲイン（同じカーブ）=====
        gain.gain.setValueAtTime(0, startTime);

        // アタック
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.01);

        // 減衰
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        // スタート
        osc1.start(startTime);
        osc2.start(startTime);

        // 少し余韻を残して停止
        osc1.stop(startTime + duration + 0.05);
        osc2.stop(startTime + duration + 0.05);
    }



    // =========================
    // インターバル（同時）
    // =========================
    function playDyad(rootHz, semitones) {
        stopResonance();

        playOsc(rootHz, 2);
        playOsc(rootHz * Math.pow(2, semitones / 12), 2);
    }

    // =========================
    // インターバル（順次）
    // =========================
    function playMelodic(rootHz, semitones) {
        stopResonance();

        const ctx = getCtx();

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = rootHz;
        osc2.frequency.value = rootHz * Math.pow(2, semitones / 12);

        gain.gain.value = 0.2;

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc1.stop(ctx.currentTime + 0.6);

        osc2.start(ctx.currentTime + 0.7);
        osc2.stop(ctx.currentTime + 1.3);
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
    // 🔥 共鳴（ここがメイン）
    // =========================

    function startResonance(rootHz, semitones, cents) {
        stopResonance();

        const ctx = getCtx();
        const now = ctx.currentTime;

        const gain = ctx.createGain();

        // ===== ルート =====
        const osc1 = ctx.createOscillator();
        const osc1Harm = ctx.createOscillator();

        osc1.type = "triangle";
        osc1.frequency.value = rootHz;

        osc1Harm.type = "sine";
        osc1Harm.frequency.value = rootHz * 2;

        // ===== 上の音 =====
        const osc2 = ctx.createOscillator();
        const osc2Harm = ctx.createOscillator();

        osc2.type = "triangle";
        osc2.frequency.value =
            rootHz * Math.pow(2, semitones / 12) * Math.pow(2, cents / 1200);

        osc2Harm.type = "sine";
        osc2Harm.frequency.value = osc2.frequency.value * 2;

        // 接続
        osc1.connect(gain);
        osc1Harm.connect(gain);
        osc2.connect(gain);
        osc2Harm.connect(gain);

        gain.connect(ctx.destination);

        // 🔥 軽いアタック（これ超大事）
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.02);

        // start
        osc1.start();
        osc1Harm.start();
        osc2.start();
        osc2Harm.start();

        resonanceRef.current = {
            osc1,
            osc2,
            gain,
            osc1Harm,
            osc2Harm,
        };
    }


    function updateDetune(cents) {
        const ctx = getCtx();
        const { osc2 } = resonanceRef.current;

        if (!osc2) return;

        // 🔥 なめらか変化
        osc2.detune.cancelScheduledValues(ctx.currentTime);
        osc2.detune.linearRampToValueAtTime(
            cents,
            ctx.currentTime + 0.05
        );
    }

    function stopResonance() {
        const { osc1, osc2, osc1Harm, osc2Harm } = resonanceRef.current;

        if (osc1) osc1.stop();
        if (osc2) osc2.stop();
        if (osc1Harm) osc1Harm.stop();
        if (osc2Harm) osc2Harm.stop();

        resonanceRef.current = {
            osc1: null,
            osc2: null,
            gain: null,
            osc1Harm: null,
            osc2Harm: null,
        };
    }

    // =========================
    // 旧API互換（重要）
    // =========================
    function playDetunedInterval(rootHz, semitones, cents) {
        // 初回だけ start
        if (!resonanceRef.current.osc1) {
            startResonance(rootHz, semitones, cents);
        }

        updateDetune(cents);
    }

    // =========================
    // 効果音
    // =========================
    function playSuccess() {
        playOsc(880, 0.2);
    }

    function playError() {
        playOsc(220, 0.3);
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

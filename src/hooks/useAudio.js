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
    function playOsc(freq, duration=2) {
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
        const now = ctx.currentTime;

        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        // ===== 周波数 =====
        const freq1 = rootHz;
        const freq2 = rootHz * Math.pow(2, semitones / 12);

        // ===== 1音目 =====
        const osc1 = ctx.createOscillator();
        const osc1Harm = ctx.createOscillator();

        osc1.type = "triangle";
        osc1.frequency.value = freq1;

        osc1Harm.type = "sine";
        osc1Harm.frequency.value = freq1 * 2;

        // ===== 2音目 =====
        const osc2 = ctx.createOscillator();
        const osc2Harm = ctx.createOscillator();

        osc2.type = "triangle";
        osc2.frequency.value = freq2;

        osc2Harm.type = "sine";
        osc2Harm.frequency.value = freq2 * 2;

        // 接続
        osc1.connect(gain);
        osc1Harm.connect(gain);
        osc2.connect(gain);
        osc2Harm.connect(gain);

        // ===== エンベロープ（playOscと同じ）=====
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.01);

        const stopTime = now + 5;
        gain.gain.exponentialRampToValueAtTime(0.001, stopTime);

        // ===== 再生タイミング =====
        osc1.start(now);
        osc1Harm.start(now);

        osc2.start(now + 0.3);
        osc2Harm.start(now + 0.3);

        // 🔥 同時停止
        osc1.stop(stopTime + 0.05);
        osc1Harm.stop(stopTime + 0.05);
        osc2.stop(stopTime + 0.05);
        osc2Harm.stop(stopTime + 0.05);
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

    function startResonance(rootHz, semitones, ratio, cents) {
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
        // osc2.frequency.value =
        //     rootHz * Math.pow(2, semitones / 12) * Math.pow(2, cents / 1200);
        
        // 純正律での周波数を計算
        osc2.frequency.value = rootHz * ratio * Math.pow(2, cents / 1200);


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
    function playDetunedInterval(rootHz, semitones, ratio, cents) {
        // 初回だけ start
        if (!resonanceRef.current.osc1) {
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

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        // ドレミ（上昇アルペジオ）
        const freqs = [523.25, 659.25, 783.99]; // C E G

        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, now + i * 0.08);

            osc.connect(gain);
            osc.start(now + i * 0.08);
            osc.stop(now + 0.7);
        });

        // キラキラ倍音
        const sparkle = ctx.createOscillator();
        sparkle.type = "sine";
        sparkle.frequency.setValueAtTime(1200, now);
        sparkle.frequency.exponentialRampToValueAtTime(2000, now + 0.3);

        sparkle.connect(gain);
        sparkle.start(now);
        sparkle.stop(now + 0.5);
    }


    function playError() {
        const ctx = getCtx();
        const now = ctx.currentTime;

        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        // 下降音
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";

        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);

        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.5);

        // 軽いノイズで「ザッ」
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.1, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        noise.connect(noiseGain).connect(ctx.destination);
        noise.start(now);
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

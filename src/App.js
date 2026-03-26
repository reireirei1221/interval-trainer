import React, { useEffect, useMemo, useRef, useState } from "react";

// === ユーティリティ: 音関係 ===
const SEMITONE = Math.pow(2, 1 / 12);
const toFreq = (rootHz, semitones) => rootHz * Math.pow(SEMITONE, semitones);

// 200Hz〜800Hzの範囲でルート音をランダム生成し、上の音も人間に聴きやすい帯域に収まるように調整
function randomRootHz(maxSemitoneUp = 12) {
    const minHz = 200;
    const maxHz = 800;
    // 上の音が800Hzを超えないように少し余裕をみる
    const upperLimit = maxHz / Math.pow(SEMITONE, maxSemitoneUp);
    const hz = Math.random() * (upperLimit - minHz) + minHz;
    return hz;
}

// WebAudio をラップ
class Synth {
    constructor() {
        this.ctx = null;
    }
    ensure() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
        }
        if (this.ctx.state === "suspended") this.ctx.resume();
        return this.ctx;
    }
    // 同時に2音（ダイアド）を再生
    playDyad(rootHz, semitones, opts = {}) {
        const ctx = this.ensure();
        const {
            duration = 2.4,
        } = opts;

        const now = ctx.currentTime + 0.01;

        const playOne = (freq, startTime, duration) => {
            const g = ctx.createGain();
            g.connect(ctx.destination);

            // 🎹 基音
            const o1 = ctx.createOscillator();
            o1.type = "triangle";
            o1.frequency.value = freq;

            // 🎹 倍音（軽く）
            const o2 = ctx.createOscillator();
            o2.type = "sine";
            o2.frequency.value = freq * 2;

            o1.connect(g);
            o2.connect(g);

            // 🎯 ピアノ風エンベロープ
            g.gain.setValueAtTime(0, startTime);
            g.gain.linearRampToValueAtTime(0.25, startTime + 0.01); // 速いアタック
            g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            o1.start(startTime);
            o2.start(startTime);

            o1.stop(startTime + duration + 0.05);
            o2.stop(startTime + duration + 0.05);
        };

        playOne(rootHz, now, duration);
        playOne(toFreq(rootHz, semitones), now, duration);
    }


    playMelodic(rootHz, semitones, opts = {}) {
        const ctx = this.ensure();
        const {
            duration = 1.4,
            gap = 0.3,
        } = opts;

        const now = ctx.currentTime + 0.01;

        const endTime = now + duration + gap + duration;

        const playOne = (freq, startTime) => {
            const noteDuration = endTime - startTime;

            const g = ctx.createGain();
            g.connect(ctx.destination);

            // 🎹 基音
            const o1 = ctx.createOscillator();
            o1.type = "triangle";
            o1.frequency.value = freq;

            // 🎹 倍音
            const o2 = ctx.createOscillator();
            o2.type = "sine";
            o2.frequency.value = freq * 2;

            // 🎯 微妙なズレ（リアル感）
            o1.detune.value = (Math.random() - 0.5) * 6;
            o2.detune.value = (Math.random() - 0.5) * 6;

            o1.connect(g);
            o2.connect(g);

            // 🎯 ピアノエンベロープ
            g.gain.setValueAtTime(0, startTime);
            g.gain.linearRampToValueAtTime(0.25, startTime + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

            o1.start(startTime);
            o2.start(startTime);

            o1.stop(startTime + noteDuration + 0.05);
            o2.stop(startTime + noteDuration + 0.05);
        };

        playOne(rootHz, now);
        playOne(toFreq(rootHz, semitones), now + gap);
    }

    playChord(rootHz, semitoneArray, opts = {}) {
        const ctx = this.ensure();
        const { duration = 2.4 } = opts;

        const now = ctx.currentTime + 0.01;

        semitoneArray.forEach(semi => {
            const freq = toFreq(rootHz, semi);

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

            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.2, now + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, now + duration);

            o1.start(now);
            o2.start(now);

            o1.stop(now + duration + 0.05);
            o2.stop(now + duration + 0.05);
        });
    }


}

const synth = new Synth();

const MODE = {
    INTERVAL: "INTERVAL", // 2音
    CHORD: "CHORD", // 3音
}

// === インターバル定義 ===
// 日本語ラベルと半音数
const INTERVALS = [
//    { id: "P1", label: "ユニゾン(完全1度)", semitones: 0 },
    { id: "m2", label: "短2度", semitones: 1 },
    { id: "M2", label: "長2度", semitones: 2 },
    { id: "m3", label: "短3度", semitones: 3 },
    { id: "M3", label: "長3度", semitones: 4 },
    { id: "P4", label: "完全4度", semitones: 5 },
    { id: "TT", label: "増4度 (減5度)", semitones: 6 },
    { id: "P5", label: "完全5度", semitones: 7 },
    { id: "m6", label: "短6度", semitones: 8 },
    { id: "M6", label: "長6度", semitones: 9 },
    { id: "m7", label: "短7度", semitones: 10 },
    { id: "M7", label: "長7度", semitones: 11 },
    { id: "P8", label: "オクターブ(完全8度)", semitones: 12 },
];

// === 和音定義 ===
// 長3和音、短3和音、減3和音、増3和音
const CHORDS = [
    { id: "M3", label: "長3和音", semitones: [0, 4, 7] },
    { id: "m3", label: "短3和音", semitones: [0, 3, 7] },
    { id: "dim", label: "減3和音", semitones: [0, 3, 6] },
    { id: "aug", label: "増3和音", semitones: [0, 4, 8] },
];

// 問題データ型
function makeQuestion(allowedIntervals) {
    // 許可されたインターバルの配列から、ランダムに一つ選択
    const pick = allowedIntervals[Math.floor(Math.random() * allowedIntervals.length)];

    const maxSemi = Math.max(...allowedIntervals.map((i) => i.semitones));
    const root = randomRootHz(maxSemi);
    return {
        rootHz: root,
        intervalId: pick.id,
        label: pick.label,
        semitones: pick.semitones,
        choices: allowedIntervals.map((i) => ({ id: i.id, label: i.label })),
    };
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function makeChordQuestion(allowedChords) {
    const pick = allowedChords[Math.floor(Math.random() * allowedChords.length)];

    const root = randomRootHz(12);

    return {
        rootHz: root,
        chordId: pick.id,
        label: pick.label,
        semitones: pick.semitones,
        choices: allowedChords.map(c => ({ id: c.id, label: c.label })),
    };
}


// 進行段階
const STAGE = {
    SETUP: "SETUP",
    QUIZ: "QUIZ",
    REVIEW_INTRO: "REVIEW_INTRO",
    REVIEW: "REVIEW",
    COMPLETE: "COMPLETE",
};

export default function IntervalTrainer() {
    // 進行段階の初期値をSETUPに設定
    const [stage, setStage] = useState(STAGE.SETUP);
    // 出題する (許可される) インターバルのidの初期値を設定
    const [selectedIds, setSelectedIds] = useState(["M3", "m3"]);
    // 出題数の初期値を設定
    const [total, setTotal] = useState(10);
    // 再生モード (同時 or ずらし)
    const [playMode, setPlayMode] = useState("harmonic");

    // 許可されたインターバルのidを持つ、インターバルの配列をメモ化
    const allowed = useMemo(
        () => INTERVALS.filter((i) => selectedIds.includes(i.id)),
        [selectedIds]
    );

    const allowedChords = useMemo(
        () => CHORDS.filter((c) => selectedIds.includes(c.id)),
        [selectedIds]
    );

    const [mode, setMode] = useState(null); // null → 選択画面

    // クイズ用ステート

    // 問題を格納する配列
    const [questions, setQuestions] = useState([]); // {rootHz, intervalId, label, semitones, choices[]}
    // 現在、questionsの中で、何番目の問題かを表すIndex
    const [index, setIndex] = useState(0);
    // 選択された回答を格納する変数
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    // 選択された回答が正しいかを格納する変数
    const [isCorrect, setIsCorrect] = useState(null); // true/false/null
    // 間違った問題のIndexを格納する配列
    const [wrongIndices, setWrongIndices] = useState([]);
    // その問題を一度でもミスしたかを格納する変数
    const [hadWrong, setHadWrong] = useState(false);
    // 各インターバルごとの出題数、誤答数を格納するオブジェクト
    const [stats, setStats] = useState({}); // { [intervalId]: { total: number, wrong: number } }

    // レビュー用

    // 復習用の問題が、questionsの何番目かを表すIndexの配列
    const [reviewQueue, setReviewQueue] = useState([]); // インデックス配列
    // 復習用の問題で、何番目かを表すIndex
    const [reviewIndex, setReviewIndex] = useState(0); // reviewQueue内での位置

    // 再生の自動化
    const currentQuestion = useMemo(() => {
        if (stage === STAGE.QUIZ) return questions[index];
        if (stage === STAGE.REVIEW) return questions[reviewQueue[reviewIndex]];
        return null;
    }, [stage, index, reviewIndex, reviewQueue, questions]);

    // 質問切替時の自動再生
    useEffect(() => {
        if (!currentQuestion) return;
        // 初回はstartボタンでユーザ操作済みのため再生可能
        playCurrent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestion]);

    // 現在の問題の音源を再生する
    function playCurrent() {
        if (!currentQuestion) return;

        if (mode === MODE.INTERVAL) {
            if (playMode === "harmonic") {
                synth.playDyad(currentQuestion.rootHz, currentQuestion.semitones);
            } else {
                synth.playMelodic(currentQuestion.rootHz, currentQuestion.semitones);
            }
        }

        if (mode === MODE.CHORD) {
            synth.playChord(currentQuestion.rootHz, currentQuestion.semitones);
        }
    }


    function handleToggleInterval(id) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    // スタートボタンが押されたとき、問題を生成してクイズを開始する関数
    function handleStart() {
        if (total < 1) return;
        synth.ensure();

        if (mode === MODE.INTERVAL) {
            if (allowed.length < 2) return;

            const baseCount = Math.floor(total / allowed.length);
            const remainder = total % allowed.length;

            let pool = [];

            allowed.forEach((it) => {
                for (let i = 0; i < baseCount; i++) {
                    pool.push(it);
                }
            });

            const shuffled = shuffle(allowed);
            for (let i = 0; i < remainder; i++) {
                pool.push(shuffled[i]);
            }

            pool = shuffle(pool);

            const qs = pool.map((it) => ({
                rootHz: randomRootHz(12),
                intervalId: it.id,
                label: it.label,
                semitones: it.semitones, // ← number
                choices: allowed.map((i) => ({ id: i.id, label: i.label })),
            }));

            setQuestions(qs);
        }

        if (mode === MODE.CHORD) {
            const allowedChords = CHORDS.filter(c => selectedIds.includes(c.id));
            if (allowedChords.length < 2) return;

            const baseCount = Math.floor(total / allowedChords.length);
            const remainder = total % allowedChords.length;

            let pool = [];

            // 均等に配る
            allowedChords.forEach((chord) => {
                for (let i = 0; i < baseCount; i++) {
                    pool.push(chord);
                }
            });

            // 余りをランダムで追加
            const shuffled = shuffle(allowedChords);
            for (let i = 0; i < remainder; i++) {
                pool.push(shuffled[i]);
            }

            // 最後に全体シャッフル
            pool = shuffle(pool);

            const qs = pool.map((chord) => ({
                rootHz: randomRootHz(12),
                chordId: chord.id,
                label: chord.label,
                semitones: chord.semitones,
                choices: allowedChords.map(c => ({ id: c.id, label: c.label })),
            }));

            setQuestions(qs);
        }


        setIndex(0);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setWrongIndices([]);
        setStage(STAGE.QUIZ);

        // ★ stats初期化
        const initialStats = {};

        if (mode === MODE.INTERVAL) {
            allowed.forEach(i => {
                initialStats[i.id] = { total: 0, wrong: 0 };
            });
        }

        if (mode === MODE.CHORD) {
            const allowedChords = CHORDS.filter(c => selectedIds.includes(c.id));
            allowedChords.forEach(c => {
                initialStats[c.id] = { total: 0, wrong: 0 };
            });
        }

        setStats(initialStats);
    }


    function handleSelectChoice(id) {
        if (!currentQuestion) return;
        setSelectedAnswer(id);
        const correctId = mode === MODE.INTERVAL
            ? currentQuestion.intervalId
            : currentQuestion.chordId;

        const ok = id === correctId;
        setIsCorrect(ok);

        if (!ok) {
            setHadWrong(true); // 一度でも間違えたら記録
        }
    }

    // 次へボタンが押されたとき、クイズの進行やレビューの進行を制御する関数
    function handleNext() {
        if (stage === STAGE.QUIZ) {

            const q = questions[index];

            // ★ totalを毎回カウント
            setStats((prev) => ({
                ...prev,
                [q.intervalId ?? q.chordId]: {
                    ...prev[q.intervalId ?? q.chordId],
                    total: prev[q.intervalId ?? q.chordId].total + 1,
                },
            }));

            // // wasWrongは、isCorrectの反転
            // const wasWrong = isCorrect === false;
            // もし間違っていたら、wrongIndicesに現在のindexを追加
            if (hadWrong) {
                setWrongIndices((w) => [...w, index]);

                // ★追加：intervalごとにwrongを+1
                const q = questions[index];
                setStats((prev) => ({
                    ...prev,
                    [q.intervalId]: {
                        ...prev[q.intervalId],
                        wrong: prev[q.intervalId].wrong + 1,
                    },
                }));
            }

            if (index + 1 < questions.length) {
                setIndex((i) => i + 1);
                setSelectedAnswer(null);
                setIsCorrect(null);
                setHadWrong(null);
            } else {
                setStage(STAGE.REVIEW_INTRO);
            }
        } else if (stage === STAGE.REVIEW_INTRO) {

            if (wrongIndices.length === 0) {
                // 正解率100% → 初期画面へ
                setStage(STAGE.SETUP);
                setQuestions([]);
                setIndex(0);
                setWrongIndices([]);
                setReviewQueue([]);
                setReviewIndex(0);
                setSelectedAnswer(null);
                setIsCorrect(null);
                setHadWrong(null);
                return;
            }

            // 重複を排除して復習する問題のIndex配列を作成
            const queue = [...new Set(wrongIndices)];
            setReviewQueue(queue);
            setReviewIndex(0);
            setSelectedAnswer(null);
            setIsCorrect(null);
            setHadWrong(null);
            setStage(STAGE.REVIEW);
        } else if (stage === STAGE.REVIEW) {
            // レビューは一巡したら完了
            if (reviewIndex + 1 < reviewQueue.length) {
                setReviewIndex((i) => i + 1);
                setSelectedAnswer(null);
                setIsCorrect(null);
                setHadWrong(null);
            } else {
                setStage(STAGE.COMPLETE);
            }
        } else if (stage === STAGE.COMPLETE) {
            // 初期画面へ
            setStage(STAGE.SETUP);
            setQuestions([]);
            setIndex(0);
            setWrongIndices([]);
            setReviewQueue([]);
            setReviewIndex(0);
            setSelectedAnswer(null);
            setIsCorrect(null);
            setHadWrong(null);
        }
    }

    function handleReset() {
        if (!window.confirm("本当に初期画面に戻りますか？")) return;

        setStage(STAGE.SETUP);
        setQuestions([]);
        setIndex(0);
        setWrongIndices([]);
        setReviewQueue([]);
        setReviewIndex(0);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setHadWrong(null);
    }

    // Enterキーで次へ
    useEffect(() => {
        function onKey(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                // 選択肢未選択のときは無効（クイズ/レビュー時）
                if ((stage === STAGE.QUIZ || stage === STAGE.REVIEW) && selectedAnswer == null) return;
                handleNext();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [stage, selectedAnswer, isCorrect, index, reviewIndex, wrongIndices]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <Header onReset={handleReset} stage={stage} />
                {stage === STAGE.SETUP && mode == null && (
                    <ModeSelect onSelect={setMode} />
                )}
                {stage === STAGE.SETUP && mode === MODE.INTERVAL && (
                    <Setup
                        selectedIds={selectedIds}
                        onToggle={handleToggleInterval}
                        total={total}
                        setTotal={setTotal}
                        onStart={handleStart}
                        playMode={playMode}
                        setPlayMode={setPlayMode}
                    />
                )}
                {stage === STAGE.SETUP && mode === MODE.CHORD && (
                    <ChordSetup
                        selectedIds={selectedIds}
                        onToggle={handleToggleInterval}
                        total={total}
                        setTotal={setTotal}
                        onStart={handleStart}
                    />
                )}
                {stage === STAGE.QUIZ && (
                    <Quiz
                        question={currentQuestion}
                        index={index}
                        total={questions.length}
                        selected={selectedAnswer}
                        setSelected={handleSelectChoice}
                        isCorrect={isCorrect}
                        onReplay={playCurrent}
                        onNext={handleNext}
                    />
                )}
                {stage === STAGE.REVIEW_INTRO && (
                    <ReviewIntro count={wrongIndices.length} stats={stats} onNext={handleNext} />

                )}
                {stage === STAGE.REVIEW && (
                    <Quiz
                        question={currentQuestion}
                        index={reviewIndex}
                        total={reviewQueue.length}
                        selected={selectedAnswer}
                        setSelected={handleSelectChoice}
                        isCorrect={isCorrect}
                        onReplay={playCurrent}
                        onNext={handleNext}
                        modeLabel="復習"
                    />
                )}
                {stage === STAGE.COMPLETE && <Complete onNext={handleNext} />}
            </div>
        </div>
    );
}

function Header({ onReset, stage }) {
    return (
        <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                相対音感トレーナー
            </h1>

            {/* SETUP画面以外で表示 */}
            {stage !== STAGE.SETUP && (
                <button
                    onClick={onReset}
                    className="px-3 py-2 text-sm rounded-xl border hover:bg-slate-100"
                >
                    設定画面へ
                </button>
            )}
        </div>
    );
}


function Setup({ selectedIds, onToggle, total, setTotal, onStart, playMode, setPlayMode })
 {
    return (
        <div className="space-y-6">
            <section>
                <h2 className="font-semibold mb-2">出題するインターバルを選択 (2個以上)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {INTERVALS.map((it) => (
                        <label key={it.id} className="flex items-center gap-2 p-3 border rounded-xl hover:bg-slate-50">
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(it.id)}
                                onChange={() => onToggle(it.id)}
                            />
                            <span>{it.label}</span>
                        </label>
                    ))}
                </div>
            </section>
            <section className="flex items-center gap-3">
                <label className="font-semibold">出題数</label>
                <input
                    type="number"
                    min={1}
                    max={100}
                    value={total}
                    onChange={(e) => setTotal(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                    className="w-24 rounded-xl border px-3 py-2"
                />
                <span className="text-slate-500 text-sm">問 (1〜100)</span>
            </section>
            <section>
                <h2 className="font-semibold mb-2">再生モード</h2>
                <div className="flex gap-3">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="mode"
                            value="harmonic"
                            checked={playMode === "harmonic"}
                            onChange={() => setPlayMode("harmonic")}
                        />
                        同時再生
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="mode"
                            value="melodic"
                            checked={playMode === "melodic"}
                            onChange={() => setPlayMode("melodic")}
                        />
                        ずらして再生
                    </label>
                </div>
            </section>
            <div className="flex justify-end">
                <button
                    onClick={onStart}
                    disabled={selectedIds.length <= 1}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold disabled:opacity-40"
                >
                    スタート
                </button>
            </div>
        </div>
    );
}

function ChordSetup({ selectedIds, onToggle, total, setTotal,onStart }) {
    return (
        <div className="space-y-4">
            <h2 className="font-semibold">出題する和音を選択 (2個以上)</h2>
            {CHORDS.map(c => (
                <label key={c.id} className="flex items-center gap-2 p-3 border rounded-xl hover:bg-slate-50">
                    <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => onToggle(c.id)}
                    />
                    {c.label}
                </label>
            ))}
            <section className="flex items-center gap-3">
                <label className="font-semibold">出題数</label>
                <input
                    type="number"
                    min={1}
                    max={100}
                    value={total}
                    onChange={(e) => setTotal(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                    className="w-24 rounded-xl border px-3 py-2"
                />
                <span className="text-slate-500 text-sm">問 (1〜100)</span>
            </section>
            <div className="flex justify-end">
                <button
                    onClick={onStart}
                    disabled={selectedIds.length <= 1}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold disabled:opacity-40"
                >
                    スタート
                </button>
            </div>
        </div>
    );
}


function ProgressBar({ index, total, label }) {
    const pct = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;
    return (
        <div className="mb-4">
            <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-600">{label ?? "進行状況"}</span>
                <span className="text-sm text-slate-600">{index + 1} / {total}</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function Quiz({ question, index, total, selected, setSelected, isCorrect, onReplay, onNext, modeLabel }) {
    if (!question) return null;
    const canNext = selected != null; // 選択後に進める

    return (
        <div>
            <ProgressBar index={index} total={total} label={modeLabel ? `${modeLabel}の進行` : "進行状況"} />
            <div className="flex flex-col items-center gap-4 py-6">
                <button
                    onClick={onReplay}
                    className="w-28 h-28 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 hover:bg-indigo-100"
                    aria-label="再生"
                >
                    {/* スピーカーアイコン */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10" fill="currentColor"><path d="M3 10v4a1 1 0 001 1h3l3.707 3.707A1 1 0 0012 18V6a1 1 0 00-1.293-.953L7 8H4a1 1 0 00-1 1z" /><path d="M16.5 8.25a.75.75 0 011.5 0v7.5a.75.75 0 01-1.5 0v-7.5zM14 6a1 1 0 011.707-.707 8 8 0 010 13.414A1 1 0 0114 18.999 10 10 0 0014 6z" /></svg>
                </button>
                <p className="text-slate-600 text-sm">聞き直すときは上のボタンを押してね！</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {question.choices.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => setSelected(c.id)}
                        disabled={isCorrect === true} // 正解後は選択不可
                        className={
                            "text-left p-3 border rounded-xl hover:bg-slate-50 " +
                            (selected === c.id ? "border-indigo-500 ring-2 ring-indigo-300" : "")
                        }
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* フィードバック */}
            {selected != null && (
                <div className="mt-4">
                    {isCorrect ? (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">正解！よくできました。</div>
                    ) : (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                            不正解。正解は <b>{question.label}</b> です。
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end mt-6">
                <button
                    onClick={onNext}
                    disabled={!canNext}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold disabled:opacity-40"
                >
                    次へ (Enter)
                </button>
            </div>
        </div>
    );
}

function ReviewIntro({ count, stats, onNext }) {
    const allCorrect = count === 0;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">結果</h2>

            {allCorrect ? (
                <p className="text-emerald-700 font-semibold">
                    すごいね！全問正解！🎉
                </p>
            ) : (
                <p>
                    間違えた問題は <b>{count}</b> 問でした。
                </p>
            )}

            {/* ★追加：詳細表示 */}
            <div className="border rounded-xl p-4 bg-slate-50">
                <h3 className="font-semibold mb-2">インターバル別成績</h3>

                <div className="space-y-1 text-sm">
                    {Object.entries(stats).map(([id, s]) => {
                        const rate = Math.round(((s.total - s.wrong) / s.total) * 100);

                        const label = INTERVALS.find(i => i.id === id)?.label;

                        return (
                            <div key={id} className="flex justify-between">
                                <span>{label}</span>
                                <span>
                                    {s.total - s.wrong} / {s.total} 問（正答率 {rate}%）
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold"
                >
                    {allCorrect ? "完了へ (Enter)" : "復習を始める (Enter)"}
                </button>
            </div>
        </div>
    );
}



function Complete({ onNext }) {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">完了！</h2>
            <p>お疲れさまでした。初期画面に戻ります。</p>
            <div className="flex justify-end">
                <button onClick={onNext} className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold">初期画面へ (Enter)</button>
            </div>
        </div>
    );
}

function ModeSelect({ onSelect }) {
    return (
        <div className="space-y-6 text-center">
            <h2 className="text-xl font-semibold">出題モードを選択</h2>

            <div className="flex gap-4 justify-center">
                <button
                    onClick={() => onSelect(MODE.INTERVAL)}
                    className="px-6 py-4 rounded-2xl bg-indigo-600 text-white"
                >
                    2音（インターバル）
                </button>

                <button
                    onClick={() => onSelect(MODE.CHORD)}
                    className="px-6 py-4 rounded-2xl bg-indigo-600 text-white"
                >
                    3音（和音）
                </button>
            </div>
        </div>
    );
}


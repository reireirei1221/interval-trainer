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
            duration = 1.2, // 秒
            type = "sine",
            gain = 0.18, // 合計がクリップしない程度
            attack = 0.08,
            release = 0.18,
        } = opts;

        const now = ctx.currentTime + 0.01; // クリック回避のためごく僅かに遅らせる

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(gain, now + attack);
        g.gain.setTargetAtTime(0, now + attack + duration, release);
        g.connect(ctx.destination);

        const o1 = ctx.createOscillator();
        o1.type = type;
        o1.frequency.value = rootHz;
        o1.connect(g);

        const o2 = ctx.createOscillator();
        o2.type = type;
        o2.frequency.value = toFreq(rootHz, semitones);
        o2.connect(g);

        o1.start(now);
        o2.start(now);
        const stopAt = now + attack + duration + release * 3;
        o1.stop(stopAt);
        o2.stop(stopAt);
    }
}

const synth = new Synth();

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

    // 許可されたインターバルのidを持つ、インターバルの配列をメモ化
    const allowed = useMemo(
        () => INTERVALS.filter((i) => selectedIds.includes(i.id)),
        [selectedIds]
    );

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
        synth.playDyad(currentQuestion.rootHz, currentQuestion.semitones);
    }

    function handleToggleInterval(id) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    // スタートボタンが押されたとき、問題を生成してクイズを開始する関数
    function handleStart() {
        // 許可されたインターバルが2つ未満の場合は終了
        if (allowed.length < 2) return;
        // 出題数が1未満の場合は終了
        if (total < 1) return;
        // 音声コンテキストを初期化
        synth.ensure();
        // 問題を生成
        const qs = Array.from({ length: total }, () => makeQuestion(allowed));
        setQuestions(qs);
        // 問題のインデックスを初期化
        setIndex(0);
        // 選択された回答を初期化
        setSelectedAnswer(null);
        // 正誤判定を初期化
        setIsCorrect(null);
        // 間違った問題のIndex配列を初期化
        setWrongIndices([]);
        // ステージをQUIZに変更
        setStage(STAGE.QUIZ);
    }

    function handleSelectChoice(id) {
        if (!currentQuestion) return;
        setSelectedAnswer(id);
        const ok = id === currentQuestion.intervalId;
        setIsCorrect(ok);

        if (!ok) {
            setHadWrong(true); // 一度でも間違えたら記録
        }
    }

    // 次へボタンが押されたとき、クイズの進行やレビューの進行を制御する関数
    function handleNext() {
        if (stage === STAGE.QUIZ) {
            // // wasWrongは、isCorrectの反転
            // const wasWrong = isCorrect === false;
            // もし間違っていたら、wrongIndicesに現在のindexを追加
            if (hadWrong) setWrongIndices((w) => [...w, index]);

            if (index + 1 < questions.length) {
                setIndex((i) => i + 1);
                setSelectedAnswer(null);
                setIsCorrect(null);
                setHadWrong(null);
            } else {
                // 終了 → 復習判定
                if (wrongIndices.concat(hadWrong ? [index] : []).length > 0) {
                    // 間違った問題があったので復習ステージへ
                    setStage(STAGE.REVIEW_INTRO);
                } else {
                    // 正解率100% → 完了
                    setStage(STAGE.COMPLETE);
                }
            }
        } else if (stage === STAGE.REVIEW_INTRO) {
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
                {stage === STAGE.SETUP && (
                    <Setup
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
                    <ReviewIntro count={wrongIndices.length} onNext={handleNext} />
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
                同時2音インターバル当てトレーナー
            </h1>

            {/* SETUP画面以外で表示 */}
            {stage !== STAGE.SETUP && (
                <button
                    onClick={onReset}
                    className="px-3 py-2 text-sm rounded-xl border hover:bg-slate-100"
                >
                    初期画面へ
                </button>
            )}
        </div>
    );
}


function Setup({ selectedIds, onToggle, total, setTotal, onStart }) {
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
                <p className="text-slate-600 text-sm">ページ遷移時に自動再生されます。聞き直すときは上のボタン。</p>
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

function ReviewIntro({ count, onNext }) {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">結果</h2>
            <p>
                全ての問題が終わりました。間違えた問題は <b>{count}</b> 問でした。<br />
                間違えた問題を復習しましょう。
            </p>
            <div className="flex justify-end">
                <button onClick={onNext} className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold">復習を始める (Enter)</button>
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

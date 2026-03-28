// React
import React, { useEffect, useMemo, useRef, useState } from "react";

// Constants
import { INTERVALS, CHORDS, INVERSIONS, RESONANCE_INTERVALS, MODE, STAGE } from "./constants/music";

// Hooks
import { useAudio } from "./hooks/useAudio";

// Components
import { Header } from "./components/Header";
import { ExitPopup } from "./components/ExitPopup";
import { ModeSelect } from "./components/ModeSelect";
import { Complete } from "./components/Complete";
import { Setup } from "./components/Setup";
import { ReviewIntro } from "./components/ReviewIntro";
import { Quiz } from "./components/Quiz";
import { ResonanceQuiz } from "./components/ResonanceQuiz";
import { ChordSetup } from "./components/ChordSetup";
import { randomRootHz, shuffle } from "./utils/musicUtils";
import { ResonanceSetup } from "./components/ResonanceSetup";


export default function IntervalTrainer() {
    // 進行段階の初期値をSETUPに設定
    const [stage, setStage] = useState(STAGE.SETUP);
    // 出題する (許可される) インターバルのidの初期値を設定
    const [selectedIds, setSelectedIds] = useState(["M3", "m3"]);
    // 出題数の初期値を設定
    const [total, setTotal] = useState(10);
    // 再生モード (同時 or ずらし)
    const [playMode, setPlayMode] = useState("harmonic");
    const [showExitPopup, setShowExitPopup] = useState(false);

    const synth = useAudio();

    // 許可されたインターバルのidを持つ、インターバルの配列をメモ化
    const allowed = useMemo(
        () => INTERVALS.filter((i) => selectedIds.includes(i.id)),
        [selectedIds]
    );

    const allowedChords = useMemo(
        () => CHORDS.filter((c) => selectedIds.includes(c.id)),
        [selectedIds]
    );

    const allowedResonance = useMemo(
        () => RESONANCE_INTERVALS.filter((r) => selectedIds.includes(r.id)),
        [selectedIds]
    );

    const [mode, setMode] = useState(null); // null → 選択画面

    // 和音の展開形を選択するためのステート
    const [selectedInversions, setSelectedInversions] = useState(["root"]);

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

    const [sliderValue, setSliderValue] = useState(0);
    
    

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

        if (mode === MODE.RESONANCE) {
            synth.stopResonance();
            setSliderValue(0);
        }

        if (!currentQuestion) return;
        // RESONANCEモードの時は、音を止める
        
        // 初回はstartボタンでユーザ操作済みのため再生可能
        playCurrent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestion]);

    // 👇 ここに追加する
    useEffect(() => {
        if (!currentQuestion) return;
        if (mode !== MODE.RESONANCE) return;

        playCurrent();
    }, [sliderValue, currentQuestion, mode]);

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

        if (mode === MODE.RESONANCE) {
            synth.playDetunedInterval(
                currentQuestion.rootHz,
                currentQuestion.semitones,
                currentQuestion.ratio,
                currentQuestion.targetDetune + sliderValue
            );
            return;
        }
    }

    function handlePause() {
        synth.stopResonance();
    }

    function handleAnswer() {
        const error = Math.abs(sliderValue + currentQuestion.targetDetune);

        console.log("Error:", error);

        const ok = error < 2; // 2セント以内なら正解

        setIsCorrect(ok);

        if (!ok) setHadWrong(true);
    }


    function handleToggleInterval(id) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    function handleToggleInversion(id) {
        setSelectedInversions(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    }

    function applyInversion(semitones, inversion) {
        const notes = [...semitones];

        if (inversion === "root") return notes;

        if (inversion === "1st") {
            // ルートを1オクターブ上へ
            return [notes[1], notes[2], notes[0] + 12];
        }

        if (inversion === "2nd") {
            // ルート + 3度を上へ
            return [notes[2], notes[0] + 12, notes[1] + 12];
        }

        return notes;
    }

    function handleEndSession() {
        setStage(STAGE.SETUP);
        setQuestions([]);
        setIndex(0);
        setWrongIndices([]);
        setReviewQueue([]);
        setReviewIndex(0);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setHadWrong(null);
        setShowExitPopup(false);
        setSliderValue(0);
    }

    // ===== 共通 =====
    function createBalancedPool(items, total) {
        const baseCount = Math.floor(total / items.length);
        const remainder = total % items.length;

        let pool = [];

        items.forEach(item => {
            for (let i = 0; i < baseCount; i++) {
                pool.push(item);
            }
        });

        const shuffled = shuffle(items);
        for (let i = 0; i < remainder; i++) {
            pool.push(shuffled[i]);
        }

        return shuffle(pool);
    }

    function createInitialStats(items) {
        return Object.fromEntries(
            items.map(item => [item.id, { total: 0, wrong: 0 }])
        );
    }

    // ===== モード定義（ここが拡張ポイント）=====
    const MODE_CONFIG = {
        [MODE.INTERVAL]: {
            getItems: () => allowed,
            validate: (items) => items.length >= 2,

            createQuestion: (item, context) => ({
                rootHz: randomRootHz(12),
                intervalId: item.id,
                label: item.label,
                semitones: item.semitones,
                choices: context.items.map(i => ({ id: i.id, label: i.label })),
            }),
        },

        [MODE.CHORD]: {
            getItems: () => allowedChords,
            validate: (items) => items.length >= 2,

            createQuestion: (chord, context) => {
                const inversion =
                    selectedInversions[Math.floor(Math.random() * selectedInversions.length)];

                const inverted = applyInversion(chord.semitones, inversion);

                return {
                    rootHz: randomRootHz(12),
                    chordId: chord.id,
                    inversionId: inversion,
                    label:
                        chord.label +
                        "（" +
                        INVERSIONS.find(i => i.id === inversion).label +
                        "）",
                    semitones: inverted,
                    choices: context.items.map(c => ({ id: c.id, label: c.label })),
                };
            },
        },

        [MODE.RESONANCE]: {
            getItems: () => allowedResonance,
            validate: (items) => items.length >= 1,

            createQuestion: (item, context) => ({
                rootHz: randomRootHz(12),
                intervalId: item.id,
                label: item.label,
                semitones: item.semitones,
                ratio: item.ratio,
                choices: context.items.map(i => ({ id: i.id, label: i.label })),

                // 👇 これが本質
                targetDetune: Math.random() * 40 - 20, // -20〜+20

                sliderMin: -20,
                sliderMax: 20,
            }),
        },

    };


    function handleStart() {
        if (total < 1) return;

        const config = MODE_CONFIG[mode];
        if (!config) return;

        synth.ensure();

        const items = config.getItems();

        if (!config.validate(items)) return;

        const pool = createBalancedPool(items, total);

        const qs = pool.map(item =>
            config.createQuestion(item, { items })
        );

        // ===== state更新 =====
        setQuestions(qs);
        setIndex(0);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setWrongIndices([]);
        setStage(STAGE.QUIZ);
        setSliderValue(0);

        setStats(createInitialStats(items));
    }


    function handleSelectChoice(id) {
        if (!currentQuestion) return;
        setSelectedAnswer(id);
        const correctId = mode === MODE.INTERVAL
            ? currentQuestion.intervalId
            : currentQuestion.chordId;

        const ok = id === correctId;
        setIsCorrect(ok);

        if (ok) {
            setTimeout(() => synth.playSuccess(), 50);
        } else {
            setTimeout(() => synth.playError(), 50);
            setHadWrong(true); // 一度でも間違えたら記録
        }
    }

    // 共通リセット処理
    function resetState() {
        setQuestions([]);
        setIndex(0);
        setWrongIndices([]);
        setReviewQueue([]);
        setReviewIndex(0);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setHadWrong(null);
        setSliderValue(0);
    }

    // 回答状態のリセットだけ
    function resetAnswerState() {
        setSelectedAnswer(null);
        setIsCorrect(null);
        setHadWrong(null);
    }

    // 統計更新
    function updateStats(q, wasWrong) {
        const key = q.intervalId ?? q.chordId;

        setStats((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                total: prev[key].total + 1,
                wrong: wasWrong ? prev[key].wrong + 1 : prev[key].wrong,
            },
        }));
    }

    // 次の問題へ
    function goToNextQuestion() {
        if (index + 1 < questions.length) {
            setIndex((i) => i + 1);
            resetAnswerState();
        } else {
            setStage(STAGE.REVIEW_INTRO);
        }
    }

    // handleNext本体
    function handleNext() {
        if (stage === STAGE.QUIZ) {
            const q = questions[index];
            const key = q.intervalId ?? q.chordId;

            updateStats(q, hadWrong);

            if (hadWrong) {
                setWrongIndices((w) => [...w, index]);
            }

            goToNextQuestion();
            return;
        }

        if (stage === STAGE.REVIEW_INTRO) {
            if (wrongIndices.length === 0) {
                setStage(STAGE.SETUP);
                resetState();
                return;
            }

            const queue = [...new Set(wrongIndices)];
            setReviewQueue(queue);
            setReviewIndex(0);
            resetAnswerState();
            setStage(STAGE.REVIEW);
            return;
        }

        if (stage === STAGE.REVIEW) {
            if (reviewIndex + 1 < reviewQueue.length) {
                setReviewIndex((i) => i + 1);
                resetAnswerState();
            } else {
                setStage(STAGE.COMPLETE);
            }
            return;
        }

        if (stage === STAGE.COMPLETE) {
            setStage(STAGE.SETUP);
            resetState();
        }
    }

    useEffect(() => {
        function onKey(e) {
            if (e.key !== "Enter") return;

            e.preventDefault();

            const isAnswerRequired =
                stage === STAGE.QUIZ || stage === STAGE.REVIEW;

            if (isAnswerRequired && selectedAnswer == null) return;

            handleNext();
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [stage, selectedAnswer, handleNext]);


    const renderContent = () => {
        switch (stage) {
            case STAGE.SETUP:
                if (mode == null) {
                    return <ModeSelect onSelect={setMode} />;
                }
                if (mode === MODE.INTERVAL) {
                    return (
                        <Setup
                            selectedIds={selectedIds}
                            onToggle={handleToggleInterval}
                            total={total}
                            setTotal={setTotal}
                            onStart={handleStart}
                            playMode={playMode}
                            setPlayMode={setPlayMode}
                        />
                    );
                }
                if (mode === MODE.CHORD) {
                    return (
                        <ChordSetup
                            selectedIds={selectedIds}
                            onToggle={handleToggleInterval}
                            total={total}
                            setTotal={setTotal}
                            onStart={handleStart}
                            selectedInversions={selectedInversions}
                            onToggleInversion={handleToggleInversion}
                        />
                    );
                }
                if (mode === MODE.RESONANCE) {
                    return (
                        <ResonanceSetup
                            selectedIds={selectedIds}
                            onToggle={handleToggleInterval}
                            total={total}
                            setTotal={setTotal}
                            onStart={handleStart}
                        />
                    );
                }
                return null;

            case STAGE.QUIZ:
                if (mode === MODE.INTERVAL || mode === MODE.CHORD) {
                    return (
                        <Quiz
                            question={currentQuestion}
                            index={index}
                            total={questions.length}
                            selected={selectedAnswer}
                            setSelected={handleSelectChoice}
                            isCorrect={isCorrect}
                            onReplay={playCurrent}
                            onNext={handleNext}
                            onClose={() => setShowExitPopup(true)}
                        />
                    );
                }
                if (mode === MODE.RESONANCE) {
                    return (
                        <ResonanceQuiz
                            question={currentQuestion}
                            sliderValue={sliderValue}
                            setSliderValue={setSliderValue}
                            onReplay={playCurrent}
                            onPause={handlePause}
                            onSubmit={handleAnswer}
                            onNext={handleNext}
                            isCorrect={isCorrect}
                            index={index}
                            total={questions.length}
                            onClose={() => setShowExitPopup(true)}
                        />
                    );
                }


            case STAGE.REVIEW_INTRO:
                return (
                    <ReviewIntro
                        count={wrongIndices.length}
                        stats={stats}
                        onNext={handleNext}
                    />
                );

            case STAGE.REVIEW:
                if (mode !== MODE.RESONANCE) {
                    return (
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
                            onClose={() => setShowExitPopup(true)}
                        />
                    );
                }
                if (mode === MODE.RESONANCE) {
                    return (
                        <ResonanceQuiz
                            question={currentQuestion}
                            index={reviewIndex}
                            total={reviewQueue.length}
                            sliderValue={sliderValue}
                            setSliderValue={setSliderValue}
                            onReplay={playCurrent}
                            onSubmit={handleAnswer}
                            onNext={handleNext}
                            isCorrect={isCorrect}
                            onClose={() => setShowExitPopup(true)}
                        />
                    );
                }

            case STAGE.REVIEW_INTRO:
                return (
                    <ReviewIntro
                        count={wrongIndices.length}
                        stats={stats}
                        onNext={handleNext}
                    />
                );

            case STAGE.REVIEW:
                if (mode !== MODE.RESONANCE) {
                    return (
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
                            onClose={() => setShowExitPopup(true)}
                        />
                    );
                }

            case STAGE.COMPLETE:
                return <Complete onNext={handleNext} />;

            default:
                return null;
        }
    };

    return (
        <div>
            <div className="w-full h-full">
                {/* クイズ中はヘッダーを表示しない */}
                {stage !== STAGE.QUIZ && stage !== STAGE.REVIEW && (
                    <Header
                        stage={stage}
                        mode={mode}
                        setStage={setStage}
                        setMode={setMode}
                    />
                )}

                {renderContent()}
            </div>

            {showExitPopup && (
                <ExitPopup
                    onCancel={() => setShowExitPopup(false)}
                    onConfirm={handleEndSession}
                />
            )}
        </div>
    );
}


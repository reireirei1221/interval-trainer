// React
import React, { useEffect, useMemo, useRef, useState } from "react";

// Constants
import { INTERVALS, CHORDS, INVERSIONS, MODE, STAGE } from "./constants/music";

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
import { ChordSetup } from "./components/ChordSetup";
import { randomRootHz, shuffle, applyInversion } from "./utils/musicUtils";


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

            const qs = pool.map((chord) => {
                const inversion =
                    selectedInversions[Math.floor(Math.random() * selectedInversions.length)];

                const inverted = applyInversion(chord.semitones, inversion);

                return {
                    rootHz: randomRootHz(12),
                    chordId: chord.id,
                    inversionId: inversion,
                    label: chord.label + "（" +
                        INVERSIONS.find(i => i.id === inversion).label + "）",
                    semitones: inverted,
                    choices: allowedChords.map(c => ({ id: c.id, label: c.label })),
                };
            });


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

        if (ok) {
            setTimeout(() => synth.playSuccess(), 50);
        } else {
            setTimeout(() => synth.playError(), 50);
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
            const key = q.intervalId ?? q.chordId;

            if (hadWrong) {
                setWrongIndices((w) => [...w, index]);

                setStats((prev) => ({
                    ...prev,
                    [key]: {
                        ...prev[key],
                        wrong: prev[key].wrong + 1,
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
                            selectedInversions={selectedInversions}
                            onToggleInversion={handleToggleInversion}
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
                            onClose={() => setShowExitPopup(true)}
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
                        onClose={() => setShowExitPopup(true)}
                        />
                    )}
                    {stage === STAGE.COMPLETE && <Complete onNext={handleNext} />}
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























// import { useEffect, useState } from "react";
// import { MODE, STAGE, INTERVALS, CHORDS } from "./constants/music";

// import { useAudio } from "./hooks/useAudio";
// import { useQuizEngine } from "./hooks/useQuizEngine";
// import { useQuestionGenerator } from "./hooks/useQuestionGenerator";
// import { useStats } from "./hooks/useStats";
// import { usePlayer } from "./hooks/usePlayer";

// // Components
// import { Header } from "./components/Header";
// import { ExitPopup } from "./components/ExitPopup";
// import { ModeSelect } from "./components/ModeSelect";
// import { Complete } from "./components/Complete";
// import { Setup } from "./components/Setup";
// import { ReviewIntro } from "./components/ReviewIntro";
// import { Quiz } from "./components/Quiz";
// import { ChordSetup } from "./components/ChordSetup";

// export default function IntervalTrainer() {
//     const synth = useAudio();

//     const quiz = useQuizEngine();
//     const { generate } = useQuestionGenerator();
//     const stats = useStats();

//     const [mode, setMode] = useState(null);
//     const [selectedIds, setSelectedIds] = useState(["M3", "m3"]);
//     const [selectedInversions, setSelectedInversions] = useState(["root"]);
//     const [total, setTotal] = useState(10);
//     const [playMode, setPlayMode] = useState("harmonic");
//     const [selectedAnswer, setSelectedAnswer] = useState(null);
//     const [isCorrect, setIsCorrect] = useState(null);
//     const [showExitPopup, setShowExitPopup] = useState(false);

//     const player = usePlayer(mode, playMode, synth);

//     const current = quiz.currentQuestion;

//     useEffect(() => {
//         if (current) player.play(current);
//     }, [current]);

//     function handleStart() {
//         synth.ensure();

//         const qs = generate({
//             mode,
//             total,
//             selectedIds,
//             selectedInversions,
//         });

//         quiz.setQuestions(qs);
//         quiz.setStage(STAGE.QUIZ);

//         const items =
//             mode === MODE.INTERVAL
//                 ? INTERVALS.filter(i => selectedIds.includes(i.id))
//                 : CHORDS.filter(c => selectedIds.includes(c.id));

//         stats.init(items);
//     }

//     function handleToggleInterval(id) {
//         setSelectedIds(prev =>
//             prev.includes(id)
//                 ? prev.filter(x => x !== id)
//                 : [...prev, id]
//         );
//     }

//     function handleToggleInversion(id) {
//         setSelectedInversions(prev =>
//             prev.includes(id)
//                 ? prev.filter(x => x !== id)
//                 : [...prev, id]
//         );
//     }

//     function handleSelectChoice(id) {
//         if (!quiz.currentQuestion) return;
//         setSelectedAnswer(id);
//         const correctId = mode === MODE.INTERVAL
//             ? quiz.currentQuestion.intervalId
//             : quiz.currentQuestion.chordId;

//         const ok = id === correctId;
//         setIsCorrect(ok);

//         if (ok) {
//             setTimeout(() => synth.playSuccess(), 50);
//         } else {
//             setTimeout(() => synth.playError(), 50);
//             setHadWrong(true); // 一度でも間違えたら記録
//         }
//     }

//     function playCurrent() {
//         if (!quiz.currentQuestion) return;

//         if (mode === MODE.INTERVAL) {
//             if (playMode === "harmonic") {
//                 synth.playDyad(quiz.currentQuestion.rootHz, quiz.currentQuestion.semitones);
//             } else {
//                 synth.playMelodic(quiz.currentQuestion.rootHz, quiz.currentQuestion.semitones);
//             }
//         }

//         if (mode === MODE.CHORD) {
//             synth.playChord(quiz.currentQuestion.rootHz, quiz.currentQuestion.semitones);
//         }
//     }

//     function handleEndSession() {
//         setStage(STAGE.SETUP);
//         setQuestions([]);
//         setIndex(0);
//         setWrongIndices([]);
//         setReviewQueue([]);
//         setReviewIndex(0);
//         setSelectedAnswer(null);
//         setIsCorrect(null);
//         setHadWrong(null);
//         setShowExitPopup(false);
//     }

//     return (
//         <div>
//             <div className="w-full h-full">

//                 {/* クイズ中はヘッダーを表示しない */}
//                 {quiz.stage !== STAGE.QUIZ && quiz.stage !== STAGE.REVIEW && (
//                     <Header
//                         stage={quiz.stage}
//                         mode={mode}
//                         setStage={quiz.setStage}
//                         setMode={setMode}
//                     />
//                 )}

//                 {quiz.stage === STAGE.SETUP && mode == null && (
//                     <ModeSelect onSelect={setMode} />
//                 )}
//                 {quiz.stage === STAGE.SETUP && mode === MODE.INTERVAL && (
//                     <Setup
//                         selectedIds={selectedIds}
//                         onToggle={handleToggleInterval}
//                         total={total}
//                         setTotal={setTotal}
//                         onStart={handleStart}
//                         playMode={playMode}
//                         setPlayMode={setPlayMode}
//                     />
//                 )}
//                 {quiz.stage === STAGE.SETUP && mode === MODE.CHORD && (
//                     <ChordSetup
//                         selectedIds={selectedIds}
//                         onToggle={handleToggleInterval}
//                         total={total}
//                         setTotal={setTotal}
//                         onStart={handleStart}
//                         selectedInversions={selectedInversions}
//                         onToggleInversion={handleToggleInversion}
//                     />
//                 )}
//                 {quiz.stage === STAGE.QUIZ && (
//                     <Quiz
//                         question={quiz.currentQuestion}
//                         index={quiz.index}
//                         total={quiz.questions.length}
//                         selected={selectedAnswer}
//                         setSelected={handleSelectChoice}
//                         isCorrect={isCorrect}
//                         onReplay={playCurrent}
//                         onNext={quiz.next}
//                         onClose={() => setShowExitPopup(true)}
//                     />
//                 )}
//                 {quiz.stage === STAGE.REVIEW_INTRO && (
//                     <ReviewIntro count={wrongIndices.length} stats={stats} onNext={quiz.next} />

//                 )}
//                 {quiz.stage === STAGE.REVIEW && (
//                     <Quiz
//                         question={quiz.currentQuestion}
//                         index={reviewIndex}
//                         total={reviewQueue.length}
//                         selected={selectedAnswer}
//                         setSelected={handleSelectChoice}
//                         isCorrect={isCorrect}
//                         onReplay={playCurrent}
//                         onNext={quiz.next}
//                         modeLabel="復習"
//                         onClose={() => setShowExitPopup(true)}
//                     />
//                 )}
//                 {quiz.stage === STAGE.COMPLETE && <Complete onNext={quiz.next} />}
//             </div>
//             {showExitPopup && (
//                 <ExitPopup
//                     onCancel={() => setShowExitPopup(false)}
//                     onConfirm={handleEndSession}
//                 />
//             )}
//         </div>
//     );
// }




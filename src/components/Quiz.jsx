import { useState } from "react";

export function Quiz({
    question,
    index,
    total,
    selected,
    setSelected,
    isCorrect,
    onReplay,
    onNext,
    modeLabel,
    onClose
}) {
    const [isLeaving, setIsLeaving] = useState(false);

    if (!question) return null;

    const hasAnswered = selected != null;
    const canNext = hasAnswered;

    const feedbackState = !hasAnswered
        ? "idle"
        : isCorrect
            ? "correct"
            : "wrong";

    /* 次へ（アニメーション付き） */
    const handleNext = () => {
        if (!canNext || isLeaving) return;

        setIsLeaving(true);

        setTimeout(() => {
            onNext();
            setIsLeaving(false); // 次の問題用に戻す
        }, 300);
    };

    return (
        <div
            className={`
                h-screen flex flex-col bg-white overflow-hidden
                transition-all duration-300
                ${isLeaving
                    ? "opacity-0 scale-95"
                    : "opacity-100 scale-100"}
            `}
        >
            <ProgressBar
                index={index}
                total={total}
                onClose={onClose}
            />

            <QuestionHeader />

            <ReplayButton onReplay={onReplay} />

            {/* スクロール領域 */}
            <div className="flex-1 overflow-y-auto pb-40">
                <Choices
                    choices={question.choices}
                    selected={selected}
                    setSelected={setSelected}
                    disabled={isCorrect === true}
                />
            </div>

            <Footer
                state={feedbackState}
                canNext={canNext}
                onNext={handleNext}
                isLeaving={isLeaving}
            />
        </div>
    );
}

/* ----------------- Header ----------------- */

function QuestionHeader() {
    return (
        <div className="flex flex-col items-center justify-center pt-6 pb-4 px-6">
            <h1 className="text-3xl font-extrabold text-center leading-snug">
                この音は何ですか？
            </h1>
        </div>
    );
}

/* ----------------- Replay ----------------- */

function ReplayButton({ onReplay }) {
    return (
        <div className="flex justify-center py-6">
            <button
                onClick={onReplay}
                className="
                    w-20 h-20 rounded-full
                    bg-indigo-50 border border-indigo-200
                    flex items-center justify-center
                    text-indigo-600
                    shadow-sm
                    hover:bg-indigo-100 active:scale-95
                    transition
                "
                aria-label="再生"
            >
                <SpeakerIcon />
            </button>
        </div>
    );
}

function SpeakerIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-8 h-8"
            fill="currentColor"
        >
            <path d="M3 10v4a1 1 0 001 1h3l3.707 3.707A1 1 0 0012 18V6a1 1 0 00-1.293-.953L7 8H4a1 1 0 00-1 1z" />
            <path d="M16.5 8.25a.75.75 0 011.5 0v7.5a.75.75 0 01-1.5 0v-7.5zM14 6a1 1 0 011.707-.707 8 8 0 010 13.414A1 1 0 0114 18.999 10 10 0 0014 6z" />
        </svg>
    );
}

/* ----------------- Choices ----------------- */

function Choices({ choices, selected, setSelected, disabled }) {
    return (
        <div className="px-6 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
                {choices.map((c) => (
                    <ChoiceButton
                        key={c.id}
                        choice={c}
                        isSelected={selected === c.id}
                        onClick={() => setSelected(c.id)}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
}

function ChoiceButton({ choice, isSelected, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                w-full text-left
                p-5 rounded-2xl border-2 bg-white
                shadow-sm transition-all duration-200

                hover:shadow-md hover:-translate-y-0.5
                active:scale-[0.98]

                ${isSelected
                    ? "border-indigo-500 bg-indigo-50 scale-[1.02]"
                    : "border-gray-200"}

                ${disabled ? "opacity-70 cursor-not-allowed" : ""}
            `}
        >
            <div className="text-lg font-semibold">
                {choice.label}
            </div>
        </button>
    );
}

/* ----------------- Footer ----------------- */

function Footer({ state, canNext, onNext, isLeaving }) {
    const bgClass = {
        idle: "bg-white border-gray-200",
        correct: "bg-emerald-400 border-emerald-400",
        wrong: "bg-rose-400 border-rose-400"
    }[state];

    return (
        <div className={`fixed bottom-0 left-0 right-0 h-36 border-t ${bgClass}`}>
            <div className="max-w-3xl mx-auto h-full px-8 flex items-center justify-between">
                
                <div className="font-bold text-2xl text-white">
                    {state === "correct" && "Great Job!"}
                    {state === "wrong" && "Wrong!"}
                </div>

                <button
                    onClick={onNext}
                    disabled={!canNext || isLeaving}
                    className="
                        px-6 py-3
                        rounded-full
                        bg-white text-black font-bold
                        shadow-md
                        active:scale-95
                        disabled:opacity-40
                    "
                >
                    次へ
                </button>

            </div>
        </div>
    );
}

/* ----------------- Progress ----------------- */

function ProgressBar({ index, total, onClose }) {
    const pct = total > 0 ? ((index + 1) / total) * 100 : 0;

    return (
        <div className="px-6 pt-6 pb-2 mt-4">
            <div className="flex items-center justify-center gap-3">
                
                <button
                    onClick={onClose}
                    className="
                        p-2 rounded-full
                        text-gray-500
                        hover:bg-gray-100 active:scale-95
                        transition
                    "
                    aria-label="閉じる"
                >
                    <CloseIcon />
                </button>

                <div className="w-2/3 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${pct}%` }}
                    />
                </div>

            </div>
        </div>
    );
}

/* ----------------- Icons ----------------- */

function CloseIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
        </svg>
    );
}
import React, { useEffect, useMemo, useState } from "react";

export function ResonanceQuiz({
    question,
    sliderValue,
    setSliderValue,
    onReplay,
    onPause,
    onSubmit,
    onNext,
    index,
    total,
    onClose,
}) {
    /* ----------------- Hooks（必ず最上部） ----------------- */

    const [isPlaying, setIsPlaying] = useState(true);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setIsPlaying(true);
        setSubmitted(false);
    }, [question]);

    /* ----------------- Derived State ----------------- */

    const error = Math.abs((question?.targetDetune ?? 0) + sliderValue);

    const feedbackState = !submitted
        ? "idle"
        : error < 2
        ? "correct"
        : "wrong";

    const feedbackText = useMemo(() => {
        if (!submitted) return "";
        if (error < 0.5) return "◎ 完璧！共鳴している";
        if (error < 2) return "◎ とても良い（ほぼ共鳴）";
        if (error < 10) return "○ 近い";
        return "× まだズレている";
    }, [submitted, error]);

    const canNext = submitted;

    /* ----------------- Handlers ----------------- */

    function handlePlayToggle() {
        setIsPlaying((prev) => {
            if (prev) onPause?.();
            else onReplay?.();
            return !prev;
        });
    }

    function handleSubmit() {
        setSubmitted(true);
        onSubmit?.();
    }

    /* ----------------- Guard（Hooksの後） ----------------- */

    if (!question) return null;

    /* ----------------- UI ----------------- */



    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden">
            <ProgressBar
                index={index}
                total={total}
                onClose={onClose}
            />

            <QuestionHeader label={question.label} />

            <ReplayButton
                isPlaying={isPlaying}
                onToggle={handlePlayToggle}
            />

            <SliderSection
                sliderValue={sliderValue}
                setSliderValue={setSliderValue}
                min={question.sliderMin}
                max={question.sliderMax}
            />

            <Footer
                state={feedbackState}
                text={feedbackText}
                canNext={canNext}
                onSubmit={handleSubmit}
                onNext={onNext}
                submitted={submitted}
            />
        </div>
    );
}

/* ----------------- Header ----------------- */

function QuestionHeader({ label }) {
    console.log(label);
    return (
        <div className="flex flex-col items-center justify-center pt-6 pb-4 px-6">
            <h1 className="text-3xl font-extrabold text-center leading-snug">
                スライダーを共鳴する位置に合わせてください ({label})
            </h1>
        </div>
    );
}

/* ----------------- Replay ----------------- */

function ReplayButton({ isPlaying, onToggle }) {
    return (
        <div className="flex justify-center py-6">
            <button
                onClick={onToggle}
                className="
                    w-20 h-20 rounded-full
                    bg-indigo-50 border border-indigo-200
                    flex items-center justify-center
                    text-indigo-600
                    shadow-sm
                    hover:bg-indigo-100 active:scale-95
                    transition
                    text-3xl
                "
            >
                {isPlaying ? "⏸" : "▶"}
            </button>
        </div>
    );
}

/* ----------------- Slider ----------------- */

function SliderSection({ sliderValue, setSliderValue, min, max }) {
    return (
        <div className="px-6 mt-4 w-full">
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={0.1}
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className="w-full"
                />

                {/* <div className="text-center text-gray-500 text-sm">
                    {sliderValue.toFixed(1)} cents
                </div> */}
            </div>
        </div>
    );
}

/* ----------------- Footer ----------------- */

function Footer({
    state,
    text,
    canNext,
    onSubmit,
    onNext,
    submitted,
}) {
    const bgClass = {
        idle: "bg-white border-gray-200",
        correct: "bg-emerald-400 border-emerald-400",
        wrong: "bg-rose-400 border-rose-400",
    }[state];

    return (
        <div className={`fixed bottom-0 left-0 right-0 h-36 border-t ${bgClass}`}>
            <div className="max-w-3xl mx-auto h-full px-8 flex items-center justify-between">
                <div className="font-bold text-xl text-white">
                    {text}
                </div>

                {!submitted ? (
                    <button
                        onClick={onSubmit}
                        className="
                            px-6 py-3
                            rounded-full
                            bg-white text-black font-bold
                            shadow-md
                            active:scale-95
                        "
                    >
                        決定
                    </button>
                ) : (
                    <button
                        onClick={onNext}
                        disabled={!canNext}
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
                )}
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

/* ----------------- Icon ----------------- */

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
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M6 18L18 6"
            />
        </svg>
    );
}
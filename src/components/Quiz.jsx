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
    if (!question) return null;

    const hasAnswered = selected != null;
    const canNext = hasAnswered;

    const feedbackState = !hasAnswered
        ? "idle"
        : isCorrect
            ? "correct"
            : "wrong";

    return (
        <div className="h-screen flex flex-col">
            <ProgressBar
                index={index}
                total={total}
                label={modeLabel}
                onClose={onClose}
            />

            <QuestionHeader />

            <ReplayButton onReplay={onReplay} />

            <Choices
                choices={question.choices}
                selected={selected}
                setSelected={setSelected}
                disabled={isCorrect === true}
            />

            <Footer
                state={feedbackState}
                canNext={canNext}
                onNext={onNext}
            />
        </div>
    );
}

/* ----------------- 小コンポーネント ----------------- */

function QuestionHeader() {
    return (
        <div className="flex h-[10%] items-center justify-center">
            <h1 className="text-3xl font-bold">What is this sound?</h1>
        </div>
    );
}

function ReplayButton({ onReplay }) {
    return (
        <div className="flex flex-col items-center gap-4 py-6 h-1/4">
            <button
                onClick={onReplay}
                className="w-28 h-28 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 hover:bg-indigo-100"
                aria-label="再生"
            >
                <SpeakerIcon />
            </button>
        </div>
    );
}

function SpeakerIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10" fill="currentColor">
            <path d="M3 10v4a1 1 0 001 1h3l3.707 3.707A1 1 0 0012 18V6a1 1 0 00-1.293-.953L7 8H4a1 1 0 00-1 1z" />
            <path d="M16.5 8.25a.75.75 0 011.5 0v7.5a.75.75 0 01-1.5 0v-7.5zM14 6a1 1 0 011.707-.707 8 8 0 010 13.414A1 1 0 0114 18.999 10 10 0 0014 6z" />
        </svg>
    );
}

function Choices({ choices, selected, setSelected, disabled }) {
    return (
        <div className="mt-2 flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 w-1/2">
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
            className={`text-left p-3 border rounded-xl hover:bg-slate-50
                ${isSelected ? "border-indigo-500 ring-2 ring-indigo-300" : ""}`}
        >
            {choice.label}
        </button>
    );
}

function Footer({ state, canNext, onNext }) {
    const bgClass = {
        idle: "bg-white border-slate-200",
        correct: "bg-emerald-100 border-emerald-100",
        wrong: "bg-rose-100 border-rose-100"
    }[state];

    return (
        <div className={`fixed bottom-0 border-t h-1/6 w-full ${bgClass}`}>
            <Feedback state={state} />

            <div className="flex items-center justify-end h-full px-10">
                <button
                    onClick={onNext}
                    disabled={!canNext}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold disabled:opacity-40 shadow-xl"
                >
                    CONTINUE
                </button>
            </div>
        </div>
    );
}

function Feedback({ state }) {
    if (state === "idle") return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {state === "correct" ? (
                <span className="text-emerald-600 font-bold text-2xl">
                    Great Job!
                </span>
            ) : (
                <span className="text-rose-600 font-bold text-2xl">
                    Wrong!
                </span>
            )}
        </div>
    );
}

function ProgressBar({ index, total, label, onClose }) {
    const pct = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;

    return (
        <div className="flex items-center gap-5 h-1/4 w-2/3 mx-auto">
            <button
                onClick={onClose}
                className="text-slate-600 hover:text-slate-900 text-xl"
            >
                ×
            </button>

            <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-600 transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

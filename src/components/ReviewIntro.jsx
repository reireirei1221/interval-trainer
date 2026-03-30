import { useState } from "react";
import { INTERVALS } from "../constants/music";

/* 共通UI（Setupと揃える） */
function Card({ children }) {
    return (
        <div className="
            bg-white
            border border-slate-200
            rounded-2xl
            p-6
            shadow-sm
        ">
            {children}
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <h2 className="text-base font-semibold text-slate-800 mb-3">
            {children}
        </h2>
    );
}

// --- helper ---
function getIntervalLabel(id) {
    return INTERVALS.find(i => i.id === id)?.label ?? id;
}

function calcRate(total, wrong) {
    if (total === 0) return 0;
    return Math.round(((total - wrong) / total) * 100);
}

// --- sub component ---
function IntervalStatItem({ id, total, wrong }) {
    const correct = total - wrong;
    const rate = calcRate(total, wrong);
    const label = getIntervalLabel(id);

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">
                    {label}
                </span>
                <span className="font-semibold text-slate-800">
                    {correct}/{total}（{rate}%）
                </span>
            </div>

            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-500 transition-all"
                    style={{ width: `${rate}%` }}
                />
            </div>
        </div>
    );
}

// --- main component ---
export function ReviewIntro({ count, stats, onNext, mode }) {
    const [isLeaving, setIsLeaving] = useState(false);

    const allCorrect = count === 0;

    const handleNext = () => {
        setIsLeaving(true);

        setTimeout(() => {
            onNext();
        }, 300);
    };

    return (
        <div
            className={`
                max-w-4xl mx-auto space-y-6
                transition-all duration-300
                ${isLeaving
                    ? "opacity-0 scale-95"
                    : "opacity-100 scale-100"
                }
            `}
        >
            {/* タイトル */}
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-slate-800">
                    結果
                </h2>
            </div>

            {/* 結果メッセージ */}
            <ResultMessage allCorrect={allCorrect} count={count} />

            {/* 統計 */}
            <StatsSection stats={stats} mode={mode} />

            {/* ボタン */}
            <div className="flex justify-end">
                <button
                    onClick={handleNext}
                    className="
                        px-6
                        py-2.5
                        rounded-xl
                        bg-indigo-600
                        text-white
                        font-bold
                        text-sm
                        shadow-sm
                        hover:bg-indigo-700
                        active:scale-95
                        transition
                    "
                >
                    {allCorrect ? "完了へ" : "復習を始める"}
                </button>
            </div>
        </div>
    );
}

// --- UI parts ---
function ResultMessage({ allCorrect, count }) {
    if (allCorrect) {
        return (
            <Card>
                <div className="text-center text-emerald-700">
                    <p className="text-lg font-semibold">
                        全問正解！
                    </p>
                    <p className="text-sm mt-1 text-emerald-600">
                        パーフェクトです
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="text-slate-700">
                <p>
                    間違えた問題は{" "}
                    <span className="text-lg font-semibold"> {count} </span>{" "}
                    問でした
                </p>
            </div>
        </Card>
    );
}

function StatsSection({ stats, mode }) {
    const title = mode === "CHORD" ? "コード別成績" : "インターバル別成績";

    return (
        <Card>
            <SectionTitle> {title} </SectionTitle>
            <div className="space-y-3">
                {Object.entries(stats).map(([id, s]) => (
                    <IntervalStatItem key={id} id={id} total={s.total} wrong={s.wrong} />
                ))}
            </div>
        </Card>
    );
}
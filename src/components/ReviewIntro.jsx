import { INTERVALS } from "../constants/music";

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
                <span className="font-medium">{label}</span>
                <span className="font-semibold">
                    {correct}/{total}（{rate}%）
                </span>
            </div>

            {/* progress bar */}
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-500 transition-all"
                    style={{ width: `${rate}%` }}
                />
            </div>
        </div>
    );
}

// --- main component ---
export function ReviewIntro({ count, stats, onNext }) {
    const allCorrect = count === 0;

    return (
        <div className="space-y-6 p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg">

            <h2 className="text-2xl font-bold text-indigo-700">
                🎧 結果
            </h2>

            <ResultMessage allCorrect={allCorrect} count={count} />

            <StatsSection stats={stats} />

            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-md hover:scale-105 transition"
                >
                    {allCorrect ? "完了へ (Enter)" : "復習を始める (Enter)"}
                </button>
            </div>
        </div>
    );
}

// --- UI parts ---
function ResultMessage({ allCorrect, count }) {
    if (allCorrect) {
        return (
            <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-800 text-center shadow">
                <p className="text-lg font-bold">
                    🎉 すごい！全問正解！
                </p>
                <p className="text-sm mt-1">
                    パーフェクトです！
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 rounded-2xl bg-amber-100 text-amber-800 shadow">
            <p>
                間違えた問題は{" "}
                <span className="text-xl font-bold">{count}</span> 問でした。
            </p>
        </div>
    );
}

function StatsSection({ stats }) {
    return (
        <div className="border rounded-2xl p-5 bg-white shadow">
            <h3 className="font-semibold mb-4 text-indigo-600">
                📊 インターバル別成績
            </h3>

            <div className="space-y-3">
                {Object.entries(stats).map(([id, s]) => (
                    <IntervalStatItem
                        key={id}
                        id={id}
                        total={s.total}
                        wrong={s.wrong}
                    />
                ))}
            </div>
        </div>
    );
}

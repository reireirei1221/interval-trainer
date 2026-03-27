import { RESONANCE_INTERVALS } from "../constants/music";

// 数値入力の制限ロジックを切り出し
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// インターバル選択コンポーネント
function IntervalSelector({ selectedIds, onToggle }) {
    return (
        <section>
            <h2 className="font-semibold mb-2">
                出題するインターバルを選択
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RESONANCE_INTERVALS.map((it) => (
                    <label
                        key={it.id}
                        className="flex items-center gap-2 p-3 border rounded-xl hover:bg-slate-50"
                    >
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
    );
}

// 出題数入力
function QuestionCount({ total, setTotal }) {
    const handleChange = (e) => {
        const value = Number(e.target.value) || 1;
        setTotal(clamp(value, 1, 100));
    };

    return (
        <section className="flex items-center gap-3">
            <label className="font-semibold">出題数</label>
            <input
                type="number"
                min={1}
                max={100}
                value={total}
                onChange={handleChange}
                className="w-24 rounded-xl border px-3 py-2"
            />
            <span className="text-slate-500 text-sm">問 (1〜100)</span>
        </section>
    );
}

// メインコンポーネント
export function ResonanceSetup({
    selectedIds,
    onToggle,
    total,
    setTotal,
    onStart,
    playMode,
    setPlayMode,
}) {
    const isStartDisabled = selectedIds.length <= 0;

    return (
        <div className="space-y-6">
            <IntervalSelector
                selectedIds={selectedIds}
                onToggle={onToggle}
            />

            <QuestionCount
                total={total}
                setTotal={setTotal}
            />

            <div className="flex justify-end">
                <button
                    onClick={onStart}
                    disabled={isStartDisabled}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold disabled:opacity-40"
                >
                    スタート
                </button>
            </div>
        </div>
    );
}

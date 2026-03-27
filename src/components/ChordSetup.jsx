import { CHORDS, INVERSIONS } from "../constants/music";

// トグル風チェックボックス
function CheckboxItem({ checked, onChange, label }) {
    return (
        <label
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition
            ${checked ? "bg-indigo-50 border-indigo-400" : "hover:bg-slate-50"}`}
        >
            <span className="font-medium">{label}</span>

            <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition
                ${checked ? "bg-indigo-600 border-indigo-600" : "border-slate-300"}`}
            >
                {checked && (
                    <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                )}
            </div>

            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="hidden"
            />
        </label>
    );
}

export function ChordSetup({
    selectedIds,
    onToggle,
    total,
    setTotal,
    onStart,
    selectedInversions,
    onToggleInversion
}) {
    const isStartDisabled =
        selectedIds.length <= 1 || selectedInversions.length === 0;

    const handleTotalChange = (e) => {
        const value = Number(e.target.value) || 1;
        setTotal(Math.max(1, Math.min(100, value)));
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">

            {/* 和音選択 */}
            <section className="bg-white shadow-sm rounded-2xl p-5 space-y-3">
                <h2 className="font-semibold text-lg">
                    和音を選択
                </h2>
                <p className="text-sm text-slate-500">
                    2個以上選択してください
                </p>

                <div className="grid grid-cols-2 gap-3">
                    {CHORDS.map((c) => (
                        <CheckboxItem
                            key={c.id}
                            checked={selectedIds.includes(c.id)}
                            onChange={() => onToggle(c.id)}
                            label={c.label}
                        />
                    ))}
                </div>
            </section>

            {/* 転回形選択 */}
            <section className="bg-white shadow-sm rounded-2xl p-5 space-y-3">
                <h2 className="font-semibold text-lg">
                    転回形
                </h2>
                <p className="text-sm text-slate-500">
                    少なくとも1つ選択
                </p>

                <div className="grid grid-cols-2 gap-3">
                    {INVERSIONS.map((inv) => (
                        <CheckboxItem
                            key={inv.id}
                            checked={selectedInversions.includes(inv.id)}
                            onChange={() => onToggleInversion(inv.id)}
                            label={inv.label}
                        />
                    ))}
                </div>
            </section>

            {/* 出題数 */}
            <section className="bg-white shadow-sm rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold">出題数</h2>
                    <p className="text-sm text-slate-500">
                        1〜100問
                    </p>
                </div>

                <input
                    type="number"
                    min={1}
                    max={100}
                    value={total}
                    onChange={handleTotalChange}
                    className="w-24 rounded-xl border px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
            </section>

            {/* スタートボタン */}
            <button
                onClick={onStart}
                disabled={isStartDisabled}
                className={`w-full py-4 rounded-2xl font-semibold text-lg transition
                ${
                    isStartDisabled
                        ? "bg-slate-300 text-white cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
                }`}
            >
                スタート
            </button>
        </div>
    );
}

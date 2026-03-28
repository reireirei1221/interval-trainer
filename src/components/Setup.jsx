import { INTERVALS } from "../constants/music";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/* 共通カード */
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

/* セクションタイトル */
function SectionTitle({ children }) {
    return (
        <h2 className="text-base font-semibold text-slate-800 mb-3">
            {children}
        </h2>
    );
}

/* インターバル選択 */
function IntervalSelector({ selectedIds, onToggle }) {
    return (
        <Card>
            <SectionTitle>
                出題するインターバル（2個以上）
            </SectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INTERVALS.map((it) => {
                    const active = selectedIds.includes(it.id);

                    return (
                        <button
                            key={it.id}
                            onClick={() => onToggle(it.id)}
                            className={`
                                text-left
                                p-4
                                rounded-xl
                                border
                                transition
                                ${active
                                    ? "bg-indigo-50 border-indigo-400"
                                    : "bg-white border-slate-200 hover:bg-slate-50"
                                }
                            `}
                        >
                            <div className="font-medium text-slate-800">
                                {it.label}
                            </div>
                        </button>
                    );
                })}
            </div>
        </Card>
    );
}

/* 出題数 */
function QuestionCount({ total, setTotal }) {
    const handleChange = (e) => {
        const value = Number(e.target.value) || 1;
        setTotal(clamp(value, 1, 100));
    };

    return (
        <Card>
            <SectionTitle>出題数（1〜100）</SectionTitle>

            <div className="flex items-center gap-3">
                <input
                    type="number"
                    min={1}
                    max={100}
                    value={total}
                    onChange={handleChange}
                    className="
                        w-28
                        rounded-xl
                        border border-slate-200
                        px-3 py-2
                        text-center
                        focus:outline-none
                        focus:ring-2 focus:ring-indigo-200
                    "
                />
                <span className="text-sm text-slate-500">
                    問
                </span>
            </div>
        </Card>
    );
}

/* 再生モード */
function PlayModeSelector({ playMode, setPlayMode }) {
    const modes = [
        { value: "harmonic", label: "同時再生" },
        { value: "melodic", label: "ずらして再生" },
    ];

    return (
        <Card>
            <SectionTitle>再生モード</SectionTitle>

            <div className="flex gap-3 flex-wrap">
                {modes.map((mode) => {
                    const active = playMode === mode.value;

                    return (
                        <button
                            key={mode.value}
                            onClick={() => setPlayMode(mode.value)}
                            className={`
                                px-4 py-2 rounded-xl border transition
                                ${active
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white border-slate-200 hover:bg-slate-50"
                                }
                            `}
                        >
                            {mode.label}
                        </button>
                    );
                })}
            </div>
        </Card>
    );
}

export function Setup({
    selectedIds,
    onToggle,
    total,
    setTotal,
    onStart,
    playMode,
    setPlayMode,
}) {
    const isStartDisabled = selectedIds.length <= 1;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* タイトル */}
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-slate-800">
                    トレーニング設定
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    条件を選んでスタートしてください
                </p>
            </div>

            {/* 2カラム */}
            <div className="grid md:grid-cols-2 gap-6 items-stretch">
                
                {/* 左 */}
                <IntervalSelector
                    selectedIds={selectedIds}
                    onToggle={onToggle}
                />

                {/* 右 */}
                <div className="flex flex-col h-full">
                    <div className="space-y-6">
                        <QuestionCount
                            total={total}
                            setTotal={setTotal}
                        />

                        <PlayModeSelector
                            playMode={playMode}
                            setPlayMode={setPlayMode}
                        />
                    </div>

                    {/* 右下ボタン */}
                    <div className="mt-auto flex justify-end pt-6">
                        <button
                            onClick={onStart}
                            disabled={isStartDisabled}
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
                                transition
                                disabled:opacity-40
                                disabled:cursor-not-allowed
                            "
                        >
                            START
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


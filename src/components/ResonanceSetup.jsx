import { useState } from "react";
import { RESONANCE_INTERVALS } from "../constants/music";

const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

/* 共通カード */
function Card({ children }) {
    return (
        <div
            className="
            bg-white
            border border-slate-200
            rounded-2xl
            p-6
            shadow-sm
        "
        >
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
                出題するインターバル（1つ以上）
            </SectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RESONANCE_INTERVALS.map((it) => {
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
                                ${
                                    active
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

/* メイン */
export function ResonanceSetup({
    selectedIds,
    onToggle,
    total,
    setTotal,
    onStart,
}) {
    const [isLeaving, setIsLeaving] = useState(false);

    const isStartDisabled = selectedIds.length <= 0;

    const handleStart = () => {
        if (isStartDisabled) return;

        setIsLeaving(true);

        setTimeout(() => {
            onStart();
        }, 300); // アニメーション時間
    };

    return (
        <div
            className={`
                max-w-5xl mx-auto space-y-6
                transition-all duration-300
                ${
                    isLeaving
                        ? "opacity-0 scale-95"
                        : "opacity-100 scale-100"
                }
            `}
        >
            {/* タイトル */}
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-slate-800">
                    トレーニング設定
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    条件を選んでスタートしてください
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* 左 */}
                <IntervalSelector
                    selectedIds={selectedIds}
                    onToggle={onToggle}
                />

                {/* 右 */}
                <div className="flex flex-col h-full">
                    <QuestionCount
                        total={total}
                        setTotal={setTotal}
                    />

                    {/* ボタン */}
                    <div className="mt-auto flex justify-end pt-6">
                        <button
                            onClick={handleStart}
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
                                active:scale-95
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
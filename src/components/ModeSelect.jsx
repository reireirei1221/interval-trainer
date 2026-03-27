import { MODE } from "../constants/music";

const modes = [
    { 
        key: MODE.INTERVAL, 
        label: "2音（インターバル）",
        desc: "2つの音の距離を当てる",
        icon: "🎧"
    },
    { 
        key: MODE.CHORD, 
        label: "3音（和音）",
        desc: "和音の種類を判別する",
        icon: "🎹"
    },
];

export function ModeSelect({ onSelect }) {
    return (
        <div className="space-y-8 text-center">
            <div>
                <h2 className="text-2xl font-semibold text-slate-800">
                    出題モードを選択
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    トレーニング内容を選んでください
                </p>
            </div>

            <div className="flex gap-6 justify-center flex-wrap">
                {modes.map((mode) => (
                    <button
                        key={mode.key}
                        onClick={() => onSelect(mode.key)}
                        className="
                            group
                            w-56
                            p-6
                            rounded-2xl
                            bg-white
                            border border-slate-200
                            shadow-sm
                            hover:shadow-md
                            hover:-translate-y-1
                            transition
                            text-left
                        "
                    >
                        {/* Icon */}
                        <div className="text-3xl mb-4">
                            {mode.icon}
                        </div>

                        {/* Title */}
                        <div className="text-base font-semibold text-slate-800 mb-1">
                            {mode.label}
                        </div>

                        {/* Description */}
                        <div className="text-sm text-slate-500">
                            {mode.desc}
                        </div>

                        {/* Hover indicator */}
                        <div className="
                            mt-4 text-xs text-indigo-600 opacity-0 
                            group-hover:opacity-100 transition
                        ">
                            選択する →
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

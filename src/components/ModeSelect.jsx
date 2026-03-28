import { Music, Layers, Radio } from "lucide-react";
import { MODE } from "../constants/music";

const modes = [
    { 
        key: MODE.INTERVAL, 
        label: "2音（インターバル）",
        desc: "2つの音の距離を当てる",
        icon: Music,
        color: "from-indigo-500 to-purple-500"
    },
    { 
        key: MODE.CHORD, 
        label: "3音（和音）",
        desc: "和音の種類を判別する",
        icon: Layers,
        color: "from-pink-500 to-rose-500"
    },
    {
        key: MODE.RESONANCE,
        label: "共鳴",
        desc: "音の共鳴点を見つける",
        icon: Radio,
        color: "from-emerald-500 to-teal-500"
    }
];

export function ModeSelect({ onSelect }) {
    return (
        <div className="space-y-8 text-center">
            <div>
                <h2 className="text-2xl font-semibold text-slate-800">
                    分野別・集中トレーニング
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    勉強したい分野を選んでください
                </p>
            </div>

            <div className="flex gap-6 justify-center flex-wrap">
                {modes.map((mode) => {
                    const Icon = mode.icon;

                    return (
                        <button
                            key={mode.key}
                            onClick={() => onSelect(mode.key)}
                            className="
                                group w-56 p-6 rounded-2xl
                                bg-white border border-slate-200
                                shadow-sm hover:shadow-lg
                                hover:-translate-y-1 transition
                                text-left
                            "
                        >
                            {/* Icon */}
                            <div className={`
                                w-12 h-12 rounded-xl mb-4
                                flex items-center justify-center
                                bg-gradient-to-br ${mode.color}
                                text-white
                                group-hover:scale-110
                                transition
                            `}>
                                <Icon size={22} />
                            </div>

                            {/* Title */}
                            <div className="text-base font-semibold text-slate-800 mb-1">
                                {mode.label}
                            </div>

                            {/* Description */}
                            <div className="text-sm text-slate-500">
                                {mode.desc}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

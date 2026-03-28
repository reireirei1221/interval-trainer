import { useEffect, useRef, useState, useCallback } from "react";
import { STAGE } from "../constants/music";
import { SlidersHorizontal } from "lucide-react";
import { Music2 } from "lucide-react";


export function Header({ stage, mode, setStage, setMode }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const isModeSelect = stage === STAGE.SETUP && mode == null;
    const isSetup = stage === STAGE.SETUP && mode != null;

    const close = useCallback(() => setOpen(false), []);

    const goModeSelect = useCallback(() => {
        setStage(STAGE.SETUP);
        setMode(null);
        close();
    }, [setStage, setMode, close]);

    const goSetup = useCallback(() => {
        setStage(STAGE.SETUP);
        close();
    }, [setStage, close]);

    useEffect(() => {
        function handleEvent(e) {
            if (e.type === "keydown" && e.key === "Escape") {
                close();
                return;
            }

            if (e.type === "mousedown") {
                if (ref.current && !ref.current.contains(e.target)) {
                    close();
                }
            }
        }

        document.addEventListener("mousedown", handleEvent);
        window.addEventListener("keydown", handleEvent);

        return () => {
            document.removeEventListener("mousedown", handleEvent);
            window.removeEventListener("keydown", handleEvent);
        };
    }, [close]);

    const menuItems = [
        {
            label: "モード選択",
            onClick: goModeSelect,
            disabled: isModeSelect,
        },
        {
            label: "問題設定",
            onClick: goSetup,
            disabled: isSetup || isModeSelect,
        },
    ];

    return (
        <header className="
            mb-8 px-6 py-4 flex items-center justify-between
            bg-gradient-to-br from-white/80 to-white/60
            backdrop-blur-xl
            border border-slate-200/70
            rounded-2xl shadow-sm
        ">
            {/* Title */}
           <div className="flex items-center gap-3 cursor-pointer" onClick={goModeSelect}>
                <div className="
                    w-9 h-9 rounded-xl
                    bg-gradient-to-br from-blue-500 to-indigo-600
                    flex items-center justify-center
                    text-white shadow
                ">
                    <Music2 size={20} />
                </div>

                <div className="flex flex-col">
                    <span className="text-lg font-bold text-slate-800 leading-tight">
                        相対音感トレーナー
                    </span>
                    <span className="text-xs text-slate-500 tracking-wide">
                        Ear Training Tool
                    </span>
                </div>
            </div>

            {/* Menu */}
            <div className="relative" ref={ref}>
                <button
                    onClick={() => setOpen(o => !o)}
                    className="
                        p-2 rounded-xl
                        bg-white/70 backdrop-blur
                        border border-slate-200/60
                        shadow-sm

                        hover:bg-white
                        hover:shadow-md
                        active:scale-95

                        transition
                        flex items-center justify-center
                        group
                    "
                >
                    <SlidersHorizontal
                        className="
                            w-5 h-5 text-slate-600
                            transition-transform duration-300
                            group-hover:rotate-12
                        "
                    />
                </button>


                {open && (
                    <div className="
                        absolute right-0 mt-2 w-44
                        bg-white/90 backdrop-blur-xl
                        border border-slate-200/70
                        rounded-xl shadow-xl
                        p-2 space-y-1
                        origin-top-right
                        animate-[fadeIn_0.15s_ease-out,scaleIn_0.15s_ease-out]
                        z-50
                    ">
                        {menuItems.map(item => (
                            <button
                                key={item.label}
                                onClick={item.onClick}
                                disabled={item.disabled}
                                className="
                                    w-full text-left px-3 py-2 rounded-lg
                                    text-sm
                                    transition
                                    flex items-center justify-between

                                    text-slate-700
                                    hover:bg-slate-100

                                    disabled:opacity-40
                                    disabled:cursor-not-allowed
                                "
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </header>
    );
}

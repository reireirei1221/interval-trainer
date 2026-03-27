import { useEffect, useRef, useState, useCallback } from "react";
import { STAGE } from "../constants/music";

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
            <div className="flex flex-col">
                <h1 className="
                    text-2xl font-semibold tracking-tight
                    text-slate-800 flex items-center gap-2
                ">
                    <span className="text-xl">🎵</span>
                    相対音感トレーナー
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 tracking-wide">
                    Ear Training Tool
                </p>
            </div>

            {/* Menu */}
            <div className="relative" ref={ref}>
                <button
                    onClick={() => setOpen(o => !o)}
                    className="
                        p-2 rounded-xl
                        hover:bg-slate-100 active:bg-slate-200
                        transition
                        flex items-center justify-center
                        group
                    "
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="
                            w-5 h-5 text-slate-600
                            transition-transform duration-300
                            group-hover:rotate-45
                            group-active:scale-90
                        "
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.325 4.317a1 1 0 011.35-.936l1.48.658a1 1 0 00.95 0l1.48-.658a1 1 0 011.35.936l.2 1.63a1 1 0 00.57.79l1.49.67a1 1 0 01.41 1.5l-.96 1.38a1 1 0 000 .94l.96 1.38a1 1 0 01-.41 1.5l-1.49.67a1 1 0 00-.57.79l-.2 1.63a1 1 0 01-1.35.936l-1.48-.658a1 1 0 00-.95 0l-1.48.658a1 1 0 01-1.35-.936l-.2-1.63a1 1 0 00-.57-.79l-1.49-.67a1 1 0 01-.41-1.5l.96-1.38a1 1 0 000-.94l-.96-1.38a1 1 0 01.41-1.5l1.49-.67a1 1 0 00.57-.79l.2-1.63z"
                        />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
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

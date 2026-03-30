import { useState } from "react";

export function ExitPopup({ onCancel, onConfirm }) {
    const [isLeaving, setIsLeaving] = useState(false);

    const handleCancel = () => {
        setIsLeaving(true);
        setTimeout(() => {
            onCancel();
        }, 300);
    };

    const handleConfirm = () => {
        setIsLeaving(true);
        setTimeout(() => {
            onConfirm();
        }, 300);
    };

    return (
        <div
            className={`
                fixed inset-0 flex items-center justify-center z-50
                bg-black/40
                transition-all duration-300
                ${isLeaving ? "opacity-0" : "opacity-100"}
            `}
        >
            <div
                className={`
                    bg-white rounded-2xl p-6 w-80 shadow-xl space-y-4 text-center
                    transition-all duration-300
                    ${isLeaving
                        ? "opacity-0 scale-95"
                        : "opacity-100 scale-100"
                    }
                `}
            >
                <h2 className="text-lg font-semibold">
                    セッションを終了しますか？
                </h2>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 rounded-xl border bg-green-500 text-white"
                    >
                        Yes
                    </button>

                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 rounded-xl bg-rose-500 text-white"
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    );
}
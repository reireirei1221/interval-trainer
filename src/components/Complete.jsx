import { useState } from "react";

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

export function Complete({ onNext }) {
    const [isLeaving, setIsLeaving] = useState(false);

    const handleNext = () => {
        setIsLeaving(true);

        setTimeout(() => {
            onNext();
        }, 300);
    };

    return (
        <div
            className={`
                max-w-4xl mx-auto space-y-6
                transition-all duration-300
                ${isLeaving
                    ? "opacity-0 scale-95"
                    : "opacity-100 scale-100"
                }
            `}
        >
            {/* タイトル */}
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-slate-800">
                    完了！
                </h2>
            </div>

            {/* メッセージ */}
            <Card>
                <div className="text-center text-emerald-700">
                    <p className="text-lg font-semibold">
                        お疲れさまでした
                    </p>
                    <p className="text-sm mt-1 text-emerald-600">
                        トレーニングが完了しました
                    </p>
                </div>
            </Card>

            {/* ボタン */}
            <div className="flex justify-end">
                <button
                    onClick={handleNext}
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
                    "
                >
                    初期画面へ
                </button>
            </div>
        </div>
    );
}
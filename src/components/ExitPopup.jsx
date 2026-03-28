export function ExitPopup({ onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-80 shadow-xl space-y-4 text-center">
                <h2 className="text-lg font-semibold">
                    セッションを終了しますか？
                </h2>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl border bg-emerald-500 text-white"
                    >
                        継続する
                    </button>

                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-xl bg-rose-500 text-white"
                    >
                        終了する
                    </button>
                </div>
            </div>
        </div>
    );
}
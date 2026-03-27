export function Complete({ onNext }) {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">完了！</h2>
            <p>お疲れさまでした。初期画面に戻ります。</p>
            <div className="flex justify-end">
                <button onClick={onNext} className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold">初期画面へ (Enter)</button>
            </div>
        </div>
    );
}

import React, { useEffect, useMemo, useState } from "react";

export function ResonanceQuiz({
  question,
  sliderValue,
  setSliderValue,
  onReplay,
  onSubmit,
  onNext,
  isCorrect,
  modeLabel = "共鳴調整",
  index,
  total,
  onClose,
}) {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSubmitted(false);
  }, [question]);

  // 👇 ここで安全に値を定義
  const error = Math.abs(question.targetDetune +sliderValue ?? 0);

  const feedbackColor = useMemo(() => {
    if (!submitted) return "#888";

    if (error < 5) return "#22c55e";
    if (error < 10) return "#eab308";
    return "#ef4444";
  }, [submitted, error]);

  const feedbackText = useMemo(() => {
    if (!submitted) return "調整してください";

    if (error < 5) return "◎ とても良い（ほぼ共鳴）";
    if (error < 10) return "○ 近い";
    return "× まだズレている";
  }, [submitted, error]);

  // 👇 その後で return ガード
  if (!question) return null;

  const { label, sliderMin, sliderMax } = question;

  function handleSubmit() {
    setSubmitted(true);
    onSubmit?.();
  }

return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8 p-6">

      <ProgressBar
                index={index}
                total={total}
                label={modeLabel}
                onClose={onClose}
            />

      {/* 問題ラベル */}
      <div className="text-lg">
        {label}
      </div>

      {/* スライダー */}
      <div className="w-full max-w-xl flex flex-col items-center gap-4">

        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={0.1}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full"
        />

        {/* 現在値
        <div className="text-sm text-gray-500">
          {sliderValue.toFixed(1)} cents
        </div> */}

        {/* フィードバックバー */}
        {/* <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${Math.max(0, 100 - error * 3)}%`,
              backgroundColor: feedbackColor,
            }}
          />
        </div> */}

        {/* フィードバックテキスト */}
        <div
          className="text-sm font-medium"
          style={{ color: feedbackColor }}
        >
          {feedbackText}
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="flex gap-4">

        <button
          onClick={onReplay}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          再生
        </button>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            決定
          </button>
        ) : (
          <button
            onClick={onNext}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            次へ
          </button>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ index, total, label, onClose }) {
    const pct = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;

    return (
        <div className="flex items-center gap-5 h-1/4 w-2/3 mx-auto">
            <button
                onClick={onClose}
                className="text-slate-600 hover:text-slate-900 text-xl"
            >
                ×
            </button>

            <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-600 transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
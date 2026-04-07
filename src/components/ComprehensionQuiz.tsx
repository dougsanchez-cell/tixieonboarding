import { useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";

interface CompQuestion {
  q: string;
  options: string[];
  correct: number;
}

interface ComprehensionQuizProps {
  questions: CompQuestion[];
  moduleNumber: number;
  onPass: () => void;
  passed: boolean;
}

const LABELS = ["A", "B", "C", "D"];

const ComprehensionQuiz = ({ questions, moduleNumber, onPass, passed }: ComprehensionQuizProps) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});

  if (!questions || questions.length === 0) return null;

  const allAnswered = Object.keys(answers).length === questions.length;

  const handleSelect = (qIndex: number, optIndex: number) => {
    if (checked && results[qIndex]) return;
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleCheck = () => {
    const res: Record<number, boolean> = {};
    let allCorrect = true;
    questions.forEach((q, i) => {
      const correct = answers[i] === q.correct;
      res[i] = correct;
      if (!correct) allCorrect = false;
    });
    setResults(res);
    setChecked(true);
    if (allCorrect) onPass();
  };

  const handleRetry = () => {
    const newAnswers: Record<number, number> = {};
    Object.entries(answers).forEach(([k, v]) => {
      const idx = Number(k);
      if (results[idx]) newAnswers[idx] = v;
    });
    setAnswers(newAnswers);
    setChecked(false);
    setResults({});
  };

  const getOptionClass = (qIndex: number, optIndex: number) => {
    const isSelected = answers[qIndex] === optIndex;

    if (!checked) {
      if (isSelected) return "border-[#9B6FE8] bg-[#9B6FE8]/20 text-white";
      return "border-white/20 bg-white/5 hover:bg-white/10 text-white/80";
    }

    const isCorrect = questions[qIndex].correct === optIndex;
    const wasSelected = isSelected;

    if (isCorrect && (wasSelected || !results[qIndex])) {
      return "border-green-400 bg-green-500/20 text-white";
    }
    if (wasSelected && !results[qIndex]) {
      return "border-red-400 bg-red-500/20 text-white";
    }
    return "border-white/10 bg-white/5 text-white/40";
  };

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "#2D1B69" }}>
      <h3 className="font-semibold text-white flex items-center gap-2">
        <Check className="w-4 h-4 text-[#9B6FE8]" />
        Check your understanding
      </h3>

      {questions.map((q, qi) => (
        <div key={qi} className="space-y-2">
          <p className="text-sm font-medium text-white">
            {qi + 1}. {q.q}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => !passed && handleSelect(qi, oi)}
                disabled={passed || (checked && results[qi])}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-all ${getOptionClass(qi, oi)} ${
                  passed || (checked && results[qi]) ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-white/20 bg-white/10">
                  {LABELS[oi]}
                </span>
                <span className="flex-1">{opt}</span>
                {checked && answers[qi] === oi && results[qi] && (
                  <Check className="w-4 h-4 text-green-400 shrink-0" />
                )}
                {checked && answers[qi] === oi && !results[qi] && (
                  <X className="w-4 h-4 text-red-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {passed ? (
        <div className="flex items-center gap-2 text-green-400 font-medium text-sm bg-green-500/20 border border-green-500/30 rounded-xl p-3">
          <Check className="w-4 h-4" />
          All correct! You can mark this module complete.
        </div>
      ) : checked && Object.values(results).some(r => !r) ? (
        <div className="flex items-center gap-2">
          <p className="text-sm text-red-400 font-medium">Some answers are incorrect. Review and try again.</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white border border-white/20 hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Try again
          </button>
        </div>
      ) : !checked ? (
        <button
          onClick={handleCheck}
          disabled={!allAnswered}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white border border-[#9B6FE8] hover:bg-[#9B6FE8]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Check answers
        </button>
      ) : null}
    </div>
  );
};

export default ComprehensionQuiz;

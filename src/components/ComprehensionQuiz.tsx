import { useState, useEffect } from "react";
import { Check, X, RotateCcw } from "lucide-react";

interface CompQuestion { q: string; options: string[]; correct: number; }
interface ComprehensionQuizProps { questions: CompQuestion[]; moduleNumber: number; onPass: () => void; passed: boolean; demoMode?: boolean; }

const LABELS = ["A", "B", "C", "D"];

const ComprehensionQuiz = ({ questions, moduleNumber, onPass, passed, demoMode = false }: ComprehensionQuizProps) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});

  if (!questions || questions.length === 0) return null;

  // Demo mode: auto-select correct answers and pass
  useEffect(() => {
    if (demoMode && !passed && questions.length > 0) {
      const correctAnswers: Record<number, number> = {};
      const correctResults: Record<number, boolean> = {};
      questions.forEach((q, i) => { correctAnswers[i] = q.correct; correctResults[i] = true; });
      setAnswers(correctAnswers);
      setResults(correctResults);
      setChecked(true);
      onPass();
    }
  }, [demoMode]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const getOptionStyle = (qIndex: number, optIndex: number) => {
    const isSelected = answers[qIndex] === optIndex;
    if (!checked) {
      if (isSelected) return { bg: "#3D2B6B", border: "#8B50CC", color: "#E8E8F0" };
      return { bg: "#22233A", border: "#3A3B50", color: "#9898B0" };
    }
    const isCorrect = questions[qIndex].correct === optIndex;
    const wasSelected = isSelected;
    if (isCorrect && (wasSelected || !results[qIndex])) return { bg: "#1A3A2A", border: "#4CAF82", color: "#E8E8F0" };
    if (wasSelected && !results[qIndex]) return { bg: "#3A1A1A", border: "#E05555", color: "#E8E8F0" };
    return { bg: "#22233A", border: "#3A3B50", color: "#9898B0" };
  };

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "#22233A" }}>
      <h3 className="font-semibold text-white flex items-center gap-2">
        <Check className="w-4 h-4" style={{ color: "#8B50CC" }} />
        Check your understanding
      </h3>

      {questions.map((q, qi) => (
        <div key={qi} className="space-y-2">
          <p className="text-sm font-medium text-white">{qi + 1}. {q.q}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt, oi) => {
              const s = getOptionStyle(qi, oi);
              return (
                <button
                  key={oi}
                  onClick={() => !passed && handleSelect(qi, oi)}
                  disabled={passed || (checked && results[qi])}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-left text-sm transition-all"
                  style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    color: s.color,
                    cursor: passed || (checked && results[qi]) ? "default" : "pointer",
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ border: `1px solid ${s.border}`, background: "rgba(255,255,255,.05)" }}
                  >
                    {LABELS[oi]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {checked && answers[qi] === oi && results[qi] && <Check className="w-4 h-4 shrink-0" style={{ color: "#4CAF82" }} />}
                  {checked && answers[qi] === oi && !results[qi] && <X className="w-4 h-4 shrink-0" style={{ color: "#E05555" }} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {passed ? (
        <div className="flex items-center gap-2 font-medium text-sm rounded-xl p-3" style={{ background: "#1A3A2A", border: "1px solid #4CAF82", color: "#4CAF82" }}>
          <Check className="w-4 h-4" /> All correct! You can mark this module complete.
        </div>
      ) : checked && Object.values(results).some(r => !r) ? (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium" style={{ color: "#E05555" }}>Some answers are incorrect. Review and try again.</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:brightness-125"
            style={{ background: "#22233A", border: "1px solid #3A3B50", color: "#E8E8F0" }}
          >
            <RotateCcw className="w-3 h-3" /> Try again
          </button>
        </div>
      ) : !checked ? (
        <button
          onClick={handleCheck}
          disabled={!allAnswered}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:brightness-125"
          style={{ background: "#6B5498", border: "1px solid #8B50CC" }}
        >
          Check answers
        </button>
      ) : null}
    </div>
  );
};

export default ComprehensionQuiz;

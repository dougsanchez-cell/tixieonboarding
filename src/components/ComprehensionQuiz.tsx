import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    if (checked && results[qIndex]) return; // don't change correct answers
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
    // Reset only wrong answers
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
      if (isSelected) return "border-primary bg-primary/10 text-foreground";
      return "border-border bg-card hover:bg-accent text-foreground";
    }

    // After checking
    const isCorrect = questions[qIndex].correct === optIndex;
    const wasSelected = isSelected;

    if (isCorrect && (wasSelected || !results[qIndex])) {
      return "border-success bg-success-light text-foreground";
    }
    if (wasSelected && !results[qIndex]) {
      return "border-destructive bg-destructive/5 text-foreground";
    }
    return "border-border bg-card text-muted-foreground";
  };

  return (
    <div className="border border-primary/20 rounded-lg bg-primary/5 p-4 space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Check className="w-4 h-4 text-primary" />
        Check your understanding
      </h3>

      {questions.map((q, qi) => (
        <div key={qi} className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {qi + 1}. {q.q}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => !passed && handleSelect(qi, oi)}
                disabled={passed || (checked && results[qi])}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all ${getOptionClass(qi, oi)} ${
                  passed || (checked && results[qi]) ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-background border">
                  {LABELS[oi]}
                </span>
                <span className="flex-1">{opt}</span>
                {checked && answers[qi] === oi && results[qi] && (
                  <Check className="w-4 h-4 text-success shrink-0" />
                )}
                {checked && answers[qi] === oi && !results[qi] && (
                  <X className="w-4 h-4 text-destructive shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {passed ? (
        <div className="flex items-center gap-2 text-success font-medium text-sm bg-success-light border border-success/30 rounded-lg p-3">
          <Check className="w-4 h-4" />
          All correct! You can mark this module complete.
        </div>
      ) : checked && Object.values(results).some(r => !r) ? (
        <div className="flex items-center gap-2">
          <p className="text-sm text-destructive font-medium">Some answers are incorrect. Review and try again.</p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RotateCcw className="w-3 h-3 mr-1" /> Try again
          </Button>
        </div>
      ) : !checked ? (
        <Button
          onClick={handleCheck}
          disabled={!allAnswered}
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
        >
          Check answers
        </Button>
      ) : null}
    </div>
  );
};

export default ComprehensionQuiz;

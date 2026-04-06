import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, RotateCcw, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question {
  id: number;
  question_number: number;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
}

interface QuizStepProps {
  contractorId: string;
  onPass: (score: number) => void;
}

const QuizStep = ({ contractorId, onPass }: QuizStepProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passThreshold, setPassThreshold] = useState(80);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [qRes, configRes] = await Promise.all([
        supabase.from("quiz_questions").select("*").order("question_number"),
        supabase.from("app_config").select("value").eq("key", "pass_threshold").single(),
      ]);
      if (qRes.data) {
        setQuestions(
          qRes.data.map((q) => ({
            ...q,
            options: (q.options as unknown as string[]) || [],
          }))
        );
      }
      if (configRes.data) setPassThreshold(parseInt(configRes.data.value) || 80);
      setLoading(false);
    };
    load();
  }, []);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.question_number] === q.correct_index) correct++;
    });

    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setSubmitted(true);
    setAttempts((a) => a + 1);

    const passed = pct >= passThreshold;

    await supabase.functions.invoke("update-contractor", {
      body: {
        contractorId,
        quiz_score: pct,
        quiz_attempts: attempts + 1,
        status: passed ? "cleared" : "failed",
        ...(passed ? { completed_at: new Date().toISOString() } : {}),
      },
    });

    if (passed) {
      setTimeout(() => onPass(pct), 1500);
    }
  };

  const retry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading quiz...</div>;

  const passed = submitted && score >= passThreshold;

  return (
    <div className="px-4 max-w-3xl mx-auto animate-fade-in">
      {submitted && (
        <div
          className={`mb-6 p-4 rounded-lg text-center font-semibold ${
            passed ? "bg-success-light text-success" : "bg-destructive/10 text-destructive"
          }`}
        >
          {passed ? (
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" />
              You passed with {score}%! Redirecting...
            </div>
          ) : (
            <div>
              You scored {score}% — {passThreshold}% required to pass. Review the correct answers below and try again.
            </div>
          )}
        </div>
      )}

      {!submitted && (
        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground">
            {answeredCount}/{questions.length} answered · {passThreshold}% required to pass
          </p>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, qi) => {
          const userAnswer = answers[q.question_number];
          const isCorrect = submitted && userAnswer === q.correct_index;
          const isWrong = submitted && userAnswer !== undefined && userAnswer !== q.correct_index;

          return (
            <Card key={q.id} className={submitted ? (isCorrect ? "border-success/50" : isWrong ? "border-destructive/50" : "") : ""}>
              <CardContent className="pt-4">
                <p className="font-medium mb-3 text-sm">
                  <span className="text-primary font-bold mr-2">Q{q.question_number}.</span>
                  {q.question_text}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = userAnswer === oi;
                    const isCorrectOption = q.correct_index === oi;

                    let cls = "border border-border bg-card hover:bg-accent cursor-pointer";
                    if (submitted) {
                      cls = "border cursor-default ";
                      if (isCorrectOption) cls += "border-success bg-success-light";
                      else if (isSelected && !isCorrectOption) cls += "border-destructive bg-destructive/5";
                      else cls += "border-border bg-card opacity-60";
                    } else if (isSelected) {
                      cls = "border-2 border-primary bg-primary/5 cursor-pointer";
                    }

                    return (
                      <button
                        key={oi}
                        onClick={() => !submitted && setAnswers({ ...answers, [q.question_number]: oi })}
                        disabled={submitted}
                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 text-sm transition-all ${cls}`}
                      >
                        <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium shrink-0">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {submitted && isCorrectOption && <Check className="w-4 h-4 text-success shrink-0" />}
                        {submitted && isSelected && !isCorrectOption && <X className="w-4 h-4 text-destructive shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {submitted && isWrong && q.explanation && (
                  <p className="mt-3 text-xs text-muted-foreground bg-muted p-2 rounded">{q.explanation}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 text-center pb-8">
        {!submitted ? (
          <Button onClick={handleSubmit} disabled={!allAnswered} size="lg" className="min-w-[200px]">
            Submit Quiz
          </Button>
        ) : !passed ? (
          <Button onClick={retry} variant="outline" size="lg">
            <RotateCcw className="w-4 h-4 mr-2" /> Retry Quiz
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default QuizStep;

import { useState, useEffect } from "react";
import { Check, X, RotateCcw, Trophy, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question { id: number; question_number: number; question_text: string; options: string[]; }
interface GradeResult { correct: boolean; correct_index: number; explanation: string | null; }
interface QuizStepProps { contractorId: string; onPass: (score: number) => void; onBack?: () => void; demoMode?: boolean; }

const QuizStep = ({ contractorId, onPass, onBack, demoMode = false }: QuizStepProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passThreshold, setPassThreshold] = useState(80);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [results, setResults] = useState<Record<number, GradeResult>>({});

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc("get_quiz_questions");
      if (data && !error) {
        setQuestions((data as unknown as Question[]).map((q) => ({ ...q, options: (q.options as unknown as string[]) || [] })));
      }
      const { data: configData } = await supabase.functions.invoke("get-public-config");
      if (configData?.pass_threshold) setPassThreshold(parseInt(configData.pass_threshold) || 80);
      setLoading(false);
    };
    load();
  }, []);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const handleSubmit = async () => {
    if (!allAnswered) { toast.error("Please answer all questions before submitting."); return; }
    setGrading(true);
    try {
      const { data, error } = await supabase.functions.invoke("grade-quiz", { body: { contractorId, answers } });
      if (error) throw error;
      setScore(data.score); setResults(data.results); setPassThreshold(data.passThreshold); setSubmitted(true);
      if (data.passed) { setTimeout(() => onPass(data.score), 1500); }
    } catch (err) {
      toast.error("Failed to grade quiz. Please try again."); console.error(err);
    } finally { setGrading(false); }
  };

  const retry = () => { setAnswers({}); setSubmitted(false); setScore(0); setResults({}); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#1C1D2E" }}>
      <p className="animate-pulse" style={{ color: "#9898B0" }}>Loading quiz...</p>
    </div>
  );

  const passed = submitted && score >= passThreshold;

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "#1C1D2E" }}>
      <div className="max-w-3xl mx-auto animate-fade-in">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-medium mb-4 transition-colors hover:brightness-125"
            style={{ color: "#9898B0" }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tixie U
          </button>
        )}
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">📝</p>
          <h1 className="text-2xl font-black text-white">Knowledge Quiz</h1>
          <p className="text-sm mt-1" style={{ color: "#9898B0" }}>Score {passThreshold}% or higher to get cleared</p>
        </div>

        {/* Demo auto-pass button */}
        {demoMode && !submitted && (
          <div className="mb-6 text-center">
            <button
              onClick={() => onPass(100)}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-125"
              style={{ background: "#F59E0B", color: "#1C1D2E" }}
            >
              🎬 Demo: Auto-pass quiz
            </button>
          </div>
        )}

        {/* Pass / fail banner */}
        {submitted && (
          <div
            className="mb-6 p-5 rounded-2xl text-center font-semibold text-white animate-fade-in"
            style={{ background: passed ? "#1A3A2A" : "#3A2A1A", border: `1px solid ${passed ? "#4CAF82" : "#d97706"}` }}
          >
            {passed ? (
              <div className="flex items-center justify-center gap-2 text-lg">
                <Trophy className="w-6 h-6" style={{ color: "#4CAF82" }} />
                You passed with {score}%! Moving to completion...
              </div>
            ) : (
              <div>
                <p className="text-lg">You scored {score}% — {passThreshold}% required</p>
                <p className="text-sm font-normal mt-1" style={{ color: "#9898B0" }}>Review the correct answers below and try again</p>
              </div>
            )}
          </div>
        )}

        {/* Progress pill */}
        {!submitted && (
          <div className="flex justify-center mb-6">
            <div className="px-4 py-1.5 rounded-full text-sm font-medium" style={{ background: "#22233A", color: "#E8E8F0" }}>
              {answeredCount}/{questions.length} answered
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q) => {
            const userAnswer = answers[q.question_number];
            const result = results[q.question_number];
            const isCorrect = submitted && result?.correct;
            const isWrong = submitted && userAnswer !== undefined && !result?.correct;

            return (
              <div
                key={q.id}
                className={`rounded-2xl p-5 transition-all ${isWrong ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
                style={{ background: "#2A2B3D", border: "1px solid #3A3B50" }}
              >
                <p className="font-medium mb-3 text-sm text-white flex items-start gap-2">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "#8B50CC" }}
                  >
                    Q{q.question_number}
                  </span>
                  <span className="pt-1">{q.question_text}</span>
                </p>
                <div className="space-y-2 ml-10">
                  {q.options.map((opt, oi) => {
                    const isSelected = userAnswer === oi;
                    const isCorrectOption = submitted && result?.correct_index === oi;

                    let bg = "#22233A";
                    let border = "#3A3B50";
                    let textColor = "#E8E8F0";
                    let opacity = 1;

                    if (submitted) {
                      if (isCorrectOption) { bg = "#1A3A2A"; border = "#4CAF82"; }
                      else if (isSelected && !isCorrectOption) { bg = "#3A1A1A"; border = "#E05555"; }
                      else { opacity = 0.6; }
                    } else if (isSelected) {
                      bg = "#3D2B6B"; border = "#8B50CC";
                    }

                    return (
                      <button
                        key={oi}
                        onClick={() => !submitted && setAnswers({ ...answers, [q.question_number]: oi })}
                        disabled={submitted}
                        className="w-full text-left p-3 rounded-xl flex items-center gap-3 text-sm transition-all cursor-pointer disabled:cursor-default"
                        style={{ background: bg, border: `1px solid ${border}`, color: textColor, opacity }}
                      >
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0" style={{ border: `1px solid ${border}` }}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {submitted && isCorrectOption && <Check className="w-4 h-4 shrink-0" style={{ color: "#4CAF82" }} />}
                        {submitted && isSelected && !isCorrectOption && <X className="w-4 h-4 shrink-0" style={{ color: "#E05555" }} />}
                      </button>
                    );
                  })}
                </div>
                {submitted && isWrong && result?.explanation && (
                  <p className="mt-3 text-xs p-2 rounded-lg ml-10" style={{ background: "#22233A", color: "#9898B0" }}>{result.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="mt-8 text-center pb-8">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || grading}
              className="w-full sm:w-auto min-w-[220px] px-8 py-3.5 rounded-xl text-white font-semibold text-base transition-all hover:brightness-125 disabled:opacity-40 disabled:pointer-events-none"
              style={{ background: allAnswered ? "#6B5498" : "#3A3B50" }}
            >
              {grading ? "Grading..." : "Submit Quiz"}
            </button>
          ) : !passed ? (
            <button
              onClick={retry}
              className="px-8 py-3 rounded-xl text-white font-semibold transition-all hover:brightness-125"
              style={{ background: "#22233A", border: "1px solid #3A3B50" }}
            >
              <RotateCcw className="w-4 h-4 mr-2 inline" /> Retry Quiz
            </button>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};

export default QuizStep;

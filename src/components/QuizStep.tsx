import { useState, useEffect } from "react";
import { Check, X, RotateCcw, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question {
  id: number;
  question_number: number;
  question_text: string;
  options: string[];
}

interface GradeResult {
  correct: boolean;
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
  const [grading, setGrading] = useState(false);
  const [results, setResults] = useState<Record<number, GradeResult>>({});

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc("get_quiz_questions");
      if (data && !error) {
        setQuestions(
          (data as unknown as Question[]).map((q) => ({
            ...q,
            options: (q.options as unknown as string[]) || [],
          }))
        );
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
    if (!allAnswered) {
      toast.error("Please answer all questions before submitting.");
      return;
    }
    setGrading(true);
    try {
      const { data, error } = await supabase.functions.invoke("grade-quiz", {
        body: { contractorId, answers },
      });
      if (error) throw error;
      setScore(data.score);
      setResults(data.results);
      setPassThreshold(data.passThreshold);
      setSubmitted(true);
      if (data.passed) {
        setTimeout(() => onPass(data.score), 1500);
      }
    } catch (err) {
      toast.error("Failed to grade quiz. Please try again.");
      console.error(err);
    } finally {
      setGrading(false);
    }
  };

  const retry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setResults({});
  };

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #2D1B69 0%, #7B51D3 50%, #9B6FE8 100%)" }}
      >
        <p className="text-white/80 animate-pulse">Loading quiz...</p>
      </div>
    );

  const passed = submitted && score >= passThreshold;

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ background: "linear-gradient(135deg, #2D1B69 0%, #7B51D3 50%, #9B6FE8 100%)" }}
    >
      <div className="max-w-3xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">📝</p>
          <h1 className="text-2xl font-bold text-white">Knowledge Quiz</h1>
          <p className="text-white/70 text-sm mt-1">Score {passThreshold}% or higher to get cleared</p>
        </div>

        {/* Pass / fail banner */}
        {submitted && (
          <div
            className="mb-6 p-5 rounded-2xl text-center font-semibold text-white animate-fade-in relative overflow-hidden"
            style={{
              background: passed
                ? "linear-gradient(135deg, #059669, #34d399)"
                : "linear-gradient(135deg, #d97706, #fbbf24)",
            }}
          >
            {passed ? (
              <div className="flex items-center justify-center gap-2 text-lg">
                <Trophy className="w-6 h-6" />
                You passed with {score}%! Moving to completion...
              </div>
            ) : (
              <div>
                <p className="text-lg">You scored {score}% — {passThreshold}% required</p>
                <p className="text-sm font-normal mt-1 opacity-90">Review the correct answers below and try again</p>
              </div>
            )}
          </div>
        )}

        {/* Progress pill */}
        {!submitted && (
          <div className="flex justify-center mb-6">
            <div
              className="px-4 py-1.5 rounded-full text-sm font-medium text-white"
              style={{ background: "rgba(45,27,105,.7)", backdropFilter: "blur(8px)" }}
            >
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
                className={`bg-white rounded-2xl p-5 shadow-lg transition-all ${
                  isWrong ? "animate-[shake_0.4s_ease-in-out]" : ""
                }`}
              >
                <p className="font-medium mb-3 text-sm text-gray-900 flex items-start gap-2">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #7B51D3, #9B6FE8)" }}
                  >
                    Q{q.question_number}
                  </span>
                  <span className="pt-1">{q.question_text}</span>
                </p>
                <div className="space-y-2 ml-10">
                  {q.options.map((opt, oi) => {
                    const isSelected = userAnswer === oi;
                    const isCorrectOption = submitted && result?.correct_index === oi;

                    let bg = "bg-white border-gray-200 hover:border-[#7B51D3]/50 hover:shadow-md cursor-pointer";
                    if (submitted) {
                      if (isCorrectOption) bg = "bg-green-50 border-green-400 cursor-default";
                      else if (isSelected && !isCorrectOption) bg = "bg-red-50 border-red-400 cursor-default";
                      else bg = "bg-gray-50 border-gray-200 opacity-60 cursor-default";
                    } else if (isSelected) {
                      bg = "border-[#7B51D3] bg-[#7B51D3]/5 cursor-pointer shadow-md";
                    }

                    return (
                      <button
                        key={oi}
                        onClick={() => !submitted && setAnswers({ ...answers, [q.question_number]: oi })}
                        disabled={submitted}
                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 text-sm transition-all border-2 ${bg}`}
                      >
                        <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium shrink-0">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="flex-1 text-gray-800">{opt}</span>
                        {submitted && isCorrectOption && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                        {submitted && isSelected && !isCorrectOption && <X className="w-4 h-4 text-red-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {submitted && isWrong && result?.explanation && (
                  <p className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg ml-10">{result.explanation}</p>
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
              className="w-full sm:w-auto min-w-[220px] px-8 py-3.5 rounded-xl text-white font-semibold text-base transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden group"
              style={{
                background: allAnswered
                  ? "linear-gradient(135deg, #7B51D3, #9B6FE8)"
                  : "#64748b",
              }}
            >
              <span className="relative z-10">{grading ? "Grading..." : "Submit Quiz"}</span>
              {allAnswered && !grading && (
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,.25) 50%, transparent 60%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                  }}
                />
              )}
            </button>
          ) : !passed ? (
            <button
              onClick={retry}
              className="px-8 py-3 rounded-xl text-white font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] border border-white/20"
              style={{ background: "rgba(255,255,255,.1)", backdropFilter: "blur(8px)" }}
            >
              <RotateCcw className="w-4 h-4 mr-2 inline" />
              Retry Quiz
            </button>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
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

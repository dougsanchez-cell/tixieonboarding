import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED = [
  "What's the maximum I can go over the After Fees price?",
  "Can I buy tickets labeled 'Limited View' if they're close to the stage?",
  "Walk me through what the Select Option dropdown is for",
];

interface AIChatStepProps {
  onComplete: () => void;
}

const AIChatStep = ({ onComplete }: AIChatStepProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userQuestionCount, setUserQuestionCount] = useState(0);
  const [minQuestions, setMinQuestions] = useState(2);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.functions.invoke("get-public-config").then(({ data }) => {
      if (data?.min_chat_questions) setMinQuestions(parseInt(data.min_chat_questions) || 2);
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setUserQuestionCount((c) => c + 1);
    setLoading(true);
    try {
      const resp = await supabase.functions.invoke("chat-proxy", {
        body: { messages: newMessages },
      });
      if (resp.error) throw resp.error;
      const data = resp.data;
      if (data?.error) {
        setMessages([...newMessages, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: data?.response || "I'm not sure how to respond to that." }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = userQuestionCount >= minQuestions;

  return (
    <div
      className="min-h-screen py-6 px-4 flex flex-col items-center"
      style={{ background: "linear-gradient(135deg, #2D1B69 0%, #7B51D3 50%, #9B6FE8 100%)" }}
    >
      {/* Header */}
      <div className="text-center mb-5 animate-fade-in">
        <p className="text-4xl mb-2">✨</p>
        <h1 className="text-2xl font-bold text-white">Tixie AI Assistant</h1>
        <p className="text-white/70 text-sm mt-1">
          Ask anything about the training — minimum {minQuestions} questions to unlock the quiz
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-green-500/90">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Live AI 🤖
        </div>
      </div>

      {/* Chat card */}
      <div
        className="w-full max-w-3xl flex-1 flex flex-col rounded-[20px] overflow-hidden shadow-2xl animate-fade-in"
        style={{ background: "#1a0d3d", maxHeight: "min(600px, 65vh)" }}
      >
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-white/50 text-center">
                Ask at least {minQuestions} questions about the training material before taking the quiz.
              </p>
              <div className="space-y-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left p-3 rounded-xl border border-[#7B51D3]/40 text-white/90 text-sm transition-all hover:bg-white/10 hover:border-[#7B51D3]"
                    style={{ background: "rgba(123,81,211,.1)" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(123,81,211,.3)" }}>
                  <Bot className="w-4 h-4 text-white/80" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user" ? "text-white" : "text-white/90 border-l-2 border-[#7B51D3]"
                }`}
                style={{
                  background:
                    m.role === "user"
                      ? "linear-gradient(135deg, #7B51D3, #9B6FE8)"
                      : "#2D1B69",
                }}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white/70" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(123,81,211,.3)" }}>
                <Bot className="w-4 h-4 text-white/80" />
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: "#2D1B69" }}>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about Tixie..."
              disabled={loading}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#7B51D3] transition-all"
              style={{ background: "rgba(255,255,255,.06)" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-transform hover:scale-105 active:scale-95 shrink-0"
              style={{ background: "linear-gradient(135deg, #7B51D3, #9B6FE8)" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                canAdvance ? "bg-green-500/90 text-white" : "bg-white/10 text-white/50"
              }`}
            >
              {userQuestionCount}/{minQuestions} questions asked {canAdvance ? "✅" : ""}
            </span>
            <button
              onClick={onComplete}
              disabled={!canAdvance}
              className={`flex items-center gap-1 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all ${
                canAdvance
                  ? "hover:scale-[1.02] active:scale-[0.98]"
                  : "opacity-30 cursor-not-allowed"
              }`}
              style={{
                background: canAdvance
                  ? "linear-gradient(135deg, #7B51D3, #9B6FE8)"
                  : "rgba(255,255,255,.1)",
                ...(canAdvance ? { boxShadow: "0 0 20px rgba(123,81,211,0.4)" } : {}),
              }}
            >
              Take the Quiz <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatStep;

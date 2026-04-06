import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Sparkles, ArrowRight } from "lucide-react";
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
    supabase
      .from("app_config")
      .select("value")
      .eq("key", "min_chat_questions")
      .single()
      .then(({ data }) => {
        if (data) setMinQuestions(parseInt(data.value) || 2);
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
    <div className="px-4 max-w-3xl mx-auto animate-fade-in">
      <Card className="flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <CardHeader className="pb-3 border-b shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Tixie Training Assistant
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Powered by AI · Trained on official Jomero SOPs</p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot mr-1.5" />
              Live AI
            </Badge>
          </div>
        </CardHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Ask at least {minQuestions} questions about the training material before taking the quiz.
              </p>
              <div className="space-y-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent text-sm transition-colors"
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
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-dot" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t shrink-0 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about Tixie..."
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || loading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {userQuestionCount}/{minQuestions} questions asked
            </span>
            <Button onClick={onComplete} disabled={!canAdvance} size="sm" variant={canAdvance ? "default" : "secondary"}>
              Take the Quiz <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIChatStep;

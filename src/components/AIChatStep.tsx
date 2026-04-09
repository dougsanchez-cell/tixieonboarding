import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Bot, User, ArrowRight, Search, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message { role: "user" | "assistant"; content: string; }

const SUGGESTED = [
  "What's the maximum I can go over the After Fees price?",
  "Can I buy tickets labeled 'Limited View' if they're close to the stage?",
  "Walk me through what the Select Option dropdown is for",
];

interface TopicCard {
  id: number;
  icon: string;
  title: string;
  accent: string;
  collapsed: string;
  content: React.ReactNode;
}

const GlossaryPill = ({ status, abbr, desc }: { status: "ok" | "warn" | "no"; abbr: string; desc: string }) => {
  const styles = {
    ok:   { bg: "#1A3A2A", border: "#4CAF82", icon: "✅" },
    warn: { bg: "#3A2A1A", border: "#F59E0B", icon: "⚠️" },
    no:   { bg: "#3A1A1A", border: "#E05555", icon: "🚫" },
  };
  const s = styles[status];
  return (
    <div className="rounded-lg px-3 py-2 text-sm" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="font-semibold" style={{ color: "#E8E8F0" }}>{s.icon} {abbr}</span>
      <span style={{ color: "#9898B0" }}> — {desc}</span>
    </div>
  );
};

const TOPICS: TopicCard[] = [
  {
    id: 1, icon: "⏰", title: "Operating Hours", accent: "#4CAF82",
    collapsed: "Mon–Fri, 6:00 AM – 12:00 PM PST · Max 1 hour per session",
    content: (
      <ul className="space-y-2 text-sm" style={{ color: "#9898B0" }}>
        <li>Sessions run <span className="text-white font-semibold">Monday through Friday, 6:00 AM – 12:00 PM PST</span> only</li>
        <li>Total session time must not exceed <span className="text-white font-semibold">one hour</span></li>
        <li>Sessions can be split across multiple shorter windows as long as cumulative time stays under 1 hour</li>
        <li>You will not receive requests outside these hours</li>
      </ul>
    ),
  },
  {
    id: 2, icon: "⚙️", title: "Installing & Starting Tixie", accent: "#8B50CC",
    collapsed: "Mac install command + startup flow",
    content: (
      <ol className="space-y-2 text-sm list-decimal list-inside" style={{ color: "#9898B0" }}>
        <li>Open Terminal (Finder → search Terminal)</li>
        <li>Paste and press Return: <code className="text-xs px-2 py-0.5 rounded" style={{ background: "#1C1D2E", color: "#E8E8F0" }}>curl -fsSL https://kraken-app.s3.us-east-2.amazonaws.com/releases/tixie/install-mac.command | bash</code></li>
        <li>Tixie downloads and launches automatically</li>
        <li>After login: toggle <span className="text-white font-semibold">"Enable Local Connection"</span> in the top right</li>
        <li>When a request is ready you'll see a toast notification</li>
        <li>Click <span className="text-white font-semibold">"Start Purchasing"</span> → wait for seat map to fully load before interacting</li>
      </ol>
    ),
  },
  {
    id: 3, icon: "📋", title: "The Request Info Box", accent: "#8B50CC",
    collapsed: "Request ID, Section, After Fees, Before Fees, Select Option",
    content: (
      <ul className="space-y-2 text-sm" style={{ color: "#9898B0" }}>
        <li><span className="text-white font-semibold">Request ID</span> — click the icon to copy it. Always copy this before reporting any issue</li>
        <li><span className="text-white font-semibold">Section</span> — the exact section to purchase in (e.g. "sec 213/202")</li>
        <li><span className="text-white font-semibold">After Fees</span> — your maximum per-ticket price including all fees</li>
        <li><span className="text-white font-semibold">Before Fees</span> — face value per ticket only</li>
        <li><span className="text-white font-semibold">Select reason dropdown</span> — use when you CANNOT complete a purchase. Options: Code didn't work / Map didn't load / Sold out / Single seats left / Limited view / Obstructed view / Price point doesn't match / Other</li>
      </ul>
    ),
  },
  {
    id: 4, icon: "🔢", title: "Quantity Rules", accent: "#E05555",
    collapsed: "Even quantities only: 2, 4, 6, or 8 — never odd, never single",
    content: (
      <ul className="space-y-2 text-sm" style={{ color: "#9898B0" }}>
        <li><span className="text-white font-semibold">ALWAYS</span> purchase even quantities: 2, 4, 6, or 8 tickets</li>
        <li>The request always states 8 — buying fewer is fine, but always stay even</li>
        <li><span style={{ color: "#E05555" }} className="font-semibold">NEVER</span> purchase 1 ticket (single tickets are always wrong)</li>
        <li><span style={{ color: "#E05555" }} className="font-semibold">NEVER</span> purchase odd quantities (3, 5, 7 are always wrong)</li>
        <li>Tickets must be from the same section, at least 2 next to each other</li>
        <li>1+1 in separate rows does NOT count — they must be consecutive and together</li>
      </ul>
    ),
  },
  {
    id: 5, icon: "💰", title: "Price Rules", accent: "#4CAF82",
    collapsed: "After Fees ±$2 tolerance · Can buy below After Fees",
    content: (
      <ul className="space-y-2 text-sm" style={{ color: "#9898B0" }}>
        <li>Checkout CAN exceed the After Fees price by up to <span className="text-white font-semibold">$2</span> — this is acceptable</li>
        <li>You CAN purchase for LESS than After Fees as long as you're in the correct section</li>
        <li>Seats within the same section can be priced differently</li>
        <li>If unsure: select just 1 ticket first to check the price, then add more</li>
        <li>Subtotal = Face Value + Service Fee + Order Processing Fee (up to $5.00)</li>
      </ul>
    ),
  },
  {
    id: 6, icon: "🗺️", title: "Seat Selection Rules", accent: "#E05555",
    collapsed: "Closer to stage is better · Never buy LV, OV, SS, WC, ADA",
    content: (
      <ul className="space-y-2 text-sm" style={{ color: "#9898B0" }}>
        <li>Closer to the stage is <span className="text-white font-semibold">ALWAYS</span> better — prioritize the best available view</li>
        <li><span style={{ color: "#E05555" }} className="font-semibold">NEVER</span> purchase seats labeled: LV (Limited View), OV (Obstructed View), SS (Side Stage), WC (Wheelchair), ADA — unless the Request explicitly states they are acceptable</li>
        <li>When in doubt: use the Select Option dropdown and move to the next request</li>
      </ul>
    ),
  },
  {
    id: 7, icon: "📖", title: "Seat Terminology Glossary", accent: "#8B50CC",
    collapsed: "Full glossary of seat type abbreviations",
    content: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <GlossaryPill status="ok" abbr="GA / GA PIT" desc="General Admission, standing room (OK to buy)" />
        <GlossaryPill status="ok" abbr="Lawn" desc="Outdoor standing, furthest back (OK to buy)" />
        <GlossaryPill status="ok" abbr="PAV" desc="Pavilion, tiered outdoor seating (OK to buy)" />
        <GlossaryPill status="ok" abbr="ORCH" desc="Orchestra, main floor closest to stage (premium)" />
        <GlossaryPill status="ok" abbr="MEZZ" desc="Mezzanine, lowest balcony (OK to buy)" />
        <GlossaryPill status="ok" abbr="CS / CTS" desc="Center Stage / Closer to Stage (great seats)" />
        <GlossaryPill status="ok" abbr="IV" desc="In-View, clear sightline (good)" />
        <GlossaryPill status="ok" abbr="SRO" desc="Standing Room Only (OK to buy)" />
        <GlossaryPill status="ok" abbr="Clubs / Loges" desc="Premium indoor sections (OK to buy)" />
        <GlossaryPill status="warn" abbr="LV" desc="Limited View (avoid unless stated)" />
        <GlossaryPill status="warn" abbr="OV" desc="Obstructed View (avoid unless stated)" />
        <GlossaryPill status="warn" abbr="SS" desc="Side Stage (avoid unless stated)" />
        <GlossaryPill status="warn" abbr="Behind the Stage" desc="(avoid)" />
        <GlossaryPill status="warn" abbr="RV / AFS" desc="Rear View / Away From Stage (avoid)" />
        <GlossaryPill status="no" abbr="WC" desc="Wheelchair (NEVER purchase)" />
        <GlossaryPill status="no" abbr="ADA" desc="Accessible seating (NEVER purchase)" />
      </div>
    ),
  },
  {
    id: 8, icon: "🔧", title: "Troubleshooting", accent: "#BA7517",
    collapsed: "Tool stuck · 2-minute rule · How to report issues",
    content: (
      <ul className="space-y-2 text-sm" style={{ color: "#9898B0" }}>
        <li>If the seat map won't load or Tixie appears frozen: <span className="text-white font-semibold">wait up to 2 full minutes</span></li>
        <li>If still unresponsive: use the Select Option dropdown → "Map didn't load" or "Code didn't work" → move to next request</li>
        <li>Do not force-quit unless absolutely necessary</li>
        <li>To report an issue: (1) take a screenshot, (2) copy the Request ID from the Request Info box, (3) write what happened vs. what you expected. Save in a Google Doc</li>
      </ul>
    ),
  },
  {
    id: 9, icon: "📌", title: "The Three Core Rules", accent: "#E05555",
    collapsed: "The three rules you must never break",
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          {[
            "NEVER purchase single tickets or WC/ADA seats — no exceptions",
            "Reach out if you are unsure — do not guess",
            "NEVER purchase LV, OV, or SS seats unless the Request explicitly states they are acceptable",
          ].map((rule, i) => (
            <div key={i} className="flex gap-3 items-start rounded-xl px-4 py-3" style={{ background: "#3A1A1A", border: "1px solid #E05555" }}>
              <span className="text-lg font-black text-white">{i + 1}.</span>
              <span className="text-sm font-semibold text-white">{rule}</span>
            </div>
          ))}
        </div>
        <p className="text-xs italic" style={{ color: "#9898B0" }}>
          These three rules are the most important things to remember. If in doubt, refer back here.
        </p>
      </div>
    ),
  },
];

interface AIChatStepProps { onComplete: () => void; demoMode?: boolean; userPath?: string | null; }

const AIChatStep = ({ onComplete, demoMode = false, userPath = null }: AIChatStepProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userQuestionCount, setUserQuestionCount] = useState(0);
  const [minQuestions, setMinQuestions] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
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
      const resp = await supabase.functions.invoke("chat-proxy", { body: { messages: newMessages } });
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

  const canAdvance = demoMode || userQuestionCount >= minQuestions;

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return TOPICS;
    const q = searchQuery.toLowerCase();
    return TOPICS.filter(
      (t) => t.title.toLowerCase().includes(q) || t.collapsed.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Auto-expand first matching card on search
  useEffect(() => {
    if (searchQuery.trim() && filteredTopics.length > 0) {
      setExpandedCard(filteredTopics[0].id);
    } else if (!searchQuery.trim()) {
      setExpandedCard(null);
    }
  }, [searchQuery, filteredTopics]);

  const toggleCard = (id: number) => {
    setExpandedCard((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen py-6 px-4 flex flex-col items-center" style={{ background: "#1C1D2E" }}>
      <div className="w-full max-w-4xl space-y-6 animate-fade-in">

        {/* SECTION 1 — Header */}
        <div className="rounded-[16px] p-6" style={{ background: "#2A2B3D", border: "1px solid #3A3B50" }}>
          <h1 className="text-3xl font-black text-white mb-1">Tixie U 🎓</h1>
          <p className="text-sm mb-4" style={{ color: "#9898B0" }}>
            Your Tixie knowledge base — browse topics or ask anything below
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9898B0" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics... e.g. 'LV seats', 'price tolerance', 'even quantities'"
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all"
              style={{ background: "#22233A", border: "1px solid #3A3B50", focusRingColor: "#8B50CC" } as React.CSSProperties}
            />
          </div>
          <p className="text-xs mt-3" style={{ color: canAdvance ? "#4CAF82" : "#9898B0" }}>
            {canAdvance
              ? "✅ Ready to take the quiz!"
              : `Ask at least ${minQuestions} questions below to unlock the quiz`}
          </p>
        </div>

        {/* SECTION 2 — Topic Card Library */}
        <div>
          {filteredTopics.length === 0 && searchQuery.trim() && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: "#9898B0" }}>
                No topics found for "<span className="text-white">{searchQuery}</span>" — try asking below ↓
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTopics.map((topic) => {
              const isOpen = expandedCard === topic.id;
              return (
                <div
                  key={topic.id}
                  className="rounded-[14px] overflow-hidden transition-all"
                  style={{ background: "#2A2B3D", border: "1px solid #3A3B50", borderLeft: `3px solid ${topic.accent}` }}
                >
                  <button
                    onClick={() => toggleCard(topic.id)}
                    className="w-full text-left p-4 flex items-start gap-3 hover:brightness-110 transition-all"
                  >
                    <span className="text-xl shrink-0 mt-0.5">{topic.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white">{topic.title}</h3>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#9898B0" }}>{topic.collapsed}</p>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 shrink-0 mt-1 transition-transform duration-200"
                      style={{ color: "#9898B0", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
                  </button>
                  <div
                    className="transition-all duration-300 ease-in-out overflow-hidden"
                    style={{ maxHeight: isOpen ? "600px" : "0px", opacity: isOpen ? 1 : 0 }}
                  >
                    <div className="px-4 pb-4 pt-1 rounded-b-[14px]" style={{ background: "#22233A" }}>
                      {topic.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3 — Ask Tixie U (AI Chat) */}
        <div className="rounded-[16px] overflow-hidden" style={{ background: "#2A2B3D", border: "1px solid #3A3B50" }}>
          <div className="p-5 pb-3">
            <h2 className="text-xl font-black text-white">Ask Tixie U 🤖</h2>
            <p className="text-xs mt-1" style={{ color: "#9898B0" }}>
              Can't find what you're looking for? Ask anything about the training material.
            </p>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: "400px" }}>
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-center" style={{ color: "#9898B0" }}>
                  Try one of these questions to get started:
                </p>
                <div className="space-y-2">
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left p-3 rounded-xl text-sm transition-all hover:brightness-125"
                      style={{ background: "#22233A", border: "1px solid #3A3B50", color: "#E8E8F0" }}
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
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(139,80,204,.2)" }}>
                    <Bot className="w-4 h-4" style={{ color: "#8B50CC" }} />
                  </div>
                )}
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                  style={{
                    background: m.role === "user" ? "#6B5498" : "#22233A",
                    color: m.role === "user" ? "#FFFFFF" : "#E8E8F0",
                    borderLeft: m.role === "assistant" ? "2px solid #8B50CC" : "none",
                  }}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,.05)" }}>
                    <User className="w-4 h-4" style={{ color: "#9898B0" }} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(139,80,204,.2)" }}>
                  <Bot className="w-4 h-4" style={{ color: "#8B50CC" }} />
                </div>
                <div className="rounded-2xl px-4 py-3" style={{ background: "#22233A" }}>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#9898B0" }} />
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#9898B0", animationDelay: "0.2s" }} />
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#9898B0", animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-4 space-y-3" style={{ borderTop: "1px solid #3A3B50" }}>
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about Tixie..."
                disabled={loading}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all"
                style={{ background: "#22233A", border: "1px solid #3A3B50" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-transform hover:scale-105 active:scale-95 shrink-0"
                style={{ background: "#6B5498" }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between">
              <span
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{
                  background: canAdvance ? "#4CAF82" : "#22233A",
                  color: canAdvance ? "#FFFFFF" : "#9898B0",
                }}
              >
                {demoMode
                  ? "Demo: question gate bypassed"
                  : canAdvance
                  ? `✅ ${userQuestionCount}/${minQuestions} — ready to take the quiz!`
                  : `${userQuestionCount}/${minQuestions} questions asked`}
              </span>
              <button
                onClick={onComplete}
                disabled={!canAdvance}
                className="flex items-center gap-1 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-125 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: canAdvance ? "#6B5498" : "#3A3B50" }}
              >
                Take the Quiz <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatStep;

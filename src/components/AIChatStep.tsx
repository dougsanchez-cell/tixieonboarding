import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Bot, User, ArrowRight, Search, ChevronRight, ArrowLeft } from "lucide-react";
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
    id: 1, icon: "⏰", title: "Hours & Availability", accent: "#4CAF82",
    collapsed: "Peak hours Mon–Fri 6 AM–12 PM PST · Log in anytime · 10 hr/week max",
    content: (
      <ul className="space-y-2 text-sm" style={{ color: "#9898B0" }}>
        <li><span className="text-white font-semibold">Peak demand hours</span> are Monday through Friday, 6:00 AM – 12:00 PM PST — this is when the majority of requests come in</li>
        <li>You can log in and purchase <span className="text-white font-semibold">anytime</span> — you are not restricted to peak hours</li>
        <li>Weekly maximum is <span className="text-white font-semibold">10 hours</span> — distribute however you like (e.g. 2 hrs/day across 5 days, or 5 hrs on two days)</li>
        <li>Request volume outside peak hours may be lower, but you're welcome to log in whenever it works for you</li>
      </ul>
    ),
  },
  {
    id: 2, icon: "⚙️", title: "Installing & Starting Tixie", accent: "#8B50CC",
    collapsed: "Download for Windows or Mac · Security prompts · First launch",
    content: (
      <div className="space-y-4 text-sm" style={{ color: "#9898B0" }}>
        <p>The Tixie app is <span className="text-white font-semibold">not compatible with mobile devices</span> — you'll need a Windows or Mac desktop/laptop.</p>

        <div>
          <p className="text-white font-semibold mb-1">Step 1: Download Tixie</p>
          <p>Select the link for your operating system:</p>
          <ul className="mt-1 space-y-1 ml-4 list-disc">
            <li>🪟 <span className="text-white">Windows:</span> <a href="https://kraken-app.s3.us-east-2.amazonaws.com/releases/tixie/prod/v1.1.14-build-202604141043/tixie-app-v1.1.14-x64-setup.exe.zip" className="text-[#8B50CC] underline hover:text-[#a76de8]">Download for Windows</a></li>
            <li>🍎 <span className="text-white">Mac OS — Apple Silicon:</span> <a href="https://kraken-app.s3.us-east-2.amazonaws.com/releases/tixie/prod/v1.1.14-build-202604141043/tixie-app-v1.1.14-x64.dmg.zip" className="text-[#8B50CC] underline hover:text-[#a76de8]">Download for Mac (M1, M2, or newer)</a></li>
            <li>🍎 <span className="text-white">Mac OS — Intel:</span> <a href="https://kraken-app.s3.us-east-2.amazonaws.com/releases/tixie/prod/v1.1.14-build-202604141043/tixie-app-v1.1.14-arm64.dmg.zip" className="text-[#8B50CC] underline hover:text-[#a76de8]">Download for Mac (Intel processor)</a></li>
          </ul>
          <p className="mt-1 text-xs italic">Not sure which Mac version? Click the Apple icon (top left of your screen) → "About This Mac" to check your processor.</p>
        </div>

        <div>
          <p className="text-white font-semibold mb-1">Step 2: Install</p>
          <p>Click the downloaded file — the installer will begin automatically.</p>
          <ul className="mt-1 space-y-1 ml-4 list-disc">
            <li><span className="text-white">Windows:</span> You may see a blue "Windows protected your PC" popup. Click "More info" → then "Run anyway"</li>
            <li><span className="text-white">Mac:</span> You may see "app can't be opened because it is from an unidentified developer." Go to System Settings → Privacy & Security → under "Allow applications from," select "App Store and known developers"</li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold mb-1">Step 3: Open & log in</p>
          <p>Open the Tixie app and log in with the credentials provided by our team. If prompted, allow any necessary permissions so the app can function properly.</p>
        </div>

        <p>Having trouble installing? Email <a href="mailto:gigsupport@jomero.co" className="text-[#8B50CC] underline hover:text-[#a76de8]">gigsupport@jomero.co</a> and we'll help you get set up.</p>
      </div>
    ),
  },
  {
    id: 3, icon: "📋", title: "The Request Info Box", accent: "#8B50CC",
    collapsed: "Request ID, Section, After Fees, Before Fees, Select Option",
    content: (
      <ul className="space-y-2 text-sm" style={{ color: "#9898B0" }}>
        <li><span className="text-white font-semibold">Request ID</span> — identifies the request. Copy this if you need to report an issue</li>
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
        <li>Think about it from a <span className="text-white font-semibold">fan's perspective</span> — within the requested section, pick the seats you'd want if you were attending the show. Closer to the stage is always better</li>
        <li>On the seat map, <span className="text-white font-semibold">blue seats</span> are available for purchase — <span style={{ color: "#9898B0" }}>grey seats</span> are unavailable. Only select from the blue seats in your assigned section</li>
        <li><span style={{ color: "#E05555" }} className="font-semibold">NEVER</span> purchase seats labeled: LV (Limited View), OV (Obstructed View), SS (Side Stage), WC (Wheelchair), ADA — unless the Request explicitly states they are acceptable</li>
        <li>When in doubt: use the Select Option dropdown and move to the next request</li>
        <li>📄 For visual examples of seat maps and section layouts, see the <a href="https://opyxdjxlkobucilpyqgi.supabase.co/storage/v1/object/public/Docs/Tixie%20Tester%20Guideline%20-%20Updated%204_14_2026.pdf" target="_blank" rel="noopener noreferrer" className="text-[#8B50CC] underline hover:text-[#a76de8]">Tixie Tester Guideline</a></li>
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
        <GlossaryPill status="ok" abbr="Uppers" desc="Upper-level seating, furthest from stage (OK to buy)" />
        <GlossaryPill status="ok" abbr="Floor" desc="Front/bottom level, may be standing room (OK to buy)" />
        <GlossaryPill status="ok" abbr="Pit / Pits" desc="Closest to stage, often standing room (OK to buy)" />
        <GlossaryPill status="ok" abbr="Center" desc="Middle area, direct view of stage (OK to buy)" />
        <GlossaryPill status="ok" abbr="Aisle" desc="Next to walkways, usually in pairs (OK to buy)" />
        <GlossaryPill status="ok" abbr="GTB" desc="Good to Buy — confirmed OK to purchase" />
        <GlossaryPill status="warn" abbr="LV" desc="Limited View (avoid unless stated)" />
        <GlossaryPill status="warn" abbr="OV" desc="Obstructed View (avoid unless stated)" />
        <GlossaryPill status="warn" abbr="SS" desc="Side Stage (avoid unless stated)" />
        <GlossaryPill status="warn" abbr="Behind the Stage" desc="(avoid)" />
        <GlossaryPill status="warn" abbr="RV / RW / AFS" desc="Rear View / Rear of Stage / Away From Stage (avoid)" />
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
        <li>If still unresponsive: log the issue using the Select Option dropdown (choose "Map didn't load" or "Code didn't work") — this reports the problem and moves you to the next request</li>
        <li>Do not force-quit unless absolutely necessary</li>
        <li>To report an issue: use the <span className="text-white font-semibold">Tixie Support icon</span> in the Tixie app — you can submit text and attachments directly. Include the Request ID and describe what happened vs. what you expected</li>
        <li>As a Tixie tester, <span className="text-white font-semibold">reporting new bugs is part of your role</span>. If you encounter something new, report it once with a screenshot, the Request ID, and what happened. If the same issue keeps happening, note the frequency — no need to report it every time</li>
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
            "Reach out if you are unsure — do not guess. Email gigsupport@jomero.co or message via the app",
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
  {
    id: 10, icon: "🤖", title: "No Automated Tools Policy", accent: "#E05555",
    collapsed: "Bots, scripts, and automated purchasing tools are strictly prohibited",
    content: (
      <div className="space-y-3 text-sm" style={{ color: "#9898B0" }}>
        <p>The use of <span className="text-white font-semibold">bots, scripts, browser extensions, or any automated purchasing tools</span> is <span style={{ color: "#E05555" }} className="font-semibold">strictly prohibited</span>.</p>
        <p>All ticket purchases must be made manually by you. Automated tools undermine the integrity of the purchasing process and violate your contractor agreement.</p>
        <p className="font-semibold text-white">Violation of this policy will result in immediate termination of your contractor access.</p>
        <p className="text-xs italic" style={{ color: "#9898B0" }}>By completing this orientation, you acknowledge that you understand and agree to this policy.</p>
      </div>
    ),
  },
  {
    id: 11, icon: "🏟️", title: "Section Interpretation Guide", accent: "#8B50CC",
    collapsed: "How to read Floor, GA, ranges, Pit, Center, Uppers, Any, and more",
    content: (
      <div className="space-y-3 text-sm" style={{ color: "#9898B0" }}>
        <p className="text-xs italic">When a section name in the Request doesn't match what you see on the seat map, use these rules to interpret it.</p>
        <ul className="space-y-2">
          <li><span className="text-white font-semibold">Floor</span> — Front/bottom level of the venue, sometimes standing room. May also be called "Orchestra." If you don't see a section labeled "Floor," select the section that matches on the seat map</li>
          <li><span className="text-white font-semibold">GA (General Admission)</span> — Open seating or standing room, no assigned seats. If you don't see "GA" on the map, select the matching section name</li>
          <li><span className="text-white font-semibold">Ranges (e.g. 101-106)</span> — Means any section within that range is acceptable. If the map shows different section names, purchase in any section within the range</li>
          <li><span className="text-white font-semibold">Sections with "/" or "-" (e.g. 7/9)</span> — Means section 7 <span className="text-white">OR</span> section 9. Either is acceptable</li>
          <li><span className="text-white font-semibold">In View</span> — Preference for clear, standard sightlines. Avoid aisle seats, obstructed/limited views, and seats too far to the sides</li>
          <li><span className="text-white font-semibold">Pit / Pits</span> — Area closest to the stage, often standing room. Can generally be treated as GA or standing room entry</li>
          <li><span className="text-white font-semibold">Center</span> — Middle area of the venue with a direct view of the stage</li>
          <li><span className="text-white font-semibold">Left / Right</span> — Select seats on the specified side of the venue within the price point</li>
          <li><span className="text-white font-semibold">Uppers / Backs</span> — Top or back of the venue (sometimes called "nosebleeds"). If the venue doesn't label them as "Uppers," look for upper-level sections within the price point</li>
          <li><span className="text-white font-semibold">Mezzanine</span> — Mid-level section above orchestra but below upper/backs. Can be split into left, center, right</li>
          <li><span className="text-white font-semibold">Lawn</span> — Grassy area in amphitheaters, no fixed seating, furthest from stage. Sometimes labeled as GA</li>
          <li><span className="text-white font-semibold">Aisle</span> — Seats next to walkways or exits, usually in pairs, often less expensive</li>
          <li><span className="text-white font-semibold">Any</span> — Purchase in any section at the same price point, including lawn and GA. Still follow even-quantity rules</li>
        </ul>
        <p>📄 For the complete guide with visual examples, see the <a href="https://opyxdjxlkobucilpyqgi.supabase.co/storage/v1/object/public/Docs/Tixie%20Tester%20Guideline%20-%20Updated%204_14_2026.pdf" target="_blank" rel="noopener noreferrer" className="text-[#8B50CC] underline hover:text-[#a76de8]">Tixie Tester Guideline</a></p>
      </div>
    ),
  },
];

const TOPIC_SEARCH_INDEX: Record<number, string> = {
  1: "peak hours monday friday 6am 12pm pst anytime 10 hours week",
  2: "install download windows mac silicon intel terminal dmg exe security",
  3: "request id section after fees before fees select option dropdown",
  4: "quantity even 2 4 6 8 single odd tickets never",
  5: "price after fees $2 tolerance below above checkout subtotal",
  6: "seat selection fan perspective blue grey stage closer section LV OV SS WC ADA tester guideline",
  7: "glossary GA PIT lawn PAV ORCH MEZZ clubs loges IV LV OV SS WC ADA CS CTS SRO resale uppers upper balcony floor pit center aisle GTB RW",
  8: "troubleshooting stuck frozen 2 minutes select option map load bug report tester tixie support",
  9: "three core rules never single wheelchair ADA reach out guess LV OV SS",
  10: "bots scripts automated tools prohibited manual policy termination",
  11: "section interpretation floor GA general admission range 101 102 103 slash dash pit center left right uppers backs mezzanine lawn aisle any playbook",
};

interface AIChatStepProps { onComplete: () => void; onBack?: () => void; demoMode?: boolean; reviewMode?: boolean; userPath?: string | null; }

const formatAIResponse = (text: string) => {
  // First split by URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      // Render URL as clickable link
      const displayText = part.length > 50 ? "Tixie Tester Guideline (PDF)" : part;
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#8B50CC] underline hover:text-[#a76de8]">{displayText}</a>;
    }
    // Render markdown bold
    const boldParts = part.split(/\*\*(.*?)\*\*/g);
    return boldParts.map((bp, j) =>
      j % 2 === 1 ? <strong key={`${i}-${j}`} className="text-white">{bp}</strong> : bp
    );
  });
};

const AIChatStep = ({ onComplete, onBack, demoMode = false, reviewMode = false, userPath = null }: AIChatStepProps) => {
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

  const bypassGates = demoMode || reviewMode;
  const canAdvance = bypassGates || userQuestionCount >= minQuestions;

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return TOPICS;
    const q = searchQuery.toLowerCase();
    return TOPICS.filter(
      (t) => t.title.toLowerCase().includes(q) ||
             t.collapsed.toLowerCase().includes(q) ||
             (TOPIC_SEARCH_INDEX[t.id] || "").toLowerCase().includes(q)
    );
  }, [searchQuery, TOPIC_SEARCH_INDEX]);

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

        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-medium transition-colors hover:brightness-125"
            style={{ color: "#9898B0" }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Training
          </button>
        )}

        {/* SECTION 1 — Header */}
        <div className="rounded-[16px] p-6" style={{ background: "#2A2B3D", border: "1px solid #3A3B50" }}>
          <h1 className="text-3xl font-black text-white mb-1">Tixie U 🎓</h1>
          <p className="text-sm mb-4" style={{ color: "#9898B0" }}>
            Browse the reference topics below, or scroll down to ask Tixie U anything
          </p>
          <p className="text-xs" style={{ color: canAdvance ? "#4CAF82" : "#9898B0" }}>
            {canAdvance
              ? "✅ Ready to take the quiz!"
              : `Ask Tixie U at least ${minQuestions} questions in the chat below to unlock the quiz`}
          </p>
        </div>

        {/* SECTION 2 — Topic Card Library */}
        <div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9898B0" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter topics... e.g. 'price', 'seats', 'hours'"
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all"
              style={{ background: "#22233A", border: "1px solid #3A3B50", focusRingColor: "#8B50CC" } as React.CSSProperties}
            />
          </div>
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
                    style={{ maxHeight: isOpen ? "1200px" : "0px", opacity: isOpen ? 1 : 0 }}
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
                  {m.role === "assistant" ? formatAIResponse(m.content) : m.content}
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
                {reviewMode
                  ? "📚 Reviewing training materials"
                  : demoMode
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

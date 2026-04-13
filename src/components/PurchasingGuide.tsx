import { useState, useRef, useCallback, useEffect } from "react";
import { BookOpen, ChevronRight, Check } from "lucide-react";
import DOMPurify from "dompurify";

interface PurchasingGuideProps {
  completed: boolean;
  onComplete: () => void;
  demoMode?: boolean;
}

const GUIDE_SECTIONS = [
  {
    heading: "The Request Info Box",
    body: `Every request shows a dialog in the top-left of Tixie with: <strong>Request ID</strong> (identifies the request — copy this if you need to report an issue), <strong>Section</strong> (the exact section to purchase in, e.g. "sec 213"), <strong>After Fees</strong> (your maximum per-ticket price including all fees), <strong>Before Fees</strong> (face value only). There is also a <strong>"Select reason to see next request"</strong> dropdown — use this when you CANNOT complete a purchase.`,
  },
  {
    heading: "Quantity Rules",
    body: `Always purchase <strong>even quantities only: 2, 4, 6, or 8</strong> tickets. The request will always show 8 — buying fewer is fine but always stay even. <strong>NEVER buy 1 ticket.</strong> NEVER buy odd quantities (3, 5, 7). Tickets must be from the same section, at least 2 next to each other.`,
  },
  {
    heading: "Price Rules",
    body: `The checkout total <strong>CAN exceed After Fees by up to $2</strong> — this is acceptable. You CAN buy for <strong>LESS than After Fees</strong> as long as you are in the correct section. If unsure, select 1 ticket first to check the price before committing to more. The subtotal = Face Value + Service Fee + Order Processing Fee (up to $5.00).`,
  },
  {
    heading: "Seat Selection",
    body: `Think about it from a fan's perspective — within your assigned section, pick the seats you'd want if you were going to the show. Closer to the stage is <strong>ALWAYS better</strong>. On the seat map, blue seats are available and grey seats are unavailable — only select from the blue seats. NEVER purchase seats labeled <strong>LV</strong> (Limited View), <strong>OV</strong> (Obstructed View), <strong>SS</strong> (Side Stage), <strong>WC</strong> (Wheelchair), or <strong>ADA</strong> — unless the Request explicitly states they are acceptable. When in doubt, use the Select Option dropdown and move to the next request. For visual examples of seat maps and section layouts, see the <a href="https://opyxdjxlkobucilpyqgi.supabase.co/storage/v1/object/public/Docs/Tixie%20Tester%20Guideline.pdf" target="_blank">Tixie Tester Guideline</a>.`,
  },
  {
    heading: "The Select Option Dropdown",
    body: `Use when you CANNOT complete a purchase. Options: <strong>Code didn't work / Map didn't load / Sold out / Single seats left / Limited view / Obstructed view / Price point doesn't match / Other.</strong> Always use this rather than abandoning a request without reporting.`,
  },
  {
    heading: "Session Flow",
    body: `When a request is available you'll see a toast notification. A countdown timer shows how long you have to start. Click <strong>"Start Purchasing"</strong> → wait for the seat map to fully load → read the Request Info box → select seats → verify price → complete purchase. If the tool is stuck, wait up to 2 minutes then use Select Option → "Map didn't load." <strong>Peak demand hours</strong> are Mon–Fri 6:00 AM–12:00 PM PST, but you can log in anytime. Weekly max is <strong>10 hours</strong>.`,
  },
  {
    heading: "Reporting Issues & Policies",
    body: `As a Tixie tester, <strong>reporting new bugs is part of your role</strong>. Use the <strong>Tixie Support icon</strong> inside the Tixie app to submit issues — you can include text and attachments directly. Report new issues once — if the same bug recurs, note the frequency. If you are unsure about a purchase, <strong>reach out — do not guess</strong>. Email <a href="mailto:gigsupport@jomero.co">gigsupport@jomero.co</a> or use Tixie Support in the app. The use of <strong>bots, scripts, or automated tools is strictly prohibited</strong> — all purchases must be made manually.`,
  },
];

const PurchasingGuide = ({ completed, onComplete, demoMode = false }: PurchasingGuideProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [reachedBottom, setReachedBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    setScrollPct(Math.min(pct, 100));
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
      setReachedBottom(true);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isOpen) return;
    // If content is short enough to not scroll
    if (el.scrollHeight - el.clientHeight < 60) {
      setReachedBottom(true);
      setScrollPct(100);
    }
  }, [isOpen]);

  const handleMarkComplete = () => {
    onComplete();
    setIsOpen(false);
  };

  if (completed || demoMode) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
        style={{ background: "#1A3A2A", border: "1px solid #4CAF82", color: "#4CAF82" }}
      >
        <Check className="w-4 h-4" />
        Purchasing Guide completed
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div
        className="flex items-center gap-4 p-5 rounded-[14px] cursor-pointer transition-all hover:brightness-110"
        style={{ background: "#22233A", border: "1px solid #8B50CC" }}
        onClick={() => setIsOpen(true)}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(139,80,204,0.15)" }}
        >
          <span className="text-lg">📋</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white">Purchasing Guide</p>
          <p className="text-xs mt-0.5" style={{ color: "#9898B0" }}>
            Required reading — open and read before answering questions
          </p>
        </div>
        <button
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0 hover:brightness-125 transition-all"
          style={{ background: "#6B5498" }}
          onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        >
          Open Guide →
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ background: "#22233A", border: "1px solid #8B50CC" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #3A3B50" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <span className="font-bold text-white">Purchasing Guide</span>
          <span className="text-xs ml-2" style={{ color: reachedBottom ? "#4CAF82" : "#9898B0" }}>
            Read {scrollPct}% of guide
          </span>
        </div>
        <button
          className="text-xs px-3 py-1 rounded-lg hover:brightness-125 transition-all"
          style={{ background: "#3A3B50", color: "#E8E8F0" }}
          onClick={() => setIsOpen(false)}
        >
          Close Guide
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: "#1C1D2E" }}>
        <div
          className="h-full transition-all"
          style={{ width: `${scrollPct}%`, background: reachedBottom ? "#4CAF82" : "#8B50CC" }}
        />
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} onScroll={handleScroll} className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-5">
        {GUIDE_SECTIONS.map((section, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 mt-1 shrink-0" style={{ color: "#8B50CC" }} />
              <div>
                <h4 className="font-semibold text-white text-sm">{section.heading}</h4>
                <p
                  className="text-sm leading-relaxed mt-1"
                  style={{ color: "#9898B0" }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.body) }}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Bottom completion area */}
        <div className="pt-3" style={{ borderTop: "1px solid #3A3B50" }}>
          {reachedBottom ? (
            <button
              onClick={handleMarkComplete}
              className="w-full px-6 py-3 rounded-xl text-white font-semibold transition-all hover:brightness-125"
              style={{ background: "#4CAF82" }}
            >
              ✅ Guide complete — unlock questions
            </button>
          ) : (
            <p className="text-xs text-center" style={{ color: "#9898B0" }}>
              ↓ Scroll to the bottom to complete the guide
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchasingGuide;

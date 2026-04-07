import { useEffect, useMemo } from "react";
import { Mail, Terminal, Clock, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CompletionStepProps {
  name: string;
  email: string;
  score: number;
  contractorId: string;
}

const CONFETTI_COLORS = ["#7B51D3", "#9B6FE8", "#1D9E75", "#34d399", "#FFD700", "#fff"];

const CompletionStep = ({ name, email, score, contractorId }: CompletionStepProps) => {
  const firstName = name.split(" ")[0];

  useEffect(() => {
    supabase.functions.invoke("notify-ops", {
      body: { contractorId, name, email, score },
    }).catch(() => {});
  }, [contractorId, name, email, score]);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: `${10 + Math.random() * 80}%`,
        delay: `${Math.random() * 0.6}s`,
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        xDrift: -60 + Math.random() * 120,
      })),
    []
  );

  return (
    <div
      className="min-h-screen py-10 px-4 flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2D1B69 0%, #7B51D3 40%, #1D9E75 100%)" }}
    >
      {/* Floating ticket shapes */}
      <div className="absolute inset-0 pointer-events-none hidden sm:block">
        <svg className="absolute top-[10%] left-[8%] animate-[float_4s_ease-in-out_infinite]" width="32" height="32" viewBox="0 0 32 32" fill="none"><polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="white" opacity=".1"/></svg>
        <svg className="absolute top-[20%] right-[10%] animate-[float_5s_ease-in-out_infinite_0.5s]" width="36" height="24" viewBox="0 0 36 24" fill="none"><rect x="1" y="1" width="34" height="22" rx="4" stroke="white" strokeWidth="1.5" opacity=".1"/><line x1="12" y1="0" x2="12" y2="24" stroke="white" strokeWidth="1" strokeDasharray="3 3" opacity=".1"/></svg>
        <svg className="absolute bottom-[15%] left-[12%] animate-[float_6s_ease-in-out_infinite_1s]" width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="white" strokeWidth="1.5" opacity=".1"/><polyline points="9,14 13,18 20,10" stroke="white" strokeWidth="1.5" opacity=".12" fill="none"/></svg>
        <svg className="absolute bottom-[30%] right-[7%] animate-[float_4.5s_ease-in-out_infinite_0.8s]" width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="12,1 15,9 23,9 17,14 19,23 12,18 5,23 7,14 1,9 9,9" fill="white" opacity=".1"/></svg>
      </div>

      {/* Confetti burst */}
      {confettiPieces.map((p) => (
        <div
          key={p.id}
          className="absolute animate-[confettiBurst_1.2s_ease-out_forwards]"
          style={{
            left: "50%",
            top: "35%",
            width: p.size,
            height: p.size,
            borderRadius: p.size > 10 ? "2px" : "50%",
            background: p.color,
            animationDelay: p.delay,
            "--confetti-x": `${p.xDrift}px`,
            "--confetti-r": `${p.rotation}deg`,
          } as React.CSSProperties}
        />
      ))}

      {/* Animated checkmark */}
      <div className="animate-[popIn_0.5s_ease-out_forwards] z-10 mb-4">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1D9E75, #34d399)" }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <polyline
              points="14,24 22,32 34,16"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </div>

      <h1 className="text-4xl font-bold text-white text-center z-10 mb-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
        {firstName}, you're cleared! 🎉
      </h1>
      <p className="text-white/70 text-center z-10 mb-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
        Your status has been updated and the ops team has been notified.
      </p>

      {/* Score cards — glassmorphism */}
      <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-lg z-10 animate-fade-in" style={{ animationDelay: "0.5s" }}>
        {[
          { icon: "🏆", value: `${score}%`, label: "Quiz Score" },
          { icon: "📚", value: "3/3", label: "Modules" },
          { icon: "✅", value: "Cleared", label: "Status" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-4 text-center border border-white/20"
            style={{ background: "rgba(255,255,255,.15)", backdropFilter: "blur(10px)" }}
          >
            <p className="text-2xl mb-1">{card.icon}</p>
            <p className="text-xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-white/60">{card.label}</p>
          </div>
        ))}
      </div>

      {/* What happens next */}
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg z-10 shadow-2xl animate-fade-in" style={{ animationDelay: "0.6s" }}>
        <h2 className="font-bold text-lg mb-4" style={{ color: "#2D1B69" }}>What happens next</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex gap-3 items-start">
            <Mail className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#7B51D3" }} />
            <span>Check <strong>{email}</strong> for your Tixie login credentials</span>
          </div>
          <div className="flex gap-3 items-start">
            <Terminal className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#7B51D3" }} />
            <span>Install Tixie via Terminal if you haven't already (Module 1)</span>
          </div>
          <div className="flex gap-3 items-start">
            <Clock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#1D9E75" }} />
            <span>Sessions run Mon–Fri, 6:00 AM – 12:00 PM PST, max 1 hour</span>
          </div>
          <div className="flex gap-3 items-start">
            <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#1D9E75" }} />
            <span>Questions? Reach out to the Jomero team</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          80% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes confettiBurst {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--confetti-x)), calc(-50% - 200px)) rotate(var(--confetti-r)) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CompletionStep;

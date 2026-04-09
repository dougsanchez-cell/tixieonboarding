import { useEffect } from "react";
import { Mail, Terminal, Clock, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CompletionStepProps {
  name: string;
  email: string;
  score: number;
  contractorId: string;
  userPath?: string | null;
  moduleCount?: number;
}

const CompletionStep = ({ name, email, score, contractorId, userPath = null, moduleCount = 3 }: CompletionStepProps) => {
  const firstName = name.split(" ")[0];
  const isA3 = userPath === "a3";

  useEffect(() => {
    supabase.functions.invoke("notify-ops", {
      body: { contractorId, name, email, score },
    }).catch(() => {});
  }, [contractorId, name, email, score]);

  return (
    <div
      className="min-h-screen py-10 px-4 flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#1C1D2E" }}
    >
      {/* Background organic blobs at 15% opacity */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[400px] h-[400px]"
          style={{
            background: "#8B50CC",
            opacity: 0.15,
            borderRadius: "50% 40% 60% 50% / 60% 50% 40% 50%",
            top: "-10%",
            right: "-10%",
            animation: "morphBlob 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[350px] h-[350px]"
          style={{
            background: "#7B3FC4",
            opacity: 0.15,
            borderRadius: "40% 60% 50% 50% / 50% 40% 60% 50%",
            bottom: "-5%",
            left: "-10%",
            animation: "morphBlob 8s ease-in-out infinite 2s",
          }}
        />
      </div>

      {/* Animated checkmark */}
      <div className="animate-[popIn_0.5s_ease-out_forwards] z-10 mb-4">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "#4CAF82" }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <polyline points="14,24 22,32 34,16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      </div>

      <h1 className="text-4xl font-black text-white text-center z-10 mb-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
        Congratulations {firstName}! 🎉
      </h1>
      <p className="text-center z-10 mb-8 animate-fade-in" style={{ color: "#9898B0", animationDelay: "0.4s" }}>
        {isA3
          ? "You've completed the Tixie Orientation — your guided session will be scheduled next."
          : "Your status has been updated and the ops team has been notified."}
      </p>

      {/* Score cards — glassmorphism */}
      <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-lg z-10 animate-fade-in" style={{ animationDelay: "0.5s" }}>
        {[
          { icon: "🏆", value: `${score}%`, label: "Quiz Score" },
          { icon: "📚", value: `${moduleCount}/${moduleCount}`, label: "Modules" },
          { icon: "✅", value: "Cleared", label: "Status" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-4 text-center"
            style={{ background: "rgba(255,255,255,.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.1)" }}
          >
            <p className="text-2xl mb-1">{card.icon}</p>
            <p className="text-xl font-bold text-white">{card.value}</p>
            <p className="text-xs" style={{ color: "#9898B0" }}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* What happens next */}
      <div className="rounded-2xl p-6 w-full max-w-lg z-10 animate-fade-in" style={{ background: "#2A2B3D", border: "1px solid #3A3B50", animationDelay: "0.6s" }}>
        <h2 className="font-bold text-lg mb-4 text-white">What happens next</h2>
        <div className="space-y-3 text-sm" style={{ color: "#9898B0" }}>
          {isA3 && (
            <div className="flex gap-3 items-start p-3 rounded-xl" style={{ background: "#1A2A3A", border: "1px solid #B3D4F0" }}>
              <span className="text-lg shrink-0">📞</span>
              <span style={{ color: "#7BC8F6" }}>
                <strong className="text-white">Next step:</strong> A Jomero team member will reach out to schedule your 1-hour guided session before you begin live purchasing.
              </span>
            </div>
          )}
          <div className="flex gap-3 items-start">
            <Terminal className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#8B50CC" }} />
            <span>Install Tixie via Terminal if you haven't already (Module 1)</span>
          </div>
          <div className="flex gap-3 items-start">
            <Clock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#4CAF82" }} />
            <span>Sessions run Mon–Fri, 6:00 AM – 12:00 PM PST, max 1 hour</span>
          </div>
          <div className="flex gap-3 items-start">
            <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#4CAF82" }} />
            <span>Questions? Email <a href="mailto:gigsupport@jomero.co" className="underline" style={{ color: "#8B50CC" }}>gigsupport@jomero.co</a></span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes morphBlob {
          0%, 100% { border-radius: 50% 40% 60% 50% / 60% 50% 40% 50%; }
          33% { border-radius: 40% 60% 50% 50% / 50% 40% 60% 50%; }
          66% { border-radius: 60% 50% 40% 50% / 50% 60% 50% 40%; }
        }
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          80% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CompletionStep;

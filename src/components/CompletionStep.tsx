import { useEffect, useState } from "react";
import { Mail, Download, Clock, HelpCircle, MessageCircle, Lock } from "lucide-react";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";

interface CompletionStepProps {
  name: string;
  email: string;
  score: number;
  contractorId: string;
  userPath?: string | null;
  moduleCount?: number;
  onBack?: () => void;
}

const isDemoMode = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("demo") === "true";
};

const CompletionStep = ({ name, email, score, contractorId, userPath = null, moduleCount = 3, onBack }: CompletionStepProps) => {
  const firstName = name.split(" ")[0];
  const [sessionRequested, setSessionRequested] = useState(false);
  const [requestingSession, setRequestingSession] = useState(false);
  const [compCode, setCompCode] = useState("");
  const [compUnlocked, setCompUnlocked] = useState(false);
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState("");
  const [compContent, setCompContent] = useState("");

  const handleRequestSession = async () => {
    if (isDemoMode()) {
      setSessionRequested(true);
      return;
    }
    setRequestingSession(true);
    try {
      await supabase.functions.invoke("notify-ops", {
        body: {
          contractorId,
          name,
          email,
          score,
          guidedSessionRequest: true,
        },
      });
      setSessionRequested(true);
    } catch {
      window.open(`mailto:gigsupport@jomero.co?subject=Guided Session Request - ${name}&body=Hi, I just completed the Tixie orientation and would like to schedule a guided 1-hour training session. My email is ${email}. Thanks!`);
    } finally {
      setRequestingSession(false);
    }
  };

  useEffect(() => {
    if (isDemoMode()) return;
    supabase.functions.invoke("notify-ops", {
      body: { contractorId, name, email, score },
    }).catch(() => {});
  }, [contractorId, name, email, score]);

  useEffect(() => {
    const checkUnlock = async () => {
      if (isDemoMode()) return;
      const { data } = await supabase
        .from("compensation_unlocks")
        .select("id")
        .eq("email", email.toLowerCase())
        .limit(1);
      if (data && data.length > 0) {
        setCompUnlocked(true);
        const { data: configData } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "compensation_content")
          .single();
        if (configData) setCompContent(configData.value);
      }
    };
    checkUnlock();
  }, [email]);

  const handleCompCode = async () => {
    setCompLoading(true);
    setCompError("");
    try {
      const { data: codeData } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "compensation_access_code")
        .single();

      if (!codeData || compCode.trim().toUpperCase() !== codeData.value.trim().toUpperCase()) {
        setCompError("Invalid access code. Contact gigsupport@jomero.co for your code.");
        setCompLoading(false);
        return;
      }

      await supabase.from("compensation_unlocks").insert({
        email: email.toLowerCase(),
      });

      const { data: contentData } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "compensation_content")
        .single();
      if (contentData) setCompContent(contentData.value);

      setCompUnlocked(true);
    } catch {
      setCompError("Something went wrong. Try again.");
    } finally {
      setCompLoading(false);
    }
  };

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
        Your status has been updated and the ops team has been notified.
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
          <div className="flex flex-col gap-3 p-3 rounded-xl" style={{ background: "#1A2A3A", border: "1px solid #B3D4F0" }}>
            <div className="flex gap-3 items-start">
              <span className="text-lg shrink-0">📞</span>
              <span style={{ color: "#7BC8F6" }}>
                <strong className="text-white">Need more help?</strong> Request a guided training session with the Jomero team before your first live session.
              </span>
            </div>
            {!sessionRequested ? (
              <button
                onClick={handleRequestSession}
                disabled={requestingSession}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-125 disabled:opacity-60"
                style={{ background: "#8B50CC", color: "#FFFFFF" }}
              >
                {requestingSession ? "Sending..." : "Request Guided Session →"}
              </button>
            ) : (
              <p className="text-sm font-medium" style={{ color: "#4CAF82" }}>
                ✅ Request sent — the Jomero team will reach out to schedule your session
              </p>
            )}
          </div>
          <div className="flex gap-3 items-start">
            <Download className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#8B50CC" }} />
            <span>Download and install Tixie if you haven't already (see Module 1)</span>
          </div>
          <div className="flex gap-3 items-start">
            <Clock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#4CAF82" }} />
            <span>Peak hours are Mon–Fri, 6:00 AM – 12:00 PM PST — you can log in anytime, 10 hr/week max</span>
          </div>
          <div className="flex gap-3 items-start">
            <MessageCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#8B50CC" }} />
            <span>Tixie Chat Support is available Mon–Fri, 8:00 AM – 1:00 PM PST via the Tixie Support icon in the app</span>
          </div>
          <div className="flex gap-3 items-start">
            <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#4CAF82" }} />
            <span>Questions? Email <a href="mailto:gigsupport@jomero.co" className="underline" style={{ color: "#8B50CC" }}>gigsupport@jomero.co</a></span>
          </div>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="w-full mt-4 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-125"
            style={{ background: "#22233A", border: "1px solid #3A3B50", color: "#E8E8F0" }}
          >
            ← Review Training Materials
          </button>
        )}
      </div>

      {/* Compensation Section */}
      <div
        className="rounded-2xl p-6 w-full max-w-lg z-10 mt-4 animate-fade-in"
        style={{ background: "#2A2B3D", border: "1px solid #3A3B50", animationDelay: "0.7s" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">💰</span>
          <h2 className="font-bold text-lg text-white">Compensation & Pay</h2>
        </div>

        {!compUnlocked ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "#9898B0" }}>
              Enter your access code to view compensation details. Your code was provided by the Jomero team.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={compCode}
                onChange={(e) => setCompCode(e.target.value)}
                placeholder="Enter access code"
                className="flex-1 px-3 py-2 rounded-lg text-sm bg-[#1C1D2E] border border-[#3A3B50] text-white placeholder-[#6B6B80] focus:outline-none focus:border-[#8B50CC]"
                onKeyDown={(e) => e.key === "Enter" && handleCompCode()}
              />
              <button
                onClick={handleCompCode}
                disabled={compLoading || !compCode.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-125 disabled:opacity-60 flex items-center gap-1"
                style={{ background: "#8B50CC", color: "#FFFFFF" }}
              >
                <Lock className="w-4 h-4" />
                {compLoading ? "Checking..." : "Unlock"}
              </button>
            </div>
            {compError && (
              <p className="text-sm" style={{ color: "#F87171" }}>{compError}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm" style={{ color: "#4CAF82" }}>
              <span>✅</span>
              <span>Compensation details unlocked</span>
            </div>
            <div
              className="text-sm"
              style={{ color: "#C8C8D0" }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(compContent, { ADD_ATTR: ['target'] }) }}
            />
          </div>
        )}
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

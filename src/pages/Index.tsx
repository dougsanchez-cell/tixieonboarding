import { useState, useEffect, useRef } from "react";

import { supabase } from "@/integrations/supabase/client";
import TixieHeader from "@/components/TixieHeader";
import ProgressBar from "@/components/ProgressBar";
import RegistrationStep from "@/components/RegistrationStep";
import TrainingModules from "@/components/TrainingModules";
import AIChatStep from "@/components/AIChatStep";
import QuizStep from "@/components/QuizStep";
import CompletionStep from "@/components/CompletionStep";
import DemoModeBanner from "@/components/DemoModeBanner";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const STEP_NAMES: Record<number, string> = {
  1: "Registration",
  2: "Training",
  3: "Tixie U",
  4: "Quiz",
  5: "Cleared",
};

const loadProgress = () => {
  try {
    const saved = sessionStorage.getItem("tixie_progress");
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
};

const Index = () => {
  const saved = loadProgress();

  const [step, setStep] = useState(saved?.step || 1);
  const [contractor, setContractor] = useState<Contractor | null>(saved?.contractor || null);
  const [finalScore, setFinalScore] = useState(saved?.finalScore || 0);
  const [reviewMode, setReviewMode] = useState(saved?.reviewMode || false);
  const [isReturningUser, setIsReturningUser] = useState(saved?.isReturningUser || false);
  const [showContact, setShowContact] = useState(false);
  
  const [moduleCount, setModuleCount] = useState(3);
  const [demoMode, setDemoMode] = useState(() => {
    return new URLSearchParams(window.location.search).get("demo") === "true";
  });
  const [userPath] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get("path");
  });

  const prevStepRef = useRef(step);

  // Session event logger
  const logSessionEvent = async (stepName: string, eventType: "enter" | "exit") => {
    if (!contractor || demoMode) return;
    try {
      await supabase.functions.invoke("log-session-event", {
        body: {
          contractorId: contractor.id,
          step: stepName,
          event: eventType,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {} // Fire and forget
  };

  // Log enter/exit on step changes
  useEffect(() => {
    const prevStep = prevStepRef.current;
    if (prevStep !== step && contractor) {
      if (STEP_NAMES[prevStep]) {
        logSessionEvent(STEP_NAMES[prevStep], "exit");
      }
      if (STEP_NAMES[step]) {
        logSessionEvent(STEP_NAMES[step], "enter");
      }
    }
    prevStepRef.current = step;
  }, [step, contractor]);

  // Log enter for initial step after registration
  useEffect(() => {
    if (contractor && step >= 2) {
      logSessionEvent(STEP_NAMES[step], "enter");
    }
  }, [contractor]);

  // Log exit on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (contractor && STEP_NAMES[step] && !demoMode) {
        const payload = JSON.stringify({
          contractorId: contractor.id,
          step: STEP_NAMES[step],
          event: "exit",
          timestamp: new Date().toISOString(),
        });
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-session-event`,
          new Blob([payload], { type: "application/json" })
        );
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [contractor, step, demoMode]);

  // Persist progress to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem("tixie_progress", JSON.stringify({
        step, contractor, finalScore, reviewMode, isReturningUser,
      }));
    } catch {}
  }, [step, contractor, finalScore, reviewMode, isReturningUser]);

  useEffect(() => {
    supabase.from("content_modules").select("id", { count: "exact", head: true }).then(({ count }) => {
      if (count) setModuleCount(count);
    });
  }, []);

  useEffect(() => { setShowContact(false); }, [step]);

  return (
    <div className="min-h-screen bg-background">
      {demoMode && (
        <DemoModeBanner onExit={() => setDemoMode(false)} userPath={userPath} />
      )}
      {isReturningUser && !demoMode && (
        <div className="w-full px-4 py-2 text-xs font-semibold text-center" style={{ backgroundColor: "#4CAF82", color: "#1C1D2E" }}>
          📚 Welcome back — you're reviewing training materials. All content is unlocked.
        </div>
      )}
      <div className={`max-w-5xl mx-auto ${demoMode || isReturningUser ? "pt-8" : ""}`}>
        <TixieHeader />
        <ProgressBar currentStep={step} onStepClick={(s) => setStep(s)} />
{!demoMode && (
          <div className="flex justify-end mb-4 px-4 sm:px-0 relative">
            <button
              onClick={() => setShowContact(!showContact)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:brightness-125"
              style={{ background: "#7B51D3", border: "1px solid #9B71E3", color: "white" }}
            >
              💬 Contact Us
            </button>
            {showContact && (
              <div
                className="absolute top-full right-0 mt-2 w-64 rounded-xl p-4 shadow-lg z-50"
                style={{ background: "#2A2B3D", border: "1px solid #3A3B50" }}
              >
                <p className="text-sm font-semibold text-white mb-1">Need help?</p>
                <p className="text-xs mb-3" style={{ color: "#9898B0" }}>
                  Email us at
                </p>
                <div className="text-sm">
                  <a
                    href="mailto:gigsupport@jomero.co?subject=Tixie Orientation Help"
                    className="flex items-center gap-2 text-[#8B50CC] underline hover:text-[#a76de8]"
                  >
                    ✉️ gigsupport@jomero.co
                  </a>
                </div>
                <button
                  onClick={() => setShowContact(false)}
                  className="mt-3 w-full py-1.5 rounded-lg text-xs font-medium transition-all hover:brightness-125"
                  style={{ background: "#1C1D2E", color: "#9898B0" }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
        <div className="pb-8">
          {step === 1 && (
            <RegistrationStep
              onComplete={(c) => {
                setContractor(c);
                setStep(2);
              }}
              onReturningUser={(c) => {
                setContractor(c);
                setIsReturningUser(true);
                setReviewMode(true);
                setStep(2);
              }}
              demoMode={demoMode}
              userPath={userPath}
            />
          )}
          {step === 2 && <TrainingModules onComplete={() => setStep(3)} demoMode={demoMode} reviewMode={reviewMode} userPath={userPath} />}
          {step === 3 && <AIChatStep onComplete={() => setStep(4)} onBack={() => setStep(2)} demoMode={demoMode} reviewMode={reviewMode} userPath={userPath} />}
          {step === 4 && contractor && (
            <QuizStep
              contractorId={contractor.id}
              onPass={(score) => {
                setFinalScore(score);
                setStep(5);
              }}
              onBack={() => setStep(3)}
              demoMode={demoMode}
            />
          )}
          {step === 5 && contractor && (
            <CompletionStep
              name={contractor.name}
              email={contractor.email}
              score={finalScore}
              contractorId={contractor.id}
              userPath={userPath}
              moduleCount={moduleCount}
              onBack={() => { setReviewMode(true); setStep(2); }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

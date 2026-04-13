import { useState, useEffect } from "react";
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
  const [reviewMode, setReviewMode] = useState(false);
  
  const [moduleCount, setModuleCount] = useState(3);
  const [demoMode, setDemoMode] = useState(() => {
    return new URLSearchParams(window.location.search).get("demo") === "true";
  });
  const [userPath] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get("path");
  });

  // Persist progress to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem("tixie_progress", JSON.stringify({
        step, contractor, finalScore,
      }));
    } catch {}
  }, [step, contractor, finalScore]);

  useEffect(() => {
    supabase.from("content_modules").select("id", { count: "exact", head: true }).then(({ count }) => {
      if (count) setModuleCount(count);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {demoMode && (
        <DemoModeBanner onExit={() => setDemoMode(false)} userPath={userPath} />
      )}
      <div className={`max-w-5xl mx-auto ${demoMode ? "pt-8" : ""}`}>
        <TixieHeader />
        <ProgressBar currentStep={step} onStepClick={(s) => setStep(s)} />
        <div className="pb-8">
          {step === 1 && (
            <RegistrationStep
              onComplete={(c) => {
                setContractor(c);
                setStep(2);
              }}
              demoMode={demoMode}
              userPath={userPath}
            />
          )}
          {step === 2 && <TrainingModules onComplete={() => setStep(3)} demoMode={demoMode || reviewMode} userPath={userPath} />}
          {step === 3 && <AIChatStep onComplete={() => setStep(4)} onBack={() => setStep(2)} demoMode={demoMode || reviewMode} userPath={userPath} />}
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

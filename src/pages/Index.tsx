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

const Index = () => {
  const [step, setStep] = useState(1);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [a3BannerDismissed, setA3BannerDismissed] = useState(false);
  const [moduleCount, setModuleCount] = useState(3);
  const [demoMode, setDemoMode] = useState(() => {
    return new URLSearchParams(window.location.search).get("demo") === "true";
  });
  const [userPath] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get("path");
  });

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
      {userPath === "a3" && !a3BannerDismissed && (
        <div className="w-full px-4 py-3 text-sm flex items-center justify-between"
             style={{ background: "#E6F1FB", color: "#0C447C", borderBottom: "1px solid #B3D4F0" }}>
          <span>📋 You're on the <strong>guided onboarding path</strong> — a 1-hour session with the Jomero team will be scheduled before you begin live purchasing.</span>
          <button onClick={() => setA3BannerDismissed(true)}
                  className="ml-4 font-bold text-lg leading-none opacity-60 hover:opacity-100"
                  style={{ color: "#0C447C" }}>✕</button>
        </div>
      )}
      <div className={`max-w-5xl mx-auto ${demoMode ? "pt-8" : ""}`}>
        <TixieHeader />
        <ProgressBar currentStep={step} />
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
          {step === 2 && <TrainingModules onComplete={() => setStep(3)} demoMode={demoMode} userPath={userPath} />}
          {step === 3 && <AIChatStep onComplete={() => setStep(4)} demoMode={demoMode} userPath={userPath} />}
          {step === 4 && contractor && (
            <QuizStep
              contractorId={contractor.id}
              onPass={(score) => {
                setFinalScore(score);
                setStep(5);
              }}
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
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

import { useState } from "react";
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
  const [demoMode, setDemoMode] = useState(() => {
    return new URLSearchParams(window.location.search).get("demo") === "true";
  });
  const [userPath] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get("path");
  });

  return (
    <div className="min-h-screen bg-background">
      {demoMode && (
        <DemoModeBanner onExit={() => setDemoMode(false)} />
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
          {step === 3 && <AIChatStep onComplete={() => setStep(4)} demoMode={demoMode} />}
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
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

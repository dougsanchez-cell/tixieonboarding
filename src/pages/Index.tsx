import { useState } from "react";
import TixieHeader from "@/components/TixieHeader";
import ProgressBar from "@/components/ProgressBar";
import RegistrationStep from "@/components/RegistrationStep";
import TrainingModules from "@/components/TrainingModules";
import AIChatStep from "@/components/AIChatStep";
import QuizStep from "@/components/QuizStep";
import CompletionStep from "@/components/CompletionStep";

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto">
        <TixieHeader />
        <ProgressBar currentStep={step} />
        <div className="pb-8">
          {step === 1 && (
            <RegistrationStep
              onComplete={(c) => {
                setContractor(c);
                setStep(2);
              }}
            />
          )}
          {step === 2 && <TrainingModules onComplete={() => setStep(3)} />}
          {step === 3 && <AIChatStep onComplete={() => setStep(4)} />}
          {step === 4 && contractor && (
            <QuizStep
              contractorId={contractor.id}
              onPass={(score) => {
                setFinalScore(score);
                setStep(5);
              }}
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

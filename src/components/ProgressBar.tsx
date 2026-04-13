import { Check } from "lucide-react";

const steps = [
  { label: "Register", short: "1" },
  { label: "Training", short: "2" },
  { label: "Tixie U", short: "3" },
  { label: "Quiz", short: "4" },
  { label: "Cleared", short: "5" },
];

interface ProgressBarProps {
  currentStep: number; // 1-5
  onStepClick?: (step: number) => void;
}

const ProgressBar = ({ currentStep, onStepClick }: ProgressBarProps) => (
  <div className="flex items-center justify-center gap-1 sm:gap-2 px-4 pb-4">
    {steps.map((step, i) => {
      const stepNum = i + 1;
      const isComplete = stepNum < currentStep;
      const isCurrent = stepNum === currentStep;
      return (
        <div key={step.label} className="flex items-center gap-1 sm:gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                isComplete
                  ? "bg-success text-success-foreground cursor-pointer hover:ring-2 hover:ring-success/50"
                  : isCurrent
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground"
              }`}
              onClick={() => isComplete && stepNum > 1 && onStepClick?.(stepNum)}
            >
              {isComplete ? <Check className="w-4 h-4" /> : step.short}
            </div>
            <span className={`text-[10px] sm:text-xs font-medium ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 sm:w-10 h-0.5 mb-5 ${isComplete ? "bg-success" : "bg-muted"}`} />
          )}
        </div>
      );
    })}
  </div>
);

export default ProgressBar;

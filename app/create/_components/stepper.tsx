import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  STEP_DEFINITIONS,
  isStepComplete,
  type WizardState,
  type WizardStepId,
} from "./wizard-types";

interface StepperProps {
  state: WizardState;
  onStepClick: (step: WizardStepId) => void;
}

export function Stepper({ state, onStepClick }: StepperProps) {
  const currentIndex = STEP_DEFINITIONS.findIndex(
    (step) => step.id === state.currentStep,
  );
  const progressValue =
    (currentIndex / (STEP_DEFINITIONS.length - 1)) * 100;

  return (
    <div className="flex flex-col gap-3">
      <Progress value={progressValue} />
      <ol className="flex flex-wrap gap-2">
        {STEP_DEFINITIONS.map((step, index) => {
          const complete = isStepComplete(state, step.id);
          const isCurrent = step.id === state.currentStep;
          const reachable = index <= currentIndex;

          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onStepClick(step.id)}
                className={cn(
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  reachable && "cursor-pointer",
                )}
              >
                <Badge
                  variant={complete ? "done" : isCurrent ? "inprogress" : "outline"}
                >
                  {index + 1}. {step.label}
                </Badge>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

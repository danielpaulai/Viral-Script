import { useState, useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wand2, Search, FileText, CheckCircle, Loader2 } from "lucide-react";

interface GenerationStep {
  id: string;
  label: string;
  icon: typeof Wand2;
  description: string;
}

const generationSteps: GenerationStep[] = [
  { id: "init", label: "Initializing", icon: Loader2, description: "Preparing request..." },
  { id: "research", label: "Researching", icon: Search, description: "Gathering insights..." },
  { id: "drafting", label: "Drafting", icon: FileText, description: "Writing script..." },
  { id: "formatting", label: "Polishing", icon: Wand2, description: "Refining your script..." },
];

const completeStep: GenerationStep = {
  id: "complete",
  label: "Complete",
  icon: CheckCircle,
  description: "Script ready!",
};

interface GenerationProgressProps {
  isGenerating: boolean;
  hasResearch?: boolean;
  onComplete?: () => void;
}

export function GenerationProgress({ isGenerating, hasResearch = false, onComplete }: GenerationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const wasGenerating = useRef(false);

  useEffect(() => {
    if (isGenerating) {
      wasGenerating.current = true;
      setShowComplete(false);
      setCurrentStep(0);
      setProgress(0);

      let totalElapsed = 0;

      const interval = setInterval(() => {
        totalElapsed += 100;

        const phase1End = hasResearch ? 2000 : 1000;
        const phase2End = hasResearch ? 6000 : 3500;
        const phase3End = hasResearch ? 12000 : 7000;

        let newProgress: number;
        let newStep: number;

        if (totalElapsed < phase1End) {
          newStep = 0;
          newProgress = (totalElapsed / phase1End) * 20;
        } else if (totalElapsed < phase2End) {
          newStep = 1;
          newProgress = 20 + ((totalElapsed - phase1End) / (phase2End - phase1End)) * 30;
        } else if (totalElapsed < phase3End) {
          newStep = 2;
          newProgress = 50 + ((totalElapsed - phase2End) / (phase3End - phase2End)) * 25;
        } else {
          newStep = 3;
          const overtime = totalElapsed - phase3End;
          const slowApproach = 1 - Math.exp(-overtime / 15000);
          newProgress = 75 + slowApproach * 13;
        }

        setCurrentStep(Math.min(newStep, generationSteps.length - 1));
        setProgress(Math.min(newProgress, 88));
      }, 100);

      return () => clearInterval(interval);
    }

    if (!isGenerating && wasGenerating.current) {
      wasGenerating.current = false;
      setProgress(100);
      setCurrentStep(generationSteps.length);
      setShowComplete(true);
      if (onComplete) {
        setTimeout(onComplete, 500);
      }
    }
  }, [isGenerating, hasResearch, onComplete]);

  if (!isGenerating && !showComplete) return null;

  const isComplete = showComplete && !isGenerating;
  const displaySteps = [...generationSteps, completeStep];
  const currentStepData = isComplete ? completeStep : generationSteps[Math.min(currentStep, generationSteps.length - 1)];
  const StepIcon = currentStepData.icon;

  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 mb-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <StepIcon className={`w-4 h-4 text-primary ${!isComplete ? "animate-spin" : ""}`} />
          <span className="text-sm font-medium text-primary">{currentStepData.label}</span>
          <Badge variant="outline" className="text-[10px]">
            {isComplete
              ? "Done"
              : `Step ${currentStep + 1} of ${generationSteps.length}`}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      
      <Progress value={progress} className="h-2 mb-3" />
      
      <div className="flex items-center justify-between gap-1">
        {displaySteps.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = isComplete ? index === generationSteps.length : index === currentStep;
          const isStepComplete = isComplete ? true : index < currentStep;
          
          return (
            <div
              key={step.id}
              className={`flex items-center gap-1 text-[10px] transition-all ${
                isStepComplete ? "text-green-500" : isCurrent ? "text-primary" : "text-muted-foreground/50"
              }`}
            >
              <Icon className={`w-3 h-3 ${isCurrent && !isComplete ? "animate-pulse" : ""}`} />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          );
        })}
      </div>
      
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {currentStepData.description}
      </p>
    </div>
  );
}

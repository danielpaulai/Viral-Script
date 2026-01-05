import { useState, useEffect } from "react";
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
  { id: "formatting", label: "Formatting", icon: Wand2, description: "Polishing content..." },
  { id: "complete", label: "Complete", icon: CheckCircle, description: "Script ready!" },
];

interface GenerationProgressProps {
  isGenerating: boolean;
  hasResearch?: boolean;
  onComplete?: () => void;
}

export function GenerationProgress({ isGenerating, hasResearch = false, onComplete }: GenerationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    const stepDurations = hasResearch 
      ? [800, 2500, 3000, 1500, 500] 
      : [500, 1000, 2500, 1000, 500];
    
    let totalElapsed = 0;
    const totalDuration = stepDurations.reduce((a, b) => a + b, 0);
    
    const interval = setInterval(() => {
      totalElapsed += 100;
      
      let stepElapsed = 0;
      let stepIndex = 0;
      for (let i = 0; i < stepDurations.length; i++) {
        if (totalElapsed <= stepElapsed + stepDurations[i]) {
          stepIndex = i;
          break;
        }
        stepElapsed += stepDurations[i];
        stepIndex = i + 1;
      }
      
      setCurrentStep(Math.min(stepIndex, generationSteps.length - 1));
      setProgress(Math.min((totalElapsed / totalDuration) * 100, 95));
      
      if (totalElapsed >= totalDuration) {
        setProgress(100);
        setCurrentStep(generationSteps.length - 1);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isGenerating, hasResearch]);

  useEffect(() => {
    if (progress === 100 && onComplete) {
      setTimeout(onComplete, 500);
    }
  }, [progress, onComplete]);

  if (!isGenerating) return null;

  const currentStepData = generationSteps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 mb-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <StepIcon className={`w-4 h-4 text-primary ${currentStep < generationSteps.length - 1 ? "animate-spin" : ""}`} />
          <span className="text-sm font-medium text-primary">{currentStepData.label}</span>
          <Badge variant="outline" className="text-[10px]">
            Step {currentStep + 1} of {generationSteps.length}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      
      <Progress value={progress} className="h-2 mb-3" />
      
      <div className="flex items-center justify-between gap-1">
        {generationSteps.map((step, index) => {
          const Icon = step.icon;
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div
              key={step.id}
              className={`flex items-center gap-1 text-[10px] transition-all ${
                isComplete ? "text-green-500" : isCurrent ? "text-primary" : "text-muted-foreground/50"
              }`}
            >
              <Icon className={`w-3 h-3 ${isCurrent && index < generationSteps.length - 1 ? "animate-pulse" : ""}`} />
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

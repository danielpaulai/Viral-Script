import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wand2, Search, FileText, CheckCircle, Loader2, XCircle, Zap, ShieldCheck } from "lucide-react";

export interface StreamProgress {
  event: string;
  message: string;
  progress?: number;
}

interface GenerationProgressProps {
  isGenerating: boolean;
  streamProgress?: StreamProgress | null;
  onCancel?: () => void;
  hasResearch?: boolean;
  onComplete?: () => void;
}

// Maps SSE event names to display info
const EVENT_DISPLAY: Record<string, { icon: typeof Wand2; label: string; color: string }> = {
  start:                 { icon: Loader2,     label: "Starting",        color: "text-primary" },
  research_start:        { icon: Search,      label: "Researching",     color: "text-blue-500" },
  research_complete:     { icon: Search,      label: "Research Done",   color: "text-blue-400" },
  generation_start:      { icon: Wand2,       label: "Writing Script",  color: "text-primary" },
  generation_progress:   { icon: FileText,    label: "Generating",      color: "text-primary" },
  generation_complete:   { icon: FileText,    label: "Script Written",  color: "text-green-500" },
  validation_start:      { icon: ShieldCheck, label: "Validating",      color: "text-yellow-500" },
  validation_complete:   { icon: ShieldCheck, label: "Validated",       color: "text-green-500" },
  saving_start:          { icon: Zap,         label: "Saving",          color: "text-primary" },
  saving_complete:       { icon: Zap,         label: "Saved",           color: "text-green-500" },
  complete:              { icon: CheckCircle, label: "Complete!",        color: "text-green-500" },
};

export function GenerationProgress({
  isGenerating,
  streamProgress,
  onCancel,
  hasResearch = false,
  onComplete,
}: GenerationProgressProps) {
  if (!isGenerating && !streamProgress) return null;

  const isComplete = streamProgress?.event === "complete";
  const isCancelled = streamProgress?.event === "cancelled";
  const isError = streamProgress?.event === "error";

  const eventInfo = streamProgress?.event
    ? EVENT_DISPLAY[streamProgress.event] ?? EVENT_DISPLAY.generation_progress
    : EVENT_DISPLAY.start;
  const Icon = eventInfo.icon;

  // Compute fallback progress for unknown events
  const progress = streamProgress?.progress ?? (isComplete ? 100 : 5);

  // Show step dots based on progress
  const steps = hasResearch
    ? ["Start", "Research", "Generate", "Validate", "Save"]
    : ["Start", "Generate", "Validate", "Save"];
  const stepIndex = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);

  return (
    <div
      className={`p-4 rounded-lg border mb-4 transition-all ${
        isComplete
          ? "bg-green-500/10 border-green-500/30"
          : isError
          ? "bg-red-500/10 border-red-500/30"
          : "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <Icon
            className={`w-4 h-4 ${eventInfo.color} ${
              isGenerating && !isComplete && !isError ? "animate-spin" : ""
            }`}
          />
          <span className={`text-sm font-medium ${eventInfo.color}`}>
            {eventInfo.label}
          </span>
          {!isComplete && !isError && (
            <Badge variant="outline" className="text-[10px]">
              {streamProgress?.event === "research_start"
                ? "Deep Research"
                : "AI Writing"}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          {isGenerating && !isComplete && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <Progress
        value={progress}
        className={`h-2 mb-3 ${
          isComplete ? "[&>div]:bg-green-500" : isError ? "[&>div]:bg-red-500" : ""
        }`}
      />

      {/* Step dots */}
      <div className="flex items-center justify-between px-1 mb-2">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-col items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full transition-all ${
                index < stepIndex
                  ? "bg-green-500"
                  : index === stepIndex
                  ? "bg-primary scale-125"
                  : "bg-muted-foreground/30"
              }`}
            />
            <span
              className={`text-[9px] hidden sm:block ${
                index <= stepIndex ? "text-foreground" : "text-muted-foreground/40"
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* Status message */}
      <p
        className={`text-xs text-center ${
          isError ? "text-red-400" : "text-muted-foreground"
        }`}
      >
        {isError
          ? (streamProgress?.message || "Generation failed. Please try again.")
          : isCancelled
          ? "Generation cancelled."
          : (streamProgress?.message || "Preparing your script...")}
      </p>
    </div>
  );
}

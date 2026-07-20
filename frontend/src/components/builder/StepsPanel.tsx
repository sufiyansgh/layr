import { Check, Loader2, Circle } from "lucide-react"
import type { BuildStep } from "@/data/mockProject"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface StepsPanelProps {
  prompt: string
  steps: BuildStep[]
  isLoading: boolean
  showHeader?: boolean
}

export function StepsPanel({ prompt, steps, isLoading, showHeader = true }: StepsPanelProps) {
  const doneCount = steps.filter((s) => s.status === "done").length
  const progress = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0
  const isComplete = steps.length > 0 && doneCount === steps.length && !isLoading

  return (
    <div className="flex h-full flex-col bg-card">
      {showHeader && (
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Building
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
            {prompt}
          </p>
        </div>
      )}

      <div className="border-b border-border px-4 py-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {isLoading ? "Generating..." : isComplete ? "Complete" : "Working..."}
          </span>
          <span className="text-xs font-medium tabular-nums text-foreground">
            {progress}%
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-3">
          {steps.length === 0 && isLoading && (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Waiting for AI...
            </div>
          )}
          {steps.map((step, idx) => (
            <StepItem key={step.id} step={step} index={idx} />
          ))}
        </div>
      </ScrollArea>

      {isComplete && (
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5">
            <Check className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium text-foreground">Project ready</p>
              <p className="text-xs text-muted-foreground">
                {steps.length} files generated
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StepItem({ step, index }: { step: BuildStep; index: number }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors",
        step.status === "running" && "bg-primary/5",
        step.status === "done" && "opacity-70",
        step.status === "pending" && "opacity-30"
      )}
    >
      <div className="mt-0.5 shrink-0">
        {step.status === "done" && (
          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary/15">
            <Check className="h-3 w-3 text-primary" />
          </div>
        )}
        {step.status === "running" && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
        {step.status === "pending" && (
          <Circle className="h-4 w-4 text-muted-foreground/30" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium leading-tight",
            step.status === "running" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {step.label}
        </p>
        {step.detail && step.status !== "pending" && (
          <p className="mt-0.5 text-xs text-muted-foreground/60 line-clamp-1">
            {step.detail}
          </p>
        )}
      </div>

      <span className="shrink-0 tabular-nums text-xs text-muted-foreground/30">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  )
}

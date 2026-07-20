import { useEffect, useRef, useState } from "react"
import { RefreshCw, ExternalLink, Monitor, Tablet, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Viewport = "desktop" | "tablet" | "mobile"

const viewportWidths: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
}

interface PreviewPanelProps {
  prompt: string
  previewUrl?: string
}

export function PreviewPanel({ prompt, previewUrl }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const [isLoading, setIsLoading] = useState(true)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (previewUrl) {
      setIsLoading(true)
      return
    }

    setIsLoading(true)
  }, [previewUrl])

  const handleRefresh = () => {
    if (!previewUrl) return
    setIsLoading(true)
    setKey((k) => k + 1)
  }

  return (
    <div className="flex h-full flex-col bg-muted/20">
      {/* Preview toolbar */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
        {/* Viewport toggles */}
        <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 gap-0.5">
          {(
            [
              { id: "desktop", Icon: Monitor },
              { id: "tablet", Icon: Tablet },
              { id: "mobile", Icon: Smartphone },
            ] as { id: Viewport; Icon: React.ElementType }[]
          ).map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => setViewport(id)}
              className={cn(
                "flex h-6 w-7 items-center justify-center rounded transition-colors",
                viewport === id
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={id.charAt(0).toUpperCase() + id.slice(1)}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* Fake address bar */}
        <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1">
          <div className="h-2 w-2 rounded-full bg-green-500/80 shrink-0" />
          <span className="flex-1 text-center text-xs text-muted-foreground font-mono truncate">
            {previewUrl || "Waiting for dev server..."}
          </span>
        </div>

        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={!previewUrl}
          className="h-7 w-7 text-muted-foreground"
          title="Refresh preview"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground"
          disabled={!previewUrl}
          title="Open in new tab"
          onClick={() => {
            if (previewUrl) window.open(previewUrl, "_blank")
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Viewport frame */}
      <div className="flex flex-1 flex-col items-center overflow-auto bg-muted/30 p-4">
        {/* Prompt label */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground/60 truncate max-w-xs">
            Preview: {prompt}
          </span>
          {viewport !== "desktop" && (
            <span className="text-xs text-muted-foreground/40">
              {viewportWidths[viewport]}
            </span>
          )}
        </div>

        {/* Iframe container */}
        <div
          className={cn(
            "relative flex-1 overflow-hidden rounded-xl border border-border bg-[#151516] shadow-lg transition-all duration-300",
            viewport === "desktop" && "w-full",
            viewport === "tablet" && "w-[768px]",
            viewport === "mobile" && "w-[390px]"
          )}
          style={{ minHeight: "500px" }}
        >
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#151516]">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
              <p className="text-xs text-zinc-400">
                {previewUrl ? "Loading preview..." : "Waiting for dev server..."}
              </p>
            </div>
          )}
          {previewUrl && (
            <iframe
              key={key}
              ref={iframeRef}
              src={previewUrl}
              className="h-full w-full border-0"
              style={{ minHeight: "600px" }}
              onLoad={() => setIsLoading(false)}
              title="App preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from "react"
import Editor, { type BeforeMount } from "@monaco-editor/react"
import { FileCode2, Save, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface EditorPanelProps {
  selectedFile: string | null
  fileContents: Record<string, string>
  onFileChange?: (fileId: string, content: string) => void
  theme?: "dark" | "light"
}

const languageMap: Record<string, string> = {
  tsx: "typescript",
  ts: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  css: "css",
  html: "html",
  md: "markdown",
  svg: "xml",
}

function getLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  return languageMap[ext] ?? "plaintext"
}

export function EditorPanel({
  selectedFile,
  fileContents: initialContents,
  onFileChange,
  theme = "dark",
}: EditorPanelProps) {
  const [fileContents, setFileContents] = useState<Record<string, string>>(initialContents)
  const [unsaved, setUnsaved] = useState<Set<string>>(new Set())

  useEffect(() => {
    setFileContents(initialContents)
    setUnsaved(new Set())
  }, [initialContents])

  const content = selectedFile ? (fileContents[selectedFile] ?? "") : null
  const filename = selectedFile?.split("/").pop() ?? ""
  const language = filename ? getLanguage(filename) : "typescript"
  const hasUnsaved = selectedFile ? unsaved.has(selectedFile) : false

  const handleChange = (value: string | undefined) => {
    if (!selectedFile || value === undefined) return
    setFileContents((prev) => ({ ...prev, [selectedFile]: value }))
    setUnsaved((prev) => new Set([...prev, selectedFile]))
    onFileChange?.(selectedFile, value)
  }

  const handleSave = () => {
    if (!selectedFile) return
    setUnsaved((prev) => {
      const next = new Set(prev)
      next.delete(selectedFile)
      return next
    })
  }

  const handleReset = () => {
    if (!selectedFile) return
    const original = initialContents[selectedFile]
    if (original !== undefined) {
      setFileContents((prev) => ({ ...prev, [selectedFile]: original }))
      setUnsaved((prev) => {
        const next = new Set(prev)
        next.delete(selectedFile)
        return next
      })
    }
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  const handleEditorWillMount: BeforeMount = (monaco) => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    })
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    })
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tab bar */}
      <div className="flex h-10 items-center border-b border-border bg-card px-2 gap-1">
        {selectedFile ? (
          <div className="flex items-center gap-1 rounded-md bg-background border border-border px-3 py-1.5 text-xs text-foreground">
            <FileCode2 className="h-3.5 w-3.5 text-blue-400/80 shrink-0" />
            <span className="font-medium">{filename}</span>
            {hasUnsaved && (
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </div>
        ) : (
          <span className="px-3 text-xs text-muted-foreground">No file open</span>
        )}

        {selectedFile && (
          <div className="ml-auto flex items-center gap-1">
            {hasUnsaved && (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={handleReset}
                title="Discard changes"
                className="h-7 w-7"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-7 gap-1.5 px-2 text-xs"
              disabled={!hasUnsaved}
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
              {language}
            </Badge>
          </div>
        )}
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        {content !== null ? (
          <Editor
            height="100%"
            language={language}
            value={content}
            theme={theme === "dark" ? "vs-dark" : "vs"}
            beforeMount={handleEditorWillMount}
            onChange={handleChange}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Menlo', monospace",
              fontLigatures: true,
              lineHeight: 1.7,
              minimap: { enabled: true, scale: 1 },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: "gutter",
              cursorBlinking: "smooth",
              smoothScrolling: true,
              contextmenu: true,
              folding: true,
              lineNumbers: "on",
              glyphMargin: false,
              bracketPairColorization: { enabled: true },
            }}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Status bar */}
      {selectedFile && (
        <div className="flex h-6 items-center border-t border-border bg-card px-4 gap-4">
          <span className="text-[11px] text-muted-foreground/60 font-mono">{selectedFile}</span>
          {hasUnsaved && (
            <span className="text-[11px] text-yellow-500/80">Unsaved changes</span>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/30">
        <FileCode2 className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">No file selected</p>
        <p className="mt-1 text-xs text-muted-foreground/50">
          Click a file in the tree to open it
        </p>
      </div>
    </div>
  )
}

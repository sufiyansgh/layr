import { useState, useEffect } from "react"
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode2,
  FileJson,
  FileText,
  Globe,
  FileType2,
  File,
} from "lucide-react"
import { type FileNode } from "@/data/mockProject"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FileTreePanelProps {
  selectedFile: string | null
  onFileSelect: (fileId: string) => void
  fileTree: FileNode[]
}

export function FileTreePanel({ selectedFile, onFileSelect, fileTree }: FileTreePanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    const folderIds = new Set<string>()
    const collect = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.type === "folder") {
          folderIds.add(n.id)
          if (n.children) collect(n.children)
        }
      }
    }
    collect(fileTree)
    setExpanded(folderIds)
  }, [fileTree])

  const toggleFolder = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center border-b border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Files
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2">
          {fileTree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              expanded={expanded}
              selectedFile={selectedFile}
              onToggle={toggleFolder}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function TreeNode({
  node,
  depth,
  expanded,
  selectedFile,
  onToggle,
  onFileSelect,
}: {
  node: FileNode
  depth: number
  expanded: Set<string>
  selectedFile: string | null
  onToggle: (id: string) => void
  onFileSelect: (id: string) => void
}) {
  const isExpanded = expanded.has(node.id)
  const isSelected = selectedFile === node.id
  const isFolder = node.type === "folder"

  const handleClick = () => {
    if (isFolder) {
      onToggle(node.id)
    } else {
      onFileSelect(node.id)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "group flex w-full items-center gap-1.5 rounded-md py-[5px] pr-3 text-left text-sm transition-colors",
          "hover:bg-accent/60 hover:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground",
          !isSelected && "text-muted-foreground"
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {/* Chevron */}
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {isFolder ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 opacity-60" />
            ) : (
              <ChevronRight className="h-3 w-3 opacity-60" />
            )
          ) : null}
        </span>

        {/* Icon */}
        <span className="shrink-0">
          <FileIcon node={node} isExpanded={isExpanded} isSelected={isSelected} />
        </span>

        {/* Name */}
        <span className="min-w-0 truncate font-medium text-[13px]">{node.name}</span>
      </button>

      {/* Children */}
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedFile={selectedFile}
              onToggle={onToggle}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FileIcon({
  node,
  isExpanded,
  isSelected,
}: {
  node: FileNode
  isExpanded: boolean
  isSelected: boolean
}) {
  if (node.type === "folder") {
    return isExpanded ? (
      <FolderOpen className="h-4 w-4 text-yellow-500/80" />
    ) : (
      <Folder className="h-4 w-4 text-yellow-500/80" />
    )
  }

  const name = node.name.toLowerCase()
  const iconClass = cn("h-4 w-4", isSelected ? "text-accent-foreground" : "text-muted-foreground/60")

  if (name.endsWith(".tsx") || name.endsWith(".ts")) {
    return <FileCode2 className={cn(iconClass, "text-blue-400/80")} />
  }
  if (name.endsWith(".json")) {
    return <FileJson className={cn(iconClass, "text-yellow-400/80")} />
  }
  if (name.endsWith(".css")) {
    return <FileType2 className={cn(iconClass, "text-pink-400/80")} />
  }
  if (name.endsWith(".html")) {
    return <Globe className={cn(iconClass, "text-orange-400/80")} />
  }
  if (name.endsWith(".md")) {
    return <FileText className={iconClass} />
  }
  if (name.endsWith(".svg")) {
    return <Globe className={cn(iconClass, "text-green-400/80")} />
  }

  return <File className={iconClass} />
}

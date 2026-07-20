import type { FileNode, BuildStep } from "@/data/mockProject"

export type GeneratedProject = {
  steps: BuildStep[]
  fileTree: FileNode[]
  fileContents: Record<string, string>
  previewHtml: string
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function generateProject(prompt: string): Promise<GeneratedProject> {
  const url = `${SUPABASE_URL}/functions/v1/generate-project`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ prompt }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Backend error ${res.status}: ${errText}`)
  }

  const data = await res.json()

  return {
    steps: (data.steps ?? []).map((s: any, i: number) => ({
      id: s.id ?? String(i + 1),
      label: s.label ?? "",
      detail: s.detail,
      status: "pending" as const,
    })),
    fileTree: data.fileTree ?? [],
    fileContents: data.fileContents ?? {},
    previewHtml: data.previewHtml ?? "",
  }
}

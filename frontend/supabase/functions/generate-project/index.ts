import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@^0.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are an AI that generates complete, production-ready React + TypeScript + Vite + Tailwind projects from a user's prompt.

You MUST respond with a single JSON object matching this exact schema:
{
  "steps": [{ "id": string, "label": string, "detail": string }],
  "fileTree": [FileNode],
  "fileContents": { "path": string },
  "previewHtml": string
}

FileNode = {
  "id": string (unique, use the full path as id),
  "name": string (filename or folder name),
  "type": "file" | "folder",
  "language": string (for files only: "typescript" | "css" | "json" | "html" | "xml" | "markdown"),
  "children": FileNode[] (for folders only)
}

Rules:
- Generate 6-10 build steps that describe the build progression (analyzing, scaffolding, components, pages, styles, finalize).
- Generate a realistic file tree with src/components, src/pages, src/hooks, plus config files (package.json, tsconfig.json, vite.config.ts, index.html).
- fileContents keys MUST match file ids in the fileTree exactly.
- previewHtml MUST be a single self-contained HTML string (inline CSS, no external scripts) that renders a preview of the generated site. Use plain HTML/CSS — no React, no build step. This will be shown in an iframe.
- Keep file contents realistic but concise. Each file should be complete and syntactically valid.
- Use Tailwind-style utility classes in the React components, but the previewHtml should use plain CSS for the iframe preview.
- Respond with ONLY the JSON object, no markdown fences, no commentary.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY secret not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      messages: [
        { role: "user", content: `${SYSTEM_PROMPT}\n\nUser request: ${prompt}` },
      ],
    });

    const textBlock = message.content.find((b: any) => b.type === "text");
    const raw = textBlock?.text ?? "";

    let parsed: any;
    try {
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      const jsonStr = raw.slice(jsonStart, jsonEnd + 1);
      parsed = JSON.parse(jsonStr);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

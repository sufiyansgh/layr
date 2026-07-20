import fs from "fs";
import dotenv from "dotenv";

// If Render (or similar) provides a secret file, prefer it.
// Secret files on Render are mounted at /etc/secrets/<filename>.
if (fs.existsSync("/etc/secrets/openai.env")) {
    dotenv.config({ path: "/etc/secrets/openai.env" });
} else {
    dotenv.config();
}

import express from "express";
import OpenAI from "openai";
import { BASE_PROMPT, getSystemPrompt } from "./prompts.js";
import { basePrompt as nextjsBasePrompt } from "./defaults/nextjs.js";
import { basePrompt as nodeBasePrompt } from "./defaults/node.js";
import { basePrompt as reactBasePrompt } from "./defaults/react.js";
import { basePrompt as turborepoBasePrompt } from "./defaults/turborepo.js";
import cors from "cors";

const client = new OpenAI();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/template", async (req, res) => {
    const prompt = req.body.prompt;

    const response = await client.responses.create({
        model: "gpt-4o-mini",
        instructions:
            "Classify the user's requested project starter. Return exactly one word: 'react', 'node', 'nextjs', or 'turborepo'. Use 'nextjs' for Next.js apps, SSR apps, app router, full-stack React apps, or requests that mention Next. Use 'turborepo' for monorepos, multiple apps/packages, shared UI packages, pnpm workspaces, or requests that mention Turbo/Turborepo. Use 'node' for backend/API/CLI/server-only apps. Use 'react' for frontend-only SPAs and general React/Vite apps. Do not return anything else.",
        input: prompt,
        max_output_tokens: 20,
    });

    const answer = response.output_text.trim().toLowerCase();

    if (answer === "react") {
        return res.json(createTemplateResponse(reactBasePrompt, [BASE_PROMPT]));
    }

    if (answer === "node") {
        return res.json(createTemplateResponse(nodeBasePrompt));
    }

    if (answer === "nextjs") {
        return res.json(
            createTemplateResponse(nextjsBasePrompt, [BASE_PROMPT]),
        );
    }

    if (answer === "turborepo") {
        return res.json(
            createTemplateResponse(turborepoBasePrompt, [BASE_PROMPT]),
        );
    }

    return res.status(403).json({
        message: "You can't access this",
    });
});

app.post("/chat", async (req, res) => {
    const messages = req.body.messages;

    const stream = await client.responses.create({
        model: "gpt-4o-mini",
        instructions: getSystemPrompt(),
        input: messages,
        stream: true,
        max_output_tokens: 2000,
    });
    for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
            res.write(event.delta);
        }
    }
    res.end();
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

function createTemplateResponse(
    basePrompt: string,
    extraPrompts: string[] = [],
) {
    const contextPrompt = createContextPrompt(basePrompt);

    return {
        prompts: [...extraPrompts, contextPrompt],
        uiPrompts: [basePrompt],
    };
}

function createContextPrompt(basePrompt: string) {
    return `Here is an artifact that contains all files of the project visible to you.
Consider the contents of ALL files in the project.

${basePrompt}

Here is a list of files that exist on the file system but are not being shown to you:

  - .gitignore
  - package-lock.json
`;
}

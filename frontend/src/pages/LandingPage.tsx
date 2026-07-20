import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Zap, Code2, Globe } from "lucide-react";

const suggestions = [
    "Build a SaaS landing page with pricing",
    "Create a dashboard with analytics charts",
    "Make an e-commerce product page",
    "Build a portfolio website",
    "Create a blog with MDX support",
];

const exampleTags = [
    { icon: Zap, label: "Landing page" },
    { icon: Code2, label: "Dashboard" },
    { icon: Globe, label: "Portfolio" },
];

const headlinePrompts = [
    "build today?",
    "ship before coffee?",
    "summon from TypeScript?",
    "compile into reality?",
    "turn into pixels?",
    "debug into existence?",
    "deploy to the timeline?",
    "craft from pure JSX?",
    "make ridiculously useful?",
    "launch from localhost?",
    "teach the browser?",
    "prototype at warp speed?",
    "Ship your next idea.",
    "Build your next product.",
    "Start building.",
    "Design. Build. Ship.",
    "From prompt to production.",
    "Build faster.",
    "Launch your next project.",
    "Prototype in minutes.",
    "Create without limits.",
];

function getRandomHeadlinePrompt() {
    return headlinePrompts[Math.floor(Math.random() * headlinePrompts.length)];
}

export function LandingPage() {
    const [prompt, setPrompt] = useState("");
    const [headlinePrompt] = useState(getRandomHeadlinePrompt);
    const navigate = useNavigate();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (prompt.trim()) {
            navigate("/builder", { state: { prompt } });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSuggestionClick = (s: string) => {
        setPrompt(s);
        textareaRef.current?.focus();
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
            {/* Radial glow behind */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute right-1/4 bottom-1/4 h-72 w-72 rounded-full bg-primary/6 blur-3xl" />
            </div>

            {/* Grid pattern */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                }}
                aria-hidden
            />

            {/* Header */}
            <div className="relative mb-16 text-center">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>LayrAI — Build anything in seconds</span>
                </div>

                <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                    What should we{" "}
                    <span className="relative">
                        <span className="bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
                            {headlinePrompt}
                        </span>
                    </span>
                </h1>

                <p className="mx-auto max-w-md text-base text-muted-foreground">
                    Create stunning apps & websites by chatting with LayrAI.
                </p>
            </div>

            {/* Prompt box */}
            <div className="relative w-full max-w-2xl">
                <form
                    onSubmit={handleSubmit}
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-shadow focus-within:shadow-xl focus-within:ring-1 focus-within:ring-ring/50"
                >
                    <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe what you want to build..."
                        rows={3}
                        className="w-full resize-none bg-transparent px-5 py-4 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    />

                    <div className="flex items-center justify-between border-t border-border px-4 py-3">
                        <div className="flex items-center gap-2">
                            {exampleTags.map(({ icon: Icon, label }) => (
                                <button
                                    type="button"
                                    key={label}
                                    onClick={() => handleSuggestionClick(label)}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-border/60 hover:bg-muted hover:text-foreground"
                                >
                                    <Icon className="h-3 w-3" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={!prompt.trim()}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </form>

                <p className="mt-2 text-center text-xs text-muted-foreground/50">
                    Press Enter to build · Shift+Enter for new line
                </p>
            </div>

            {/* Suggestions */}
            <div className="relative mt-10 w-full max-w-2xl">
                <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground/40">
                    Popular prompts
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => handleSuggestionClick(s)}
                            className="rounded-full border border-border bg-muted/20 px-4 py-1.5 text-sm text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer hint */}
            <p className="relative mt-16 text-xs text-muted-foreground/30">
                Built with React · TypeScript · Vite · Tailwind CSS
            </p>
        </div>
    );
}

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
    ArrowLeft,
    ArrowRight,
    Moon,
    Sun,
    Code2,
    MonitorPlay,
    AlertCircle,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import {
    WebContainer,
    type FileSystemTree,
    type WebContainerProcess,
} from "@webcontainer/api";
import { StepsPanel } from "@/components/builder/StepsPanel";
import { FileTreePanel } from "@/components/builder/FileTreePanel";
import { EditorPanel } from "@/components/builder/EditorPanel";
import { PreviewPanel } from "@/components/builder/PreviewPanel";
import { Button } from "@/components/ui/button";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { BACKEND_URL } from "@/config";
import type { BuildStep, FileNode } from "@/data/mockProject";

type Mode = "code" | "preview";

type GeneratedProject = {
    steps: BuildStep[];
    fileTree: FileNode[];
    fileContents: Record<string, string>;
    previewHtml: string;
};

type RuntimeStatus =
    | "idle"
    | "booting"
    | "installing"
    | "running"
    | "ready"
    | "repairing"
    | "error";

type BoltAction = BuildStep & {
    actionType: "file" | "shell";
    filePath?: string;
    content: string;
};

type BuildTurn = {
    id: string;
    prompt: string;
    steps: BuildStep[];
    kind?: "user" | "repair";
    detail?: string;
};

interface BuilderPageProps {
    prompt: string;
    onBack: () => void;
}

let webcontainerPromise: Promise<WebContainer> | null = null;
const MAX_REPAIR_ATTEMPTS = 5;

export function BuilderPage({ prompt, onBack }: BuilderPageProps) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [mode, setMode] = useState<Mode>("code");
    const { theme, setTheme } = useTheme();

    const [project, setProject] = useState<GeneratedProject | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [followUpPrompt, setFollowUpPrompt] = useState("");
    const [baseMessages, setBaseMessages] = useState<string[]>([]);
    const [buildTurns, setBuildTurns] = useState<BuildTurn[]>([]);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);
    const [previewUrl, setPreviewUrl] = useState("");
    const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>("idle");
    const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
    const followUpIdRef = useRef(0);
    const projectRef = useRef<GeneratedProject | null>(null);
    const devProcessRef = useRef<WebContainerProcess | null>(null);
    const runtimeSignatureRef = useRef("");
    const repairAttemptsRef = useRef(0);

    const init = useCallback(
        async (signal?: AbortSignal) => {
            const initialTurnId = "initial";

            setIsLoading(true);
            setError(null);
            setSelectedFile(null);
            setProject(emptyProject());
            projectRef.current = emptyProject();
            setBuildTurns([
                { id: initialTurnId, prompt: prompt.trim(), steps: [] },
            ]);
            setTerminalLines([]);
            setPreviewUrl("");
            setRuntimeStatus("idle");
            runtimeSignatureRef.current = "";
            repairAttemptsRef.current = 0;

            const response = await axios.post(
                `${BACKEND_URL}/template`,
                {
                    prompt: prompt.trim(),
                },
                {
                    signal,
                },
            );

            if (signal?.aborted) return;

            const { prompts, uiPrompts } = response.data as {
                prompts: string[];
                uiPrompts: string[];
            };
            setBaseMessages(prompts);

            const templateActions = dedupeActions(
                uiPrompts.flatMap((uiPrompt, index) =>
                    parseBoltActions(uiPrompt, `template-${index}`),
                ),
            );
            appendActions(templateActions, initialTurnId);
            await waitForNextPaint();
            for (const action of templateActions) {
                if (signal?.aborted) return;
                await applyAction(action, initialTurnId);
            }

            const chatResponse = await fetch(`${BACKEND_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                signal,
                body: JSON.stringify({
                    messages: [
                        ...prompts.map((content) => ({
                            role: "user",
                            content,
                        })),
                        { role: "user", content: prompt.trim() },
                    ],
                }),
            });

            if (!chatResponse.ok) {
                const errText = await chatResponse.text();
                throw new Error(
                    `Backend error ${chatResponse.status}: ${errText}`,
                );
            }

            await streamAndApplyActions(
                chatResponse,
                signal,
                "generated",
                initialTurnId,
            );
        },
        [prompt],
    );

    const handleFollowUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const nextPrompt = followUpPrompt.trim();
        if (!nextPrompt || isLoading) return;

        const currentProject = projectRef.current ?? project ?? emptyProject();
        const source = `followup-${followUpIdRef.current++}`;

        setFollowUpPrompt("");
        setIsLoading(true);
        setError(null);
        setBuildTurns((currentTurns) => [
            ...currentTurns,
            { id: source, prompt: nextPrompt, steps: [] },
        ]);

        try {
            const chatResponse = await fetch(`${BACKEND_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [
                        ...baseMessages.map((content) => ({
                            role: "user",
                            content,
                        })),
                        {
                            role: "user",
                            content: createCurrentProjectContext(
                                currentProject.fileContents,
                            ),
                        },
                        { role: "user", content: nextPrompt },
                    ],
                }),
            });

            if (!chatResponse.ok) {
                const errText = await chatResponse.text();
                throw new Error(
                    `Backend error ${chatResponse.status}: ${errText}`,
                );
            }

            await streamAndApplyActions(
                chatResponse,
                undefined,
                source,
                source,
            );
        } catch (err: any) {
            setError(err?.message ?? "Failed to update project");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        init(controller.signal)
            .catch((err) => {
                if (controller.signal.aborted) return;
                setError(err?.message ?? "Failed to generate project");
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false);
            });

        return () => {
            controller.abort();
        };
    }, [init]);

    useEffect(() => {
        if (isLoading) return;

        const fileContents =
            projectRef.current?.fileContents ?? project?.fileContents ?? {};
        if (!fileContents["package.json"]) return;

        const signature = createFileSignature(fileContents);
        if (!signature || runtimeSignatureRef.current === signature) return;

        runtimeSignatureRef.current = signature;
        runProjectInWebContainer(fileContents).catch((err) => {
            setRuntimeStatus("error");
            appendTerminal(
                `\n[webcontainer] ${err?.message ?? "Failed to run project"}\n`,
            );
        });
    }, [isLoading, project?.fileContents]);

    const renderWorktop = () =>
        mode === "code" ? (
            <ResizablePanelGroup
                orientation="horizontal"
                defaultLayout={{ files: 33.333, editor: 66.667 }}
                className="h-full"
            >
                <ResizablePanel
                    id="files"
                    minSize="20%"
                    maxSize="55%"
                    className="min-w-0"
                >
                    <div className="h-full overflow-hidden">
                        <FileTreePanel
                            selectedFile={selectedFile}
                            onFileSelect={setSelectedFile}
                            fileTree={project?.fileTree ?? []}
                        />
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />
                <ResizablePanel id="editor" minSize="45%" className="min-w-0">
                    <div className="h-full overflow-hidden">
                        <EditorPanel
                            selectedFile={selectedFile}
                            fileContents={project?.fileContents ?? {}}
                            onFileChange={handleFileChange}
                            theme={resolveEditorTheme(theme)}
                        />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        ) : (
            <div className="h-full overflow-hidden">
                <PreviewPanel prompt={prompt} previewUrl={previewUrl} />
            </div>
        );

    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Top bar */}
            <header className="flex h-11 shrink-0 items-center border-b border-border bg-card px-3 gap-3">
                <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={onBack}
                    className="h-7 w-7 text-muted-foreground"
                    title="Back to home"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-4" />

                <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-primary">
                        <span className="text-[10px] font-bold text-primary-foreground">
                            L
                        </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                        layr
                    </span>
                    <span className="text-xs text-muted-foreground/40">/</span>
                    <span className="max-w-[280px] truncate text-xs text-muted-foreground">
                        {prompt}
                    </span>
                </div>

                <div className="mx-auto flex items-center rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5">
                    <ModeTab
                        active={mode === "code"}
                        onClick={() => setMode("code")}
                        icon={<Code2 className="h-3.5 w-3.5" />}
                        label="Code"
                    />
                    <ModeTab
                        active={mode === "preview"}
                        onClick={() => setMode("preview")}
                        icon={<MonitorPlay className="h-3.5 w-3.5" />}
                        label="Preview"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() =>
                            setTheme(theme === "dark" ? "light" : "dark")
                        }
                        title="Toggle theme"
                    >
                        {theme === "dark" ? (
                            <Sun className="h-3.5 w-3.5" />
                        ) : (
                            <Moon className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </div>
            </header>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{error}</span>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                            init()
                                .catch((err) =>
                                    setError(err?.message ?? "Failed"),
                                )
                                .finally(() => setIsLoading(false));
                        }}
                    >
                        Retry
                    </Button>
                </div>
            )}

            {/* Main panels */}
            <ResizablePanelGroup
                orientation="horizontal"
                defaultLayout={{ builder: 25, workspace: 75 }}
                className="min-h-0 flex-1 overflow-hidden"
            >
                <ResizablePanel
                    id="builder"
                    minSize="18%"
                    maxSize="40%"
                    className="min-w-0"
                >
                    <div className="flex h-full flex-col overflow-hidden border-r border-border bg-card">
                        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                            <div className="space-y-3">
                                {buildTurns.map((turn) => (
                                    <div key={turn.id} className="space-y-2">
                                        <div
                                            className={cn(
                                                "flex",
                                                turn.kind === "repair"
                                                    ? "justify-start"
                                                    : "justify-end",
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "max-w-[85%] rounded-lg border px-3 py-2 text-sm",
                                                    turn.kind === "repair"
                                                        ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300"
                                                        : "border-border bg-muted/50 text-foreground",
                                                )}
                                            >
                                                {turn.prompt}
                                                {turn.detail && (
                                                    <p className="mt-1 line-clamp-3 text-xs opacity-70">
                                                        {turn.detail}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="overflow-hidden rounded-lg border border-border bg-card">
                                            <StepsPanel
                                                prompt={turn.prompt}
                                                steps={turn.steps}
                                                isLoading={
                                                    isLoading &&
                                                    turn.id ===
                                                        buildTurns[
                                                            buildTurns.length -
                                                                1
                                                        ]?.id
                                                }
                                                showHeader={false}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <form
                            onSubmit={handleFollowUpSubmit}
                            className="shrink-0 border-t border-border p-3"
                        >
                            <div className="rounded-lg border border-border bg-muted/40 transition focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/40">
                                <textarea
                                    value={followUpPrompt}
                                    onChange={(e) =>
                                        setFollowUpPrompt(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            e.currentTarget.form?.requestSubmit();
                                        }
                                    }}
                                    disabled={isLoading}
                                    placeholder="Describe what you want to change..."
                                    rows={4}
                                    className="min-h-24 w-full resize-none bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                />
                                <div className="flex items-center justify-end border-t border-border px-2.5 py-2">
                                    <Button
                                        type="submit"
                                        size="icon-sm"
                                        disabled={
                                            !followUpPrompt.trim() || isLoading
                                        }
                                        className="h-8 w-8 rounded-full"
                                        title="Send follow-up"
                                    >
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />
                <ResizablePanel
                    id="workspace"
                    minSize="40%"
                    className="min-w-0"
                >
                    {isTerminalCollapsed ? (
                        <div className="flex h-full flex-col overflow-hidden">
                            <div className="min-h-0 flex-1">
                                {renderWorktop()}
                            </div>
                            <TerminalPanel
                                lines={terminalLines}
                                status={runtimeStatus}
                                collapsed
                                onToggle={() => setIsTerminalCollapsed(false)}
                            />
                        </div>
                    ) : (
                        <ResizablePanelGroup
                            orientation="vertical"
                            defaultLayout={{ worktop: 80, runtime: 20 }}
                            className="h-full"
                        >
                            <ResizablePanel
                                id="worktop"
                                minSize="45%"
                                className="min-h-0"
                            >
                                {renderWorktop()}
                            </ResizablePanel>

                            <ResizableHandle withHandle />
                            <ResizablePanel
                                id="runtime"
                                minSize="12%"
                                maxSize="50%"
                                className="min-h-0"
                            >
                                <TerminalPanel
                                    lines={terminalLines}
                                    status={runtimeStatus}
                                    onToggle={() =>
                                        setIsTerminalCollapsed(true)
                                    }
                                />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );

    function appendActions(actions: BoltAction[], turnId: string) {
        if (actions.length === 0) return;

        setProject((currentProject) => {
            const nextProject = currentProject ?? emptyProject();
            const existingStepIds = new Set(
                nextProject.steps.map((step) => step.id),
            );
            const nextSteps = [
                ...nextProject.steps,
                ...actions.filter((action) => !existingStepIds.has(action.id)),
            ];

            const updatedProject = {
                ...nextProject,
                steps: nextSteps,
            };
            projectRef.current = updatedProject;
            return updatedProject;
        });

        setBuildTurns((currentTurns) =>
            currentTurns.map((turn) => {
                if (turn.id !== turnId) return turn;

                const existingStepIds = new Set(
                    turn.steps.map((step) => step.id),
                );
                return {
                    ...turn,
                    steps: [
                        ...turn.steps,
                        ...actions.filter(
                            (action) => !existingStepIds.has(action.id),
                        ),
                    ],
                };
            }),
        );
    }

    async function applyAction(action: BoltAction, turnId: string) {
        setProject((currentProject) =>
            updateStepStatus(currentProject, action.id, "running"),
        );
        updateTurnStepStatus(turnId, action.id, "running");

        if (action.actionType === "file" && action.filePath) {
            const filePath = action.filePath;

            setProject((currentProject) => {
                const nextProject = currentProject ?? emptyProject();
                const fileContents = {
                    ...nextProject.fileContents,
                    [filePath]: action.content,
                };

                const updatedProject = {
                    ...nextProject,
                    fileContents,
                    fileTree: buildFileTree(Object.keys(fileContents)),
                    previewHtml: buildPreviewHtml(fileContents),
                };
                projectRef.current = updatedProject;
                return updatedProject;
            });

            setSelectedFile((currentFile) => currentFile ?? filePath);
        }

        await wait(120);
        setProject((currentProject) =>
            updateStepStatus(currentProject, action.id, "done"),
        );
        updateTurnStepStatus(turnId, action.id, "done");
    }

    async function streamAndApplyActions(
        response: Response,
        signal?: AbortSignal,
        source = "generated",
        turnId = "initial",
    ) {
        if (!response.body) {
            const text = await response.text();
            const actions = parseBoltActions(text, source);
            appendActions(actions, turnId);
            for (const action of actions) {
                if (signal?.aborted) return;
                await applyAction(action, turnId);
            }
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let parsedActionCount = 0;

        while (true) {
            const { value, done } = await reader.read();
            if (done || signal?.aborted) break;

            buffer += decoder.decode(value, { stream: true });
            const actions = parseBoltActions(buffer, source);
            const newActions = actions.slice(parsedActionCount);

            if (newActions.length > 0) {
                parsedActionCount = actions.length;
                appendActions(newActions, turnId);
                await waitForNextPaint();
                for (const action of newActions) {
                    if (signal?.aborted) return;
                    await applyAction(action, turnId);
                }
            }
        }

        buffer += decoder.decode();
        const actions = parseBoltActions(buffer, source);
        const remainingActions = actions.slice(parsedActionCount);

        if (remainingActions.length > 0) {
            appendActions(remainingActions, turnId);
            await waitForNextPaint();
            for (const action of remainingActions) {
                if (signal?.aborted) return;
                await applyAction(action, turnId);
            }
        }
    }

    function updateTurnStepStatus(
        turnId: string,
        stepId: string,
        status: BuildStep["status"],
    ) {
        setBuildTurns((currentTurns) =>
            currentTurns.map((turn) =>
                turn.id === turnId
                    ? {
                          ...turn,
                          steps: turn.steps.map((step) =>
                              step.id === stepId ? { ...step, status } : step,
                          ),
                      }
                    : turn,
            ),
        );
    }

    function handleFileChange(fileId: string, content: string) {
        setProject((currentProject) => {
            const nextProject = currentProject ?? emptyProject();
            const fileContents = {
                ...nextProject.fileContents,
                [fileId]: content,
            };

            const updatedProject = {
                ...nextProject,
                fileContents,
                previewHtml: buildPreviewHtml(fileContents),
            };
            projectRef.current = updatedProject;
            return updatedProject;
        });
    }

    async function runProjectInWebContainer(
        fileContents: Record<string, string>,
    ) {
        if (!crossOriginIsolated) {
            setRuntimeStatus("error");
            appendTerminal(
                "[webcontainer] Browser is not cross-origin isolated. Restart the Vite dev server so the new COOP/COEP headers apply.\n",
            );
            return;
        }

        setRuntimeStatus("booting");
        setPreviewUrl("");
        setTerminalLines([]);
        appendTerminal("[webcontainer] Booting runtime...\n");

        const webcontainer = await getWebContainer();
        devProcessRef.current?.kill();
        devProcessRef.current = null;
        function validateGeneratedFiles(files: Record<string, string>) {
            for (const [path, content] of Object.entries(files)) {
                if (content.includes("```")) {
                    throw new Error(`${path} contains markdown fences`);
                }

                if (path.endsWith(".tsx") && content.includes("<boltAction")) {
                    throw new Error(`${path} still contains boltAction XML`);
                }

                if (path.endsWith(".css") && content.includes("<boltAction")) {
                    throw new Error(`${path} still contains boltAction XML`);
                }
            }
        }
        validateGeneratedFiles(fileContents);
        await webcontainer.mount(fileContentsToWebContainerTree(fileContents));

        setRuntimeStatus("installing");
        appendTerminal("~/project\n› npm install\n");
        const installOutput = await runCommand(
            webcontainer,
            "npm",
            ["install", "--no-progress", "--color=false"],
            true,
        );
        if (installOutput.exitCode !== 0) {
            await repairProjectFromRuntimeError(
                "npm install failed",
                installOutput.output,
            );
            return;
        }

        setRuntimeStatus("running");
        appendTerminal("\n~/project\n› npm run dev\n");

        const serverReady = waitForServerReady(webcontainer);
        let devOutput = "";
        const devProcess = await webcontainer.spawn("npm", ["run", "dev"], {
            terminal: { cols: 100, rows: 24 },
        });
        devProcessRef.current = devProcess;
        pipeProcessOutput(devProcess, true, (chunk) => {
            devOutput += chunk;
        });

        const result = await Promise.race([
            serverReady.then((url) => ({ type: "ready" as const, url })),
            devProcess.exit.then((exitCode) => ({
                type: "exit" as const,
                exitCode,
            })),
            wait(30000).then(() => ({ type: "timeout" as const })),
        ]);

        if (result.type === "ready") {
            setPreviewUrl(result.url);
            setMode("preview");
            setRuntimeStatus("ready");
            appendTerminal(
                `\n[webcontainer] Dev server ready: ${result.url}\n`,
            );
            repairAttemptsRef.current = 0;
            return;
        }

        if (result.type === "exit") {
            await repairProjectFromRuntimeError(
                `npm run dev exited with code ${result.exitCode}`,
                devOutput,
            );
            return;
        }

        await repairProjectFromRuntimeError(
            "Timed out waiting for dev server",
            devOutput,
        );
    }

    async function repairProjectFromRuntimeError(
        reason: string,
        terminalOutput: string,
    ) {
        setRuntimeStatus("repairing");

        if (repairAttemptsRef.current >= MAX_REPAIR_ATTEMPTS) {
            setRuntimeStatus("error");
            appendTerminal(
                `\n[repair] Stopped after ${MAX_REPAIR_ATTEMPTS} repair attempts. Last error: ${reason}\n`,
            );
            return;
        }

        repairAttemptsRef.current += 1;
        const repairTurnId = `repair-${repairAttemptsRef.current}`;
        const diagnosisStepId = `${repairTurnId}-diagnosis`;
        const terminalExcerpt = terminalOutput.slice(-1200).trim();

        appendTerminal(
            `\n[repair] Sending runtime error back to AI: ${reason}\n`,
        );
        setIsLoading(true);
        setBuildTurns((currentTurns) => [
            ...currentTurns,
            {
                id: repairTurnId,
                kind: "repair",
                prompt: `Working on errors (${repairAttemptsRef.current}/${MAX_REPAIR_ATTEMPTS})`,
                detail: `${reason}${terminalExcerpt ? `\n${terminalExcerpt}` : ""}`,
                steps: [
                    {
                        id: diagnosisStepId,
                        label: "Read runtime error",
                        detail: reason,
                        status: "running",
                    },
                ],
            },
        ]);

        try {
            const currentProject = projectRef.current ?? emptyProject();
            const chatResponse = await fetch(`${BACKEND_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [
                        ...baseMessages.map((content) => ({
                            role: "user",
                            content,
                        })),
                        {
                            role: "user",
                            content: createCurrentProjectContext(
                                currentProject.fileContents,
                            ),
                        },
                        {
                            role: "user",
                            content: `The generated project failed to run.\n\nReason: ${reason}\n\nTerminal output:\n${terminalOutput.slice(-6000)}\n\nFix the project. Return only the changed or new files as boltAction entries with full file contents.`,
                        },
                    ],
                }),
            });

            if (!chatResponse.ok) {
                const errText = await chatResponse.text();
                throw new Error(
                    `Backend error ${chatResponse.status}: ${errText}`,
                );
            }

            updateTurnStepStatus(repairTurnId, diagnosisStepId, "done");
            await streamAndApplyActions(
                chatResponse,
                undefined,
                repairTurnId,
                repairTurnId,
            );
        } catch (err: any) {
            setRuntimeStatus("error");
            updateTurnStepStatus(repairTurnId, diagnosisStepId, "done");
            appendTerminal(`\n[repair] ${err?.message ?? "Repair failed"}\n`);
        } finally {
            setIsLoading(false);
        }
    }

    async function runCommand(
        webcontainer: WebContainer,
        command: string,
        args: string[],
        collectOutput = false,
    ) {
        const process = await webcontainer.spawn(command, args, {
            terminal: { cols: 100, rows: 24 },
        });
        let output = "";

        pipeProcessOutput(process, true, (chunk) => {
            if (collectOutput) output += chunk;
        });

        const exitCode = await process.exit;
        return { exitCode, output };
    }

    function pipeProcessOutput(
        process: WebContainerProcess,
        writeToTerminal = true,
        onChunk?: (chunk: string) => void,
    ) {
        process.output.pipeTo(
            new WritableStream({
                write(chunk) {
                    const cleanChunk = cleanTerminalChunk(chunk);
                    onChunk?.(cleanChunk);
                    if (writeToTerminal) appendTerminal(cleanChunk);
                },
            }),
        );
    }

    function waitForServerReady(webcontainer: WebContainer) {
        return new Promise<string>((resolve) => {
            const unsubscribe = webcontainer.on(
                "server-ready",
                (_port, url) => {
                    unsubscribe();
                    resolve(url);
                },
            );
        });
    }

    function appendTerminal(chunk: string) {
        const cleanChunk = cleanTerminalChunk(chunk);
        if (!cleanChunk) return;

        setTerminalLines((currentLines) => {
            const nextLines = [...currentLines, cleanChunk];
            return nextLines.slice(-600);
        });
    }
}
function sanitizeFileContent(content: string): string {
    return content
        .replace(/^```[\w-]*\r?\n/, "")
        .replace(/\r?\n```$/, "")
        .trim();
}

function parseBoltActions(xml: string, source: string): BoltAction[] {
    const actions = [
        ...xml.matchAll(/<boltAction\b([^>]*)>([\s\S]*?)<\/boltAction>/g),
    ];

    return actions.flatMap<BoltAction>((match, index) => {
        const attributes = parseAttributes(match[1]);
        const type = attributes.type;
        const filePath = attributes.filePath;
        const content = sanitizeFileContent(decodeHtmlEntities(match[2]));

        if (type === "file" && filePath) {
            const normalizedPath = normalizeFilePath(filePath);
            return [
                {
                    id: `${source}-file-${index}-${normalizedPath}`,
                    label: `Create ${normalizedPath}`,
                    detail: "Writing file",
                    status: "pending",
                    actionType: "file",
                    filePath: normalizedPath,
                    content,
                },
            ];
        }

        if (type === "shell") {
            return [
                {
                    id: `${source}-shell-${index}`,
                    label: content,
                    detail: "Run command",
                    status: "pending",
                    actionType: "shell",
                    content,
                },
            ];
        }

        return [];
    });
}

function dedupeActions(actions: BoltAction[]): BoltAction[] {
    const seen = new Set<string>();

    return actions.filter((action) => {
        const key =
            action.actionType === "file"
                ? `${action.actionType}:${action.filePath}`
                : `${action.actionType}:${action.content}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function parseAttributes(attributeText: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const matches = attributeText.matchAll(
        /([A-Za-z0-9_-]+)=["']([^"']*)["']/g,
    );

    for (const match of matches) {
        attributes[match[1]] = decodeHtmlEntities(match[2]);
    }

    return attributes;
}

function decodeHtmlEntities(value: string): string {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
}

function normalizeFilePath(filePath: string): string {
    return filePath.replace(/^\.?\//, "");
}

function buildFileTree(paths: string[]): FileNode[] {
    const root: FileNode[] = [];

    for (const path of paths.sort()) {
        const parts = path.split("/").filter(Boolean);
        let level = root;
        let currentPath = "";

        parts.forEach((part, index) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const isFile = index === parts.length - 1;
            let node = level.find((item) => item.name === part);

            if (!node) {
                node = {
                    id: currentPath,
                    name: part,
                    type: isFile ? "file" : "folder",
                    language: isFile ? getLanguage(part) : undefined,
                    children: isFile ? undefined : [],
                };
                level.push(node);
            }

            if (!isFile) {
                node.children ??= [];
                level = node.children;
            }
        });
    }

    return root;
}

function getLanguage(filename: string): string {
    const extension = filename.split(".").pop()?.toLowerCase();
    if (extension === "tsx" || extension === "ts") return "typescript";
    if (extension === "jsx" || extension === "js") return "javascript";
    if (extension === "json") return "json";
    if (extension === "css") return "css";
    if (extension === "html") return "html";
    if (extension === "md") return "markdown";
    if (extension === "svg") return "xml";
    return "plaintext";
}

function emptyProject(): GeneratedProject {
    return {
        steps: [],
        fileTree: [],
        fileContents: {},
        previewHtml: "",
    };
}

function createCurrentProjectContext(
    fileContents: Record<string, string>,
): string {
    const fileEntries = Object.entries(fileContents);

    if (fileEntries.length === 0) {
        return "No files have been generated yet.";
    }

    const files = fileEntries
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([path, content]) => `<file path="${path}">\n${content}\n</file>`)
        .join("\n\n");

    return `Here is the current project state. Use this as the existing context and apply the next user request on top of it. Return only the changed or new files as boltAction entries, with full file contents for each modified file.

${files}`;
}

function getWebContainer() {
    webcontainerPromise ??= WebContainer.boot();
    return webcontainerPromise;
}

function fileContentsToWebContainerTree(
    fileContents: Record<string, string>,
): FileSystemTree {
    const tree: FileSystemTree = {};

    for (const [path, content] of Object.entries(fileContents)) {
        const parts = path.split("/").filter(Boolean);
        let currentTree = tree;

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;

            if (isFile) {
                currentTree[part] = {
                    file: {
                        contents: content,
                    },
                };
                return;
            }

            const existing = currentTree[part];
            if (!existing || !("directory" in existing)) {
                currentTree[part] = {
                    directory: {},
                };
            }

            currentTree = (currentTree[part] as { directory: FileSystemTree })
                .directory;
        });
    }

    return tree;
}

function createFileSignature(fileContents: Record<string, string>): string {
    return Object.entries(fileContents)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
            ([path, content]) =>
                `${path}:${content.length}:${simpleHash(content)}`,
        )
        .join("|");
}

function simpleHash(value: string): number {
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) | 0;
    }

    return hash;
}

function updateStepStatus(
    project: GeneratedProject | null,
    stepId: string,
    status: BuildStep["status"],
): GeneratedProject {
    const nextProject = project ?? emptyProject();

    return {
        ...nextProject,
        steps: nextProject.steps.map((step) =>
            step.id === stepId ? { ...step, status } : step,
        ),
    };
}

function buildPreviewHtml(fileContents: Record<string, string>): string {
    return (
        fileContents["index.html"] ?? fileContents["public/index.html"] ?? ""
    );
}

function TerminalPanel({
    lines,
    status,
    collapsed = false,
    onToggle,
}: {
    lines: string[];
    status: RuntimeStatus;
    collapsed?: boolean;
    onToggle?: () => void;
}) {
    const output =
        lines.length > 0 ? lines.join("") : "Waiting for generated files...";

    if (collapsed) {
        return (
            <div className="flex h-9 shrink-0 items-center justify-between border-t border-border bg-[#151516] px-3">
                <span className="font-mono text-xs text-zinc-300">
                    Terminal
                </span>
                <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="h-7 w-7 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    onClick={onToggle}
                    title="Expand terminal"
                >
                    <ChevronUp className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-hidden border-t border-border bg-[#151516]">
            <div className="flex h-8 items-center justify-end border-b border-zinc-800/90 px-3">
                <span className="mr-2 rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-normal text-zinc-400">
                    {status}
                </span>
                <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="h-7 w-7 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    onClick={onToggle}
                    title="Collapse terminal"
                >
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex h-[calc(100%-2rem)] flex-col overflow-auto px-4 py-3 font-mono text-[12px] leading-relaxed">
                {output.split("\n").map((line, index) => (
                    <TerminalLine
                        key={`${index}-${line}`}
                        line={line}
                        status={status}
                    />
                ))}
            </div>
        </div>
    );
}

function TerminalLine({
    line,
    status,
}: {
    line: string;
    status: RuntimeStatus;
}) {
    if (line.startsWith("~/project")) {
        return <div className="text-sky-400">{line}</div>;
    }

    if (line.startsWith("›")) {
        return (
            <div>
                <span className="text-fuchsia-400">› </span>
                <span className="text-zinc-200">{line.slice(2)}</span>
            </div>
        );
    }

    if (/^\s*(VITE|ready|Local:|Network:|➜)/i.test(line)) {
        return <div className="text-emerald-400">{line}</div>;
    }

    if (/error|failed|exception|warning/i.test(line) || status === "error") {
        return <div className="text-rose-300">{line}</div>;
    }

    return <div className="min-h-[1.35em] text-zinc-300">{line}</div>;
}

function cleanTerminalChunk(chunk: string): string {
    return chunk
        .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "")
        .replace(/\r(?!\n)/g, "\n")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForNextPaint(): Promise<void> {
    return new Promise((resolve) => {
        window.requestAnimationFrame(() => resolve());
    });
}

function resolveEditorTheme(
    theme: "dark" | "light" | "system",
): "dark" | "light" {
    if (theme !== "system") return theme;
    return document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
}

function ModeTab({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all",
                active
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
            )}
        >
            {icon}
            {label}
        </button>
    );
}

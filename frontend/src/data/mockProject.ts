export type FileNode = {
  id: string
  name: string
  type: "file" | "folder"
  language?: string
  children?: FileNode[]
}

export type BuildStep = {
  id: string
  label: string
  detail?: string
  status: "pending" | "running" | "done"
}

export const mockFileTree: FileNode[] = [
  {
    id: "src",
    name: "src",
    type: "folder",
    children: [
      {
        id: "src/components",
        name: "components",
        type: "folder",
        children: [
          { id: "src/components/Button.tsx", name: "Button.tsx", type: "file", language: "typescript" },
          { id: "src/components/Card.tsx", name: "Card.tsx", type: "file", language: "typescript" },
          { id: "src/components/Navbar.tsx", name: "Navbar.tsx", type: "file", language: "typescript" },
          { id: "src/components/Hero.tsx", name: "Hero.tsx", type: "file", language: "typescript" },
          { id: "src/components/Footer.tsx", name: "Footer.tsx", type: "file", language: "typescript" },
        ],
      },
      {
        id: "src/pages",
        name: "pages",
        type: "folder",
        children: [
          { id: "src/pages/Home.tsx", name: "Home.tsx", type: "file", language: "typescript" },
          { id: "src/pages/About.tsx", name: "About.tsx", type: "file", language: "typescript" },
          { id: "src/pages/Contact.tsx", name: "Contact.tsx", type: "file", language: "typescript" },
        ],
      },
      {
        id: "src/hooks",
        name: "hooks",
        type: "folder",
        children: [
          { id: "src/hooks/useTheme.ts", name: "useTheme.ts", type: "file", language: "typescript" },
        ],
      },
      { id: "src/App.tsx", name: "App.tsx", type: "file", language: "typescript" },
      { id: "src/main.tsx", name: "main.tsx", type: "file", language: "typescript" },
      { id: "src/index.css", name: "index.css", type: "file", language: "css" },
    ],
  },
  {
    id: "public",
    name: "public",
    type: "folder",
    children: [
      { id: "public/favicon.svg", name: "favicon.svg", type: "file", language: "xml" },
    ],
  },
  { id: "package.json", name: "package.json", type: "file", language: "json" },
  { id: "tsconfig.json", name: "tsconfig.json", type: "file", language: "json" },
  { id: "vite.config.ts", name: "vite.config.ts", type: "file", language: "typescript" },
  { id: "index.html", name: "index.html", type: "file", language: "html" },
]

export const mockFileContents: Record<string, string> = {
  "src/components/Button.tsx": `import * as React from "react"
import { cn } from "../lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          {
            "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500": variant === "primary",
            "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500": variant === "secondary",
            "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500": variant === "destructive",
            "px-2.5 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
            "opacity-60 cursor-not-allowed": disabled || loading,
          },
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"
`,

  "src/components/Card.tsx": `import * as React from "react"
import { cn } from "../lib/utils"

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-6 shadow-sm", className)}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4", className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children }: CardProps) {
  return (
    <p className={cn("text-sm text-gray-500", className)}>
      {children}
    </p>
  )
}

export function CardContent({ className, children }: CardProps) {
  return (
    <div className={cn("pt-0", className)}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children }: CardProps) {
  return (
    <div className={cn("flex items-center pt-4", className)}>
      {children}
    </div>
  )
}
`,

  "src/components/Navbar.tsx": `import React from "react"
import { Button } from "./Button"

interface NavItem {
  label: string
  href: string
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "/contact" },
]

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600" />
          <span className="text-lg font-bold text-gray-900">Acme</span>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">Log in</Button>
          <Button size="sm">Get started</Button>
        </div>
      </div>
    </nav>
  )
}
`,

  "src/components/Hero.tsx": `import React from "react"
import { Button } from "./Button"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-24 sm:px-6 lg:px-8">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-indigo-100 opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-purple-100 opacity-50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700">
          <span className="mr-2">✨</span> Introducing our new platform
        </div>

        <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Build faster with{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            less effort
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-lg text-gray-500">
          Ship production-ready applications in minutes. Our platform handles the complexity
          so you can focus on what matters most.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg">Start building for free</Button>
          <Button variant="ghost" size="lg">View demo →</Button>
        </div>
      </div>
    </section>
  )
}
`,

  "src/components/Footer.tsx": `import React from "react"

const links = {
  Product: ["Features", "Pricing", "Changelog", "Documentation"],
  Company: ["About", "Blog", "Careers", "Press"],
  Legal: ["Privacy", "Terms", "Cookie Policy"],
}

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-indigo-600" />
              <span className="font-bold text-gray-900">Acme</span>
            </div>
            <p className="text-sm text-gray-500">Building the future, one component at a time.</p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-200 pt-8 text-center">
          <p className="text-sm text-gray-400">© 2025 Acme Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
`,

  "src/pages/Home.tsx": `import React from "react"
import { Navbar } from "../components/Navbar"
import { Hero } from "../components/Hero"
import { Footer } from "../components/Footer"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/Card"

const features = [
  { title: "Lightning Fast", description: "Built on Vite with optimized builds and HMR." },
  { title: "Type Safe", description: "Full TypeScript support with strict mode enabled." },
  { title: "Accessible", description: "WCAG 2.1 AA compliant components out of the box." },
  { title: "Customizable", description: "Easily theme and extend every component." },
  { title: "Responsive", description: "Mobile-first design system that works everywhere." },
  { title: "DX First", description: "Intuitive APIs designed for developer happiness." },
]

export function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />

      <section id="features" className="py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              A complete toolkit for building modern web applications faster than ever.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
`,

  "src/pages/About.tsx": `import React from "react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"

const team = [
  { name: "Sarah Chen", role: "CEO & Co-founder", avatar: "SC" },
  { name: "Marcus Williams", role: "CTO & Co-founder", avatar: "MW" },
  { name: "Elena Rodriguez", role: "Head of Design", avatar: "ER" },
  { name: "James Park", role: "Lead Engineer", avatar: "JP" },
]

export function About() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">About us</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            We're a team of builders passionate about making web development accessible
            and enjoyable for everyone.
          </p>
        </div>

        <section className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our mission</h2>
          <p className="text-gray-600 leading-relaxed">
            At Acme, we believe that great software should be within reach for every developer,
            regardless of experience level. We build tools that bridge the gap between idea and
            production, removing friction without sacrificing quality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Meet the team</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                  {member.avatar}
                </div>
                <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
`,

  "src/pages/Contact.tsx": `import React, { useState } from "react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { Button } from "../components/Button"

export function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Get in touch</h1>
          <p className="text-gray-500">We'd love to hear from you. Send us a message!</p>
        </div>

        {submitted ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-lg font-semibold text-green-900 mb-2">Message sent!</h2>
            <p className="text-green-700 text-sm">We'll get back to you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">Send message</Button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  )
}
`,

  "src/hooks/useTheme.ts": `import { useState, useEffect } from "react"

type Theme = "light" | "dark" | "system"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    return stored ?? "system"
  })

  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", resolvedTheme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme, resolvedTheme])

  return { theme, setTheme, resolvedTheme }
}
`,

  "src/App.tsx": `import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Home } from "./pages/Home"
import { About } from "./pages/About"
import { Contact } from "./pages/Contact"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  )
}
`,

  "src/main.tsx": `import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`,

  "src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    font-family: Inter, system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }
}
`,

  "package.json": `{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.6.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.7.2",
    "vite": "^7.0.0"
  }
}
`,

  "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"]
}
`,

  "vite.config.ts": `import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
`,

  "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,

  "public/favicon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4f46e5">
  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
</svg>
`,
}

export const buildSteps: BuildStep[] = [
  { id: "1", label: "Analyzing prompt", detail: "Understanding your requirements", status: "pending" },
  { id: "2", label: "Planning architecture", detail: "Designing component structure", status: "pending" },
  { id: "3", label: "Creating project scaffold", detail: "Setting up Vite + React + TypeScript", status: "pending" },
  { id: "4", label: "Generating package.json", detail: "Resolving dependencies", status: "pending" },
  { id: "5", label: "Building components", detail: "Button, Card, Navbar, Hero, Footer", status: "pending" },
  { id: "6", label: "Creating pages", detail: "Home, About, Contact", status: "pending" },
  { id: "7", label: "Writing custom hooks", detail: "useTheme and utilities", status: "pending" },
  { id: "8", label: "Configuring routing", detail: "React Router setup", status: "pending" },
  { id: "9", label: "Adding global styles", detail: "Tailwind CSS configuration", status: "pending" },
  { id: "10", label: "Finalizing build", detail: "Project is ready", status: "pending" },
]

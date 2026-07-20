export const basePrompt = `<boltArtifact id="project-import" title="Next.js Project Files"><boltAction type="file" filePath="package.json">{
  "name": "nextjs-starter",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.5",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3"
  }
}
</boltAction><boltAction type="file" filePath="next.config.mjs">/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
</boltAction><boltAction type="file" filePath="tsconfig.json">{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
</boltAction><boltAction type="file" filePath="postcss.config.mjs">const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
</boltAction><boltAction type="file" filePath="tailwind.config.ts">import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
</boltAction><boltAction type="file" filePath="app/globals.css">@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
}
</boltAction><boltAction type="file" filePath="app/layout.tsx">import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js App",
  description: "Generated with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
</boltAction><boltAction type="file" filePath="app/page.tsx">export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Next.js starter</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Start prompting to build your app.</h1>
      </div>
    </main>
  );
}
</boltAction></boltArtifact>`;

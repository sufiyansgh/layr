export const basePrompt = `<boltArtifact id="project-import" title="Turborepo Project Files"><boltAction type="file" filePath="package.json">{
  "name": "turborepo-starter",
  "private": true,
  "packageManager": "pnpm@9.5.0",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.0.9",
    "typescript": "^5.5.3"
  }
}
</boltAction><boltAction type="file" filePath="pnpm-workspace.yaml">packages:
  - "apps/*"
  - "packages/*"
</boltAction><boltAction type="file" filePath="turbo.json">{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
</boltAction><boltAction type="file" filePath="tsconfig.json">{
  "extends": "./packages/typescript-config/base.json"
}
</boltAction><boltAction type="file" filePath="apps/web/package.json">{
  "name": "web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@repo/ui": "workspace:*",
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
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
</boltAction><boltAction type="file" filePath="apps/web/app/globals.css">@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
}
</boltAction><boltAction type="file" filePath="apps/web/app/layout.tsx">import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turborepo Web",
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
</boltAction><boltAction type="file" filePath="apps/web/app/page.tsx">import { Button } from "@repo/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="max-w-xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Turborepo starter</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Build across apps and packages.</h1>
        <div className="mt-8">
          <Button>Shared UI ready</Button>
        </div>
      </div>
    </main>
  );
}
</boltAction><boltAction type="file" filePath="apps/web/next.config.mjs">/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;
</boltAction><boltAction type="file" filePath="apps/web/tailwind.config.ts">import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
</boltAction><boltAction type="file" filePath="apps/web/postcss.config.mjs">const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
</boltAction><boltAction type="file" filePath="apps/web/tsconfig.json">{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
</boltAction><boltAction type="file" filePath="apps/api/package.json">{
  "name": "api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node src/index.js",
    "build": "tsc -p tsconfig.json",
    "lint": "echo \\"No lint configured\\""
  },
  "dependencies": {
    "express": "^4.19.2"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.10",
    "typescript": "^5.5.3"
  }
}
</boltAction><boltAction type="file" filePath="apps/api/src/index.js">import express from "express";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(\`API listening on port \${port}\`);
});
</boltAction><boltAction type="file" filePath="apps/api/tsconfig.json">{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
</boltAction><boltAction type="file" filePath="packages/ui/package.json">{
  "name": "@repo/ui",
  "private": true,
  "type": "module",
  "exports": {
    "./button": "./src/button.tsx"
  },
  "dependencies": {
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@types/react": "^18.3.3",
    "typescript": "^5.5.3"
  }
}
</boltAction><boltAction type="file" filePath="packages/ui/src/button.tsx">import type { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-zinc-200"
    />
  );
}
</boltAction><boltAction type="file" filePath="packages/typescript-config/package.json">{
  "name": "@repo/typescript-config",
  "private": true,
  "version": "0.0.0",
  "exports": {
    "./base.json": "./base.json",
    "./nextjs.json": "./nextjs.json"
  }
}
</boltAction><boltAction type="file" filePath="packages/typescript-config/base.json">{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx"
  }
}
</boltAction><boltAction type="file" filePath="packages/typescript-config/nextjs.json">{
  "extends": "./base.json",
  "compilerOptions": {
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "jsx": "preserve"
  }
}
</boltAction></boltArtifact>`;

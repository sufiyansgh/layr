# Layr

Layr is an AI-powered app builder that turns a simple prompt into a working project experience. Describe what you want to build, and Layr generates a starter app, opens it in a live workspace, and helps you refine it through follow-up prompts.

What begins as a plain idea becomes a polished, editable, and previewable product in minutes.

## Why Layr stands out

Layr combines three powerful experiences into one flow:

- Prompt-to-project generation with AI
- A visual builder experience with file exploration and code editing
- A live preview runtime so you can see results instantly

Instead of staring at a blank editor, you get a guided, interactive workflow that feels closer to a product studio than a traditional code template.

## What you can do with Layr

- Generate starter React, Node, Next.js, or Turborepo-style projects from natural language
- Explore the generated file structure in a builder-style workspace
- Edit files directly inside the app
- Preview changes in real time
- Continue iterating with follow-up prompts and AI-driven fixes

This makes Layr ideal for:

- Rapid prototyping
- Hackathon demos
- Landing pages and SaaS MVPs
- AI-assisted development experiments
- Learning modern app architecture through generated examples

## Architecture at a glance

Layr is split into two main parts:

- Frontend: a polished React + TypeScript experience built with Vite and Tailwind
- Backend: an Express service that uses the OpenAI API to classify prompts, generate project context, and stream AI responses

The frontend also uses WebContainer so projects can be mounted and previewed directly in the browser.

## Tech stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn-style UI primitives
- React Router
- WebContainer API

### Backend

- Node.js
- Express
- OpenAI API
- TypeScript

## Project structure

```text
backend/
  src/
    defaults/
    index.ts
    prompts.ts
frontend/
  src/
    components/
    pages/
    lib/
    data/
```

## Getting started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd layr
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

```bash
cd ../backend
npm install
```

### 4. Configure environment variables

Create a file named `.env` inside the backend directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 5. Start the backend

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:3000`.

### 6. Start the frontend

```bash
cd frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.

## How the experience works

1. You enter a prompt such as “build a modern SaaS landing page” or “create a dashboard with charts”.
2. Layr classifies the request and prepares a fitting project starter.
3. The generated files appear in the builder workspace.
4. You can inspect, modify, and preview the project in real time.
5. Follow-up prompts let you refine the app without starting over.

## Development notes

- The frontend is responsible for presenting the builder UI and runtime preview.
- The backend handles AI prompt classification and streaming responses.
- The app uses WebContainer to simulate a real development environment directly in the browser.

## Roadmap

Future improvements could include:

- Better project templates and presets
- Multi-file editing improvements
- Git integration
- Deployment support
- More robust AI repair flows
- Shared project history and snapshots

## Contributing

Contributions are welcome. If you want to improve Layr, feel free to open an issue or submit a pull request.

## License

This project is open-source and available under the MIT license.

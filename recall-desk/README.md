# RecallDesk AI

Memory-powered customer support agent (hackathon prototype).

**Flow:** Customer message → retrieve memories (Hindsight) → LLM response (Groq) → store conversation.

> Hindsight and Groq are not wired up yet. The chat API currently returns a mock reply.

## Project structure

```
recall-desk/
  client/     React + Vite frontend
  server/     Express backend
  README.md
```

## Prerequisites

- Node.js 18+
- npm

## Setup

### 1. Backend

```bash
cd recall-desk/server
npm install
cp .env.example .env
npm run dev
```

Server runs at **http://localhost:3001**

### 2. Frontend

Open a second terminal:

```bash
cd recall-desk/client
npm install
npm run dev
```

Client runs at **http://localhost:5173**

## Verify the backend

Open a browser or use curl:

```bash
curl http://localhost:3001/api/health
```

Expected:

```json
{ "status": "ok", "message": "RecallDesk AI server is running" }
```

Test the mock chat endpoint:

```bash
curl -X POST http://localhost:3001/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"Hello\"}"
```

Expected: a JSON object with a mock reply (Windows `cmd` uses `^` for line continuation; PowerShell can use a single line).

## Environment variables

Copy `server/.env.example` to `server/.env`. API keys stay on the server only — never put them in the React app.

| Variable        | Purpose                          |
|-----------------|----------------------------------|
| `PORT`          | Backend port (default `3001`)    |
| `GROQ_API_KEY`  | Groq API key (later)             |
| `HINDSIGHT_API_KEY` | Hindsight Cloud key (later)  |

## API

| Method | Path          | Description                |
|--------|---------------|----------------------------|
| GET    | `/api/health` | Health check               |
| POST   | `/api/chat`   | Chat (mock response today) |

## Tech stack

- **Frontend:** React, Vite, JavaScript, [Mantine](https://mantine.dev) UI, Tabler Icons
- **Backend:** Node.js, Express, ES modules, dotenv, CORS
- **AI (planned):** Groq API
- **Memory (planned):** Hindsight Cloud (`@vectorize-io/hindsight-client`)

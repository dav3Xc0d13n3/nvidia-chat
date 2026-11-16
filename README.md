# NVIDIA Chat

A React + TypeScript chat application with NVIDIA NGC API integration and user authentication.

## Features

- 🤖 Chat with NVIDIA models (Llama 3.1, Nemotron, Mixtral, Gemma, Phi)
- 🔐 User authentication (register/login)
- 💾 Local conversation persistence
- 📎 File attachment support
- 🎨 Modern UI with Tailwind CSS
- ⚡ Streaming responses
- 📱 Responsive design

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and add your NVIDIA API key:

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_NVIDIA_API_KEY=your_api_key_from_build_nvidia_com
VITE_NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
VITE_NVIDIA_MODEL=meta/llama-3.1-405b-instruct
```

Get your API key from [build.nvidia.com](https://build.nvidia.com)

### 3. Run development server

```bash
npm run dev
```

Open http://localhost:3000

### 4. Build for production

```bash
npm run build
```

Output in `dist/` folder.

## Deployment on Render

### Option 1: Static Site (Recommended)

1. Push to GitHub
2. Create new **Static Site** on Render
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variables in Render dashboard

### Option 2: With Backend API

For full authentication persistence, deploy a separate backend API (Node.js/Express, Python/FastAPI, etc.) and set `VITE_API_URL` to your backend URL.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_NVIDIA_API_KEY` | Yes | NVIDIA NGC API key |
| `VITE_NVIDIA_BASE_URL` | No | API endpoint (default: https://integrate.api.nvidia.com/v1) |
| `VITE_NVIDIA_MODEL` | No | Model ID (default: meta/llama-3.1-405b-instruct) |
| `VITE_API_URL` | No | Backend API URL for auth |

## Available Models

- `meta/llama-3.1-405b-instruct` - Most capable
- `meta/llama-3.1-70b-instruct` - Balanced
- `meta/llama-3.1-8b-instruct` - Fast
- `nvidia/nemotron-3-ultra` - NVIDIA flagship
- `mistralai/mixtral-8x22b-instruct` - MoE
- `google/gemma-2-27b-it` - Google open model
- `microsoft/phi-3.5-mini-instruct` - Small & capable

Change via `VITE_NVIDIA_MODEL` env var.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- React Router v6
- React Markdown
- Lucide React (icons)

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Route pages
├── stores/         # Zustand stores (auth, chat)
├── types/          # TypeScript types
├── lib/            # Utilities
├── App.tsx         # Routing
└── main.tsx        # Entry point
```

## License

MIT
# Vibe Docs

AI-powered document and presentation creator. Like Cursor, but for docs and slides.

**No code editor. Just chat and see your beautiful output.**

## Features

- **AI Chat Interface** - Describe what you want, get it instantly
- **Live Preview** - See your document/slides rendered in real-time
- **PDF Export** - Download production-ready PDFs
- **Slides Mode** - Create presentations with Polylux
- **Document Mode** - Create professional documents
- **Powered by Grok** - Fast, intelligent code generation

## Quick Start

### Prerequisites

- Node.js 20+
- Typst CLI installed (`curl -fsSL https://typst.community/typst-install/install.sh | sh`)
- Grok API key from [console.x.ai](https://console.x.ai/)

### Setup

```bash
cd vibe-docs

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GROK_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start creating!

### Docker

```bash
# Build and run with Docker
docker compose up --build

# Or with environment variable
GROK_API_KEY=your-key docker compose up --build
```

## How It Works

```
You: "Create a pitch deck for my AI startup that helps doctors"
     ↓
[Grok API] → Generates Typst/Polylux code
     ↓
[Typst Compiler] → Renders to PNG/PDF
     ↓
You: See beautiful slides instantly!
```

## Architecture

```
┌─────────────────────────────────────────────┐
│              Vibe Docs UI                   │
│  ┌─────────────┐    ┌──────────────────┐   │
│  │  Chat       │    │   Live Preview   │   │
│  │  Interface  │    │   (PNG render)   │   │
│  └─────────────┘    └──────────────────┘   │
├─────────────────────────────────────────────┤
│              Next.js API Routes             │
│  /api/generate  │  /api/compile             │
├─────────────────────────────────────────────┤
│   Grok API      │      Typst CLI            │
│  (code gen)     │   (compilation)           │
└─────────────────────────────────────────────┘
```

## API Endpoints

### POST /api/generate

Generate document/slides from natural language.

```json
{
  "prompt": "Create a quarterly report",
  "documentType": "document",
  "existingCode": "optional existing typst code"
}
```

### POST /api/compile

Compile Typst code to PDF or preview images.

```json
{
  "code": "#set page(...)\n...",
  "format": "pdf"
}
```

## Templates

Pre-built templates in `/templates`:

- **slide-themes.typ** - Dark modern, light clean, gradient themes
- **document-templates.typ** - Professional, minimal, technical, resume

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **LLM**: Grok (xAI) for code generation
- **Typesetting**: Typst + Polylux
- **Styling**: Tailwind CSS

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROK_API_KEY` | Your xAI Grok API key | Yes |
| `PORT` | Server port (default: 3000) | No |

## License

MIT

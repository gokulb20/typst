# Office Vibes

AI-powered document and presentation creator. Like Cursor, but for docs and slides.

**No code editor. Just chat and see your beautiful output.**

## Features

- **AI Chat Interface** - Describe what you want, get it instantly
- **Live Preview** - See your document/slides rendered in real-time
- **PDF Export** - Download production-ready PDFs
- **Slides Mode** - Create presentations with Polylux
- **Document Mode** - Create professional documents
- **Image Generation** - AI generates images when you ask
- **Dark Mode** - Beautiful dark theme by default
- **Powered by Grok** - Fast, intelligent code generation

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/gokulb20/typst.git
cd typst/office-vibes
```

### 2. Install Typst CLI

```bash
# macOS/Linux
curl -fsSL https://typst.community/typst-install/install.sh | sh

# Or with Homebrew
brew install typst
```

### 3. Install dependencies & run

```bash
npm install

# Create .env file with your Grok API key
echo "GROK_API_KEY=your-key-here" > .env

# Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start creating!

## How It Works

```
You: "Create a pitch deck for my AI startup with images"
     ↓
[Grok] → Generates Typst/Polylux code
     ↓
[Grok Aurora] → Generates images (when requested)
     ↓
[Typst] → Renders to PNG/PDF
     ↓
You: See beautiful dark-themed slides!
```

## Architecture

```
┌─────────────────────────────────────────────┐
│            Office Vibes UI                  │
│  ┌─────────────┐    ┌──────────────────┐   │
│  │  Chat       │    │   Live Preview   │   │
│  │  Interface  │    │   (PNG render)   │   │
│  └─────────────┘    └──────────────────┘   │
├─────────────────────────────────────────────┤
│              Next.js API Routes             │
│  /api/generate  │  /api/compile             │
├─────────────────────────────────────────────┤
│   Grok API      │      Typst CLI            │
│  (code + img)   │   (compilation)           │
└─────────────────────────────────────────────┘
```

## Try These Prompts

**Slides:**
- "Create a pitch deck for my AI startup"
- "Make a presentation about climate change with images"
- "Build a quarterly business review"

**Documents:**
- "Write a professional proposal"
- "Create a resume for a software engineer"
- "Make a technical specification document"

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **LLM**: Grok 3 (xAI) for code generation
- **Images**: Grok Aurora for image generation
- **Typesetting**: Typst + Polylux
- **Theme**: Dark mode default

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROK_API_KEY` | Your xAI Grok API key | Yes |

Get your API key at [console.x.ai](https://console.x.ai/)

## License

MIT

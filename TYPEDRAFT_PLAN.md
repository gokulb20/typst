# TypeDraft Implementation Plan
## AI-Powered Document Generation Tool

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Frontend** | React + Vite | Popular, rich ecosystem |
| **Typst Code Visibility** | Hidden with toggle | Clean UX, power user option |
| **AI Provider** | x.ai (Grok) | User preference, OpenAI-compatible API |
| **Model** | grok-3-fast (testing), grok-4 (production) | Balance speed/quality |

---

### Current State Analysis

**What Exists:**
- ✅ Typst compiler (Rust) with PDF/HTML/SVG output
- ✅ HTTP server with live reload (`typst-cli/src/server.rs`)
- ✅ Ollama integration for local LLM inference
- ✅ Docker-based deployment infrastructure
- ✅ Template system via `typst init`
- ✅ Continue.dev AI prompts for Typst generation

**What's Missing for TypeDraft:**
- ❌ Consumer-facing web UI (current is VS Code IDE)
- ❌ Template gallery with visual previews
- ❌ Chat-based iteration interface
- ❌ Direct content → PDF pipeline
- ❌ WASM-based in-browser compilation

---

## Architecture Decision

### Option A: Server-Side Rendering (Recommended for MVP)
```
┌─────────────────────────────────────────────────────────────┐
│                      TypeDraft Web App                       │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React/Vite)          │  Backend (Rust/Actix)     │
│  ├─ Content Input               │  ├─ /api/generate         │
│  ├─ Template Selector           │  │   └─ x.ai → Typst      │
│  ├─ Chat Interface              │  ├─ /api/compile          │
│  ├─ PDF Preview (iframe/embed)  │  │   └─ Typst → PDF       │
│  └─ Export Button               │  ├─ /api/iterate          │
│                                 │  │   └─ Chat refinements  │
│                                 │  └─ /api/templates        │
│                                 │      └─ Template gallery  │
└─────────────────────────────────────────────────────────────┘
```

**Pros:** Leverages existing Rust Typst compiler, simpler initial setup
**Cons:** Requires server, slightly slower iteration

### Option B: WASM-Based (Future Enhancement)
Compile Typst to WASM for in-browser rendering (Typst already supports this).

---

## Implementation Phases

### Phase 1: Backend API (Week 1)
**Location:** `/home/user/typst/typedraft-api/`

#### 1.1 Project Structure
```
typedraft-api/
├── Cargo.toml
├── src/
│   ├── main.rs              # Actix-web server
│   ├── routes/
│   │   ├── mod.rs
│   │   ├── generate.rs      # AI generation endpoint
│   │   ├── compile.rs       # Typst → PDF compilation
│   │   ├── iterate.rs       # Chat refinement
│   │   └── templates.rs     # Template CRUD
│   ├── services/
│   │   ├── mod.rs
│   │   ├── ollama.rs        # LLM integration
│   │   ├── compiler.rs      # Typst compilation
│   │   └── validator.rs     # Typst syntax validation
│   └── templates/
│       └── mod.rs           # Template definitions
├── templates/               # Pre-built .typ templates
│   ├── resume/
│   ├── proposal/
│   ├── invoice/
│   ├── report/
│   └── one-pager/
└── Dockerfile
```

#### 1.2 Core Endpoints

**POST /api/generate**
```json
// Request
{
  "content": "Raw text content...",
  "template": "proposal",
  "instructions": "Make it professional, blue accent color"
}

// Response
{
  "typst_code": "#set page(...)...",
  "pdf_url": "/api/preview/abc123.pdf",
  "session_id": "abc123"
}
```

**POST /api/iterate**
```json
// Request
{
  "session_id": "abc123",
  "message": "Make the header bigger and add more whitespace"
}

// Response
{
  "typst_code": "...",
  "pdf_url": "/api/preview/abc123.pdf",
  "changes": ["Increased header font size to 24pt", "Added 1em paragraph spacing"]
}
```

**GET /api/templates**
```json
// Response
{
  "templates": [
    {
      "id": "resume",
      "name": "Professional Resume",
      "description": "Clean, modern resume layout",
      "preview_url": "/templates/resume/preview.png",
      "fields": ["name", "title", "experience", "education", "skills"]
    },
    ...
  ]
}
```

**POST /api/compile**
```json
// Request
{
  "typst_code": "#set page(...)..."
}

// Response
{
  "pdf_url": "/api/preview/xyz789.pdf",
  "errors": []  // or validation errors
}
```

#### 1.3 AI System Prompts

**Generation Prompt:**
```
You are a Typst document generation expert. Given the user's content and template type, generate complete, valid Typst markup.

Template: {template}
Content: {content}
Instructions: {instructions}

Rules:
1. Generate complete, compilable Typst code
2. Use the template's style guide
3. Handle all content gracefully (tables, lists, code blocks)
4. Include proper page setup, fonts, and styling
5. Return ONLY the Typst code, no explanations

Output the Typst code:
```

**Iteration Prompt:**
```
You are editing a Typst document based on user feedback.

Current Typst code:
{current_code}

User request: {user_message}

Generate the updated Typst code with the requested changes. Return ONLY the complete updated code.
```

---

### Phase 2: Frontend App (Week 2)
**Location:** `/home/user/typst/typedraft-web/`

#### 2.1 Project Structure
```
typedraft-web/
├── package.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── ContentInput.tsx      # Textarea with markdown hints
│   │   ├── TemplateSelector.tsx  # Visual template grid
│   │   ├── PDFPreview.tsx        # PDF.js or iframe embed
│   │   ├── ChatPanel.tsx         # Iteration interface
│   │   ├── CodeViewer.tsx        # Optional: show Typst code
│   │   └── ExportButton.tsx
│   ├── hooks/
│   │   ├── useGeneration.ts
│   │   └── useIteration.ts
│   ├── api/
│   │   └── typedraft.ts
│   └── styles/
│       └── globals.css
└── Dockerfile
```

#### 2.2 UI Layout
```
┌──────────────────────────────────────────────────────────────┐
│  TypeDraft                                    [Export PDF] ▼  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────┐  ┌────────────────────────────┐ │
│  │ CONTENT INPUT           │  │ LIVE PREVIEW               │ │
│  │ ┌─────────────────────┐ │  │ ┌────────────────────────┐ │ │
│  │ │ Paste or type your  │ │  │ │                        │ │ │
│  │ │ content here...     │ │  │ │   [PDF Preview]        │ │ │
│  │ │                     │ │  │ │                        │ │ │
│  │ │                     │ │  │ │                        │ │ │
│  │ └─────────────────────┘ │  │ │                        │ │ │
│  │                         │  │ │                        │ │ │
│  │ TEMPLATE                │  │ └────────────────────────┘ │ │
│  │ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │  │                            │ │
│  │ │📄 │ │📋 │ │💼 │ │📊 │ │  │ CHAT                       │ │
│  │ │   │ │   │ │   │ │   │ │  │ ┌────────────────────────┐ │ │
│  │ └───┘ └───┘ └───┘ └───┘ │  │ │ Make the header bigger │ │ │
│  │ Resume Prop Invoice Rep │  │ │ [Send]                 │ │ │
│  │                         │  │ └────────────────────────┘ │ │
│  │ [Generate Document]     │  │                            │ │
│  └─────────────────────────┘  └────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

#### 2.3 Key Components

**ContentInput.tsx**
- Textarea with placeholder hints
- Optional markdown preview
- Character/word count
- "Paste from clipboard" button

**TemplateSelector.tsx**
- Visual grid of template previews
- Template descriptions
- Category filters (Professional, Academic, Personal)

**PDFPreview.tsx**
- Use PDF.js or react-pdf for rendering
- Zoom controls
- Page navigation
- Loading states

**ChatPanel.tsx**
- Message history
- Input field
- "Thinking..." indicator
- Quick suggestions ("Make header bigger", "Add more whitespace")

---

### Phase 3: Templates (Week 2-3)
**Location:** `/home/user/typst/typedraft-api/templates/`

#### 3.1 Template Structure
Each template folder contains:
```
templates/resume/
├── template.typ          # Main Typst template
├── config.json           # Template metadata
├── preview.png           # Visual preview
├── example-content.json  # Sample content for demo
└── style-guide.md        # AI instructions for this template
```

#### 3.2 MVP Templates (5)

**1. Professional Resume**
- Clean single-column layout
- Name, title, contact header
- Experience, education, skills sections
- Accent color customization

**2. Business Proposal**
- Cover page with title
- Table of contents
- Executive summary
- Sections with numbered headings
- Professional footer

**3. Invoice**
- Company header with logo area
- Client details
- Itemized table
- Totals calculation
- Payment terms footer

**4. Report**
- Title page
- Abstract/executive summary
- Numbered sections
- Figure/table captions
- References section

**5. One-Pager**
- Compelling headline
- 2-3 column layout
- Key points with icons
- Call-to-action section
- Contact information

---

### Phase 4: Docker Integration (Week 3)
**Location:** `/home/user/typst/self-hosted-typst-ai/`

#### 4.1 Updated docker-compose.yml
```yaml
services:
  # TypeDraft Frontend
  typedraft-web:
    build:
      context: ../typedraft-web
      dockerfile: Dockerfile
    container_name: typedraft-web
    ports:
      - "${TYPEDRAFT_PORT:-8080}:80"
    networks:
      - typst-network
    depends_on:
      - typedraft-api

  # TypeDraft Backend API
  typedraft-api:
    build:
      context: ../typedraft-api
      dockerfile: Dockerfile
    container_name: typedraft-api
    ports:
      - "${API_PORT:-8081}:8081"
    environment:
      - OLLAMA_URL=http://ollama:11434
      - RUST_LOG=info
    volumes:
      - typedraft-sessions:/app/sessions
    networks:
      - typst-network
    depends_on:
      - ollama

  # Existing Ollama (reuse)
  ollama:
    # ... existing config ...
```

---

### Phase 5: Polish & Testing (Week 3-4)

#### 5.1 Error Handling
- Typst syntax validation before displaying errors to user
- Graceful fallback when AI generates invalid code
- Retry mechanism for LLM timeouts

#### 5.2 Performance
- Session-based caching of compiled PDFs
- Incremental compilation when possible
- Debounced preview updates

#### 5.3 UX Enhancements
- Loading skeletons
- Progress indicators
- Keyboard shortcuts (Cmd+Enter to generate)
- Mobile-responsive layout

---

## File Changes Summary

### New Files to Create
```
typedraft-api/
├── Cargo.toml
├── Dockerfile
└── src/...

typedraft-web/
├── package.json
├── vite.config.ts
└── src/...

typedraft-api/templates/
├── resume/
├── proposal/
├── invoice/
├── report/
└── one-pager/
```

### Files to Modify
```
self-hosted-typst-ai/docker-compose.yml  # Add new services
self-hosted-typst-ai/README.md           # Update documentation
```

---

## Success Criteria

1. **Time to first PDF:** < 60 seconds from paste to download
2. **Iteration speed:** Changes reflected in < 2 seconds
3. **Template coverage:** 5 working templates with previews
4. **Error rate:** < 5% of generations produce invalid Typst

---

## Open Questions for User

1. **Technology choice for frontend:**
   - React (most popular, rich ecosystem)
   - Svelte (lighter, faster)
   - Plain HTML/JS (simplest, no build step)

2. **Code visibility:**
   - Show Typst code in collapsible panel (power users)?
   - Hide completely (simplest UX)?
   - Toggle option?

3. **Authentication:**
   - MVP: None (local only)
   - Future: Simple password protection?
   - Full auth system?

4. **Model preference:**
   - Use existing Slab-Typer (local, specialized)?
   - Add Claude/GPT API option (better quality, requires API key)?
   - Both with toggle?

---

## Recommended Starting Point

**Start with Phase 1.2 (Core Endpoints)** because:
1. Backend can be tested independently via curl
2. Validates the AI → Typst → PDF pipeline
3. Frontend can be built in parallel once API is stable

**First file to create:** `typedraft-api/src/main.rs`

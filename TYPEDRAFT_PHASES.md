# TypeDraft Implementation Phases (Detailed)

## Status Overview

| Phase | Component | Status |
|-------|-----------|--------|
| 0 | x.ai Validation | ✅ Complete |
| 1 | Compilation Service (`/api/compile`) | ✅ Complete |
| 2 | AI Generation Service | 🔲 Next |
| 3 | Template System | 🔲 Pending |
| 4 | React Frontend (Core) | 🔲 Pending |
| 5 | Iteration & Polish | 🔲 Pending |

---

## Phase 2: AI Generation Service

**Goal:** Add `/api/generate` endpoint that uses x.ai to convert raw content into Typst code.

### 2.1 New Files

```
typedraft-api/src/
├── main.rs                    # Update: add generate route
├── routes/
│   ├── mod.rs                 # Route module exports
│   ├── compile.rs             # Extract compile logic (exists)
│   └── generate.rs            # NEW: AI generation endpoint
├── services/
│   ├── mod.rs                 # Service module exports
│   ├── xai.rs                 # NEW: x.ai API client
│   └── prompts.rs             # NEW: System prompts for generation
└── config.rs                  # NEW: Environment config (API keys)
```

### 2.2 API Design

**POST /api/generate**

```typescript
// Request
{
  "content": string,           // Raw text content from user
  "template": string,          // Template ID: "resume" | "invoice" | "proposal" | "report" | "one-pager"
  "instructions"?: string,     // Optional: "blue accent", "modern style", etc.
}

// Response (Success)
{
  "success": true,
  "session_id": "uuid",        // For iteration tracking
  "typst_code": string,        // Generated Typst markup
  "pdf_base64": string,        // Compiled PDF
}

// Response (Error)
{
  "success": false,
  "error": string,
  "stage": "generation" | "compilation"
}
```

### 2.3 x.ai Client Implementation

```rust
// services/xai.rs
pub struct XaiClient {
    api_key: String,
    model: String,           // "grok-3-fast" or "grok-4"
    endpoint: String,        // "https://api.x.ai/v1/chat/completions"
}

impl XaiClient {
    pub async fn generate(&self, prompt: &str) -> Result<String, XaiError>;
}
```

### 2.4 Prompt Engineering

```rust
// services/prompts.rs

pub fn generation_system_prompt(template: &str) -> String {
    format!(r#"You are an expert Typst document generator.

TASK: Generate complete, valid, compilable Typst code for a {template}.

TYPST SYNTAX RULES:
1. Page setup: #set page(paper: "a4", margin: 2cm)
2. Text styling: #set text(font: "Arial", size: 11pt)
3. Headings: = Level 1, == Level 2, === Level 3
4. Bold: *bold*, Italic: _italic_
5. Lists: - bullet or + numbered
6. Tables: #table(columns: 3, [A], [B], [C])
7. Colors: #text(fill: blue)[text]
8. Functions: #let name(params) = {{ body }}

REQUIREMENTS:
- Output ONLY valid Typst code, no explanations
- Include proper #set page() and #set text() declarations
- Handle all content sections appropriately
- Use consistent styling throughout

Generate the Typst code:"#, template = template)
}

pub fn generation_user_prompt(content: &str, instructions: Option<&str>) -> String {
    let mut prompt = format!("Content to format:\n{}\n", content);
    if let Some(inst) = instructions {
        prompt.push_str(&format!("\nStyle instructions: {}", inst));
    }
    prompt
}
```

### 2.5 Session Management

```rust
// Simple in-memory session storage (upgrade to Redis later)
pub struct SessionStore {
    sessions: DashMap<String, Session>,
}

pub struct Session {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub template: String,
    pub original_content: String,
    pub typst_code: String,
    pub messages: Vec<ChatMessage>,  // For iteration history
}
```

### 2.6 Environment Configuration

```bash
# Required environment variables
XAI_API_KEY=xai-...           # x.ai API key
XAI_MODEL=grok-3-fast         # Model to use
TYPEDRAFT_PORT=8082           # Server port
```

### 2.7 Dependencies to Add

```toml
# typedraft-api/Cargo.toml additions
reqwest = { version = "0.11", features = ["json"] }
tokio = { version = "1", features = ["full"] }
uuid = { version = "1", features = ["v4"] }
dashmap = "5"
```

### 2.8 Deliverables Checklist

- [ ] Refactor main.rs into modular routes/services
- [ ] Implement XaiClient with error handling
- [ ] Create generation prompt templates
- [ ] Add session store for tracking conversations
- [ ] POST /api/generate endpoint
- [ ] Environment config loading
- [ ] Unit tests for prompt generation
- [ ] Integration test with mock x.ai

---

## Phase 3: Template System

**Goal:** Create 5 MVP templates with style guides that help the AI generate consistent, high-quality output.

### 3.1 Template Structure

```
typedraft-api/templates/
├── registry.json              # Template metadata registry
├── resume/
│   ├── meta.json              # Template metadata
│   ├── style-guide.md         # AI instructions for this template
│   ├── base.typ               # Base Typst template (optional)
│   ├── example-input.txt      # Sample content for testing
│   └── preview.png            # Visual preview for UI
├── invoice/
│   ├── meta.json
│   ├── style-guide.md
│   ├── base.typ
│   ├── example-input.txt
│   └── preview.png
├── proposal/
│   └── ...
├── report/
│   └── ...
└── one-pager/
    └── ...
```

### 3.2 Template Metadata (meta.json)

```json
{
  "id": "resume",
  "name": "Professional Resume",
  "description": "Clean, modern resume layout with sections for experience, education, and skills",
  "category": "professional",
  "icon": "📄",
  "fields": [
    { "name": "name", "label": "Full Name", "required": true },
    { "name": "title", "label": "Job Title", "required": true },
    { "name": "contact", "label": "Contact Info", "required": true },
    { "name": "experience", "label": "Work Experience", "required": true },
    { "name": "education", "label": "Education", "required": false },
    { "name": "skills", "label": "Skills", "required": false }
  ],
  "style_options": [
    { "id": "accent_color", "label": "Accent Color", "type": "color", "default": "#2b5078" },
    { "id": "layout", "label": "Layout", "type": "select", "options": ["single-column", "two-column"] }
  ]
}
```

### 3.3 Style Guide (style-guide.md)

```markdown
# Resume Template Style Guide

## Visual Design
- Single-column layout, A4 paper
- 1.5cm margins all around
- Primary accent color: configurable (default blue #2b5078)
- Clean sans-serif fonts (Helvetica or Arial)

## Structure
1. **Header**: Name (24pt bold), title (14pt), contact info (10pt)
2. **Sections**: Experience, Education, Skills (in order of importance)
3. **Section headings**: 14pt bold with underline accent
4. **Entry format**: Title + Company | Date (right-aligned)
5. **Bullet points**: Concise, action-verb driven

## Typst Patterns to Use
- `#grid(columns: (1fr, auto))` for date alignment
- `#line(length: 100%, stroke: 0.5pt + accent)` for section dividers
- `#v(0.5em)` between entries

## Content Guidelines
- Keep to 1 page unless 10+ years experience
- Quantify achievements where possible
- Most recent experience first
```

### 3.4 API Endpoints

**GET /api/templates**
```json
{
  "templates": [
    {
      "id": "resume",
      "name": "Professional Resume",
      "description": "...",
      "category": "professional",
      "icon": "📄",
      "preview_url": "/api/templates/resume/preview.png"
    },
    // ... more templates
  ]
}
```

**GET /api/templates/:id**
```json
{
  "id": "resume",
  "name": "Professional Resume",
  "description": "...",
  "fields": [...],
  "style_options": [...],
  "example_input": "Name: John Smith\nTitle: Software Engineer..."
}
```

### 3.5 Template-Aware Generation

```rust
// In generate endpoint, load template style guide
fn load_template_context(template_id: &str) -> Result<TemplateContext, Error> {
    let meta = load_json(&format!("templates/{}/meta.json", template_id))?;
    let style_guide = load_file(&format!("templates/{}/style-guide.md", template_id))?;
    let base_typst = load_file(&format!("templates/{}/base.typ", template_id)).ok();

    Ok(TemplateContext { meta, style_guide, base_typst })
}

// Enhanced system prompt includes style guide
fn enhanced_system_prompt(template: &TemplateContext) -> String {
    format!(
        "{}\n\n## Template Style Guide\n{}",
        base_system_prompt(&template.meta.id),
        template.style_guide
    )
}
```

### 3.6 Deliverables Checklist

- [ ] Create template directory structure
- [ ] Write resume template (meta.json, style-guide.md, example)
- [ ] Write invoice template
- [ ] Write proposal template
- [ ] Write report template
- [ ] Write one-pager template
- [ ] GET /api/templates endpoint
- [ ] GET /api/templates/:id endpoint
- [ ] Generate preview images for each template
- [ ] Integrate style guides into generation prompt

---

## Phase 4: React Frontend (Core)

**Goal:** Build the main user interface for content input, template selection, and PDF preview.

### 4.1 Project Setup

```
typedraft-web/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── Layout/
    │   │   ├── Header.tsx
    │   │   └── Footer.tsx
    │   ├── ContentInput/
    │   │   ├── ContentInput.tsx
    │   │   └── ContentInput.css
    │   ├── TemplateSelector/
    │   │   ├── TemplateSelector.tsx
    │   │   ├── TemplateCard.tsx
    │   │   └── TemplateSelector.css
    │   ├── PdfPreview/
    │   │   ├── PdfPreview.tsx
    │   │   └── PdfPreview.css
    │   ├── CodeViewer/
    │   │   ├── CodeViewer.tsx        # Collapsible Typst code view
    │   │   └── CodeViewer.css
    │   └── ExportButton/
    │       └── ExportButton.tsx
    ├── hooks/
    │   ├── useGenerate.ts
    │   ├── useTemplates.ts
    │   └── useSession.ts
    ├── api/
    │   └── typedraft.ts
    ├── types/
    │   └── index.ts
    └── utils/
        └── pdf.ts
```

### 4.2 Core Components

#### App.tsx (Main Layout)
```
┌──────────────────────────────────────────────────────────────┐
│  TypeDraft                                    [Export PDF ▼] │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┬────────────────────────────────┐│
│  │      INPUT PANEL        │         PREVIEW PANEL          ││
│  │  ┌───────────────────┐  │  ┌──────────────────────────┐  ││
│  │  │   ContentInput    │  │  │                          │  ││
│  │  │                   │  │  │      PDF Preview         │  ││
│  │  │   [Textarea]      │  │  │                          │  ││
│  │  │                   │  │  │                          │  ││
│  │  └───────────────────┘  │  │                          │  ││
│  │                         │  │                          │  ││
│  │  TEMPLATE               │  └──────────────────────────┘  ││
│  │  ┌───┐ ┌───┐ ┌───┐     │                                 ││
│  │  │ 📄│ │ 📋│ │ 💼│     │  [▼ Show Typst Code]            ││
│  │  └───┘ └───┘ └───┘     │  ┌──────────────────────────┐  ││
│  │                         │  │  #set page(...)          │  ││
│  │  [Generate Document]    │  │  = Title                 │  ││
│  └─────────────────────────┴──┴──────────────────────────┴──┘│
└──────────────────────────────────────────────────────────────┘
```

#### ContentInput.tsx
```tsx
interface ContentInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Features:
// - Large textarea with monospace font
// - Character/word count
// - Paste button
// - Clear button
// - Placeholder with example content
```

#### TemplateSelector.tsx
```tsx
interface TemplateSelectorProps {
  templates: Template[];
  selected: string | null;
  onSelect: (templateId: string) => void;
}

// Features:
// - Grid of template cards
// - Visual preview thumbnails
// - Selected state highlight
// - Template description on hover
```

#### PdfPreview.tsx
```tsx
interface PdfPreviewProps {
  pdfBase64: string | null;
  loading: boolean;
  error: string | null;
}

// Features:
// - Render PDF from base64 using PDF.js or <embed>
// - Loading skeleton
// - Error state display
// - Zoom controls (optional)
```

#### CodeViewer.tsx
```tsx
interface CodeViewerProps {
  code: string;
  visible: boolean;
  onToggle: () => void;
}

// Features:
// - Collapsible panel (default: hidden)
// - Syntax highlighting for Typst
// - Copy button
// - Line numbers
```

### 4.3 API Client

```typescript
// api/typedraft.ts

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export async function getTemplates(): Promise<Template[]> {
  const res = await fetch(`${API_BASE}/api/templates`);
  const data = await res.json();
  return data.templates;
}

export async function generateDocument(
  content: string,
  template: string,
  instructions?: string
): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, template, instructions }),
  });
  return res.json();
}

export async function compileTypst(typstCode: string): Promise<CompileResponse> {
  const res = await fetch(`${API_BASE}/api/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ typst_code: typstCode }),
  });
  return res.json();
}
```

### 4.4 State Management

```typescript
// hooks/useGenerate.ts

interface GenerateState {
  content: string;
  template: string | null;
  instructions: string;
  typstCode: string | null;
  pdfBase64: string | null;
  loading: boolean;
  error: string | null;
  sessionId: string | null;
}

export function useGenerate() {
  const [state, setState] = useState<GenerateState>(initialState);

  const generate = async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const result = await generateDocument(state.content, state.template!, state.instructions);
      if (result.success) {
        setState(s => ({
          ...s,
          typstCode: result.typst_code,
          pdfBase64: result.pdf_base64,
          sessionId: result.session_id,
          loading: false,
        }));
      } else {
        setState(s => ({ ...s, error: result.error, loading: false }));
      }
    } catch (err) {
      setState(s => ({ ...s, error: 'Network error', loading: false }));
    }
  };

  return { ...state, setContent, setTemplate, setInstructions, generate };
}
```

### 4.5 Deliverables Checklist

- [ ] Initialize Vite + React + TypeScript project
- [ ] Set up Tailwind CSS (or CSS modules)
- [ ] Create Layout components (Header, Footer)
- [ ] Implement ContentInput with placeholder
- [ ] Implement TemplateSelector with cards
- [ ] Implement PdfPreview with base64 rendering
- [ ] Implement CodeViewer (collapsible)
- [ ] Implement ExportButton (download PDF)
- [ ] Create useGenerate hook
- [ ] Create useTemplates hook
- [ ] API client functions
- [ ] Loading/error states throughout
- [ ] Basic responsive layout

---

## Phase 5: Iteration & Polish

**Goal:** Add chat-based iteration, error handling, performance optimization, and UX polish.

### 5.1 Chat Iteration Endpoint

**POST /api/iterate**
```typescript
// Request
{
  "session_id": "uuid",
  "message": "Make the header bigger and add more whitespace"
}

// Response
{
  "success": true,
  "typst_code": string,
  "pdf_base64": string,
  "changes_summary": string[]  // ["Increased header to 28pt", "Added 1.5em spacing"]
}
```

### 5.2 Chat UI Component

```
┌─────────────────────────────────────────────────┐
│ CHAT                                            │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 🤖 Document generated successfully          │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ 👤 Make the header bigger                   │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🤖 Updated: Header increased to 28pt        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌───────────────────────────────────────┐ [➤]  │
│ │ Type a change request...              │      │
│ └───────────────────────────────────────┘      │
│                                                 │
│ Quick actions:                                  │
│ [More whitespace] [Bigger font] [Different color]│
└─────────────────────────────────────────────────┘
```

### 5.3 Error Recovery

```rust
// services/validator.rs

pub struct TypstValidator;

impl TypstValidator {
    /// Validate Typst code without full compilation
    pub fn validate_syntax(code: &str) -> Result<(), Vec<SyntaxError>>;

    /// Attempt to fix common AI generation errors
    pub fn auto_fix(code: &str) -> String {
        let mut fixed = code.to_string();

        // Remove markdown fences
        fixed = fixed.trim_start_matches("```typst\n").to_string();
        fixed = fixed.trim_end_matches("\n```").to_string();

        // Fix common typos
        fixed = fixed.replace("\\n", "\n");

        fixed
    }
}
```

### 5.4 Performance Optimizations

1. **Debounced preview updates** - Don't recompile on every keystroke
2. **PDF caching** - Cache compiled PDFs by content hash
3. **Font preloading** - Load fonts once at startup
4. **Streaming responses** - Stream PDF as it generates

```rust
// Caching layer
pub struct CompileCache {
    cache: DashMap<u64, Vec<u8>>,  // hash -> pdf bytes
    max_size: usize,
}

impl CompileCache {
    pub fn get_or_compile(&self, code: &str, compiler: &Compiler) -> Vec<u8> {
        let hash = hash(code);
        self.cache.get(&hash).map(|v| v.clone()).unwrap_or_else(|| {
            let pdf = compiler.compile(code);
            self.cache.insert(hash, pdf.clone());
            pdf
        })
    }
}
```

### 5.5 UX Polish

1. **Loading states**
   - Skeleton loaders for PDF preview
   - "Generating..." with progress indicator
   - Disabled buttons during loading

2. **Keyboard shortcuts**
   - `Cmd+Enter` - Generate document
   - `Cmd+S` - Export PDF
   - `Cmd+K` - Toggle code view

3. **Toast notifications**
   - Success: "Document generated!"
   - Error: "Generation failed: {reason}"
   - Info: "PDF exported"

4. **Mobile responsive**
   - Stack panels vertically on mobile
   - Bottom sheet for template selection
   - Pinch-zoom on PDF preview

### 5.6 Docker Integration

```yaml
# docker-compose.yml additions
services:
  typedraft-api:
    build:
      context: ./typedraft-api
      dockerfile: Dockerfile
    environment:
      - XAI_API_KEY=${XAI_API_KEY}
      - XAI_MODEL=grok-3-fast
      - TYPEDRAFT_PORT=8082
    ports:
      - "8082:8082"
    networks:
      - typst-network

  typedraft-web:
    build:
      context: ./typedraft-web
      dockerfile: Dockerfile
    environment:
      - VITE_API_URL=http://typedraft-api:8082
    ports:
      - "8080:80"
    depends_on:
      - typedraft-api
    networks:
      - typst-network
```

### 5.7 Deliverables Checklist

- [ ] POST /api/iterate endpoint
- [ ] Iteration prompt engineering
- [ ] Chat UI component
- [ ] Message history display
- [ ] Quick action buttons
- [ ] Typst syntax validator
- [ ] Auto-fix for common errors
- [ ] PDF compile cache
- [ ] Debounced updates
- [ ] Loading skeletons
- [ ] Keyboard shortcuts
- [ ] Toast notifications
- [ ] Mobile responsive layout
- [ ] Docker compose integration
- [ ] API Dockerfile
- [ ] Web Dockerfile
- [ ] End-to-end testing

---

## Timeline Summary

| Phase | Focus | Key Deliverable |
|-------|-------|-----------------|
| 2 | AI Generation | `/api/generate` with x.ai |
| 3 | Templates | 5 templates with style guides |
| 4 | Frontend | React app with core features |
| 5 | Polish | Iteration, caching, UX |

## Critical Path

```
Phase 2 ──┬──▶ Phase 3 ──┬──▶ Phase 4 ──▶ Phase 5
          │              │
          │              └── (Templates needed for UI)
          │
          └── (Generation needed for templates testing)
```

**Recommended order:** Phase 2 → Phase 3 → Phase 4 → Phase 5

This ensures each phase can be tested before the next depends on it.

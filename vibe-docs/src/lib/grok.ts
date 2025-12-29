// Grok API client for xAI
// Docs: https://docs.x.ai/api

const GROK_API_BASE = 'https://api.x.ai/v1';

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GrokResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function generateTypstCode(
  prompt: string,
  documentType: 'document' | 'slides',
  existingCode?: string
): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey) {
    throw new Error('GROK_API_KEY is not configured');
  }

  const systemPrompt = documentType === 'slides'
    ? getSlideSystemPrompt()
    : getDocumentSystemPrompt();

  const messages: GrokMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (existingCode) {
    messages.push({
      role: 'user',
      content: `Here is the current Typst code:\n\`\`\`typst\n${existingCode}\n\`\`\`\n\nUser request: ${prompt}`,
    });
  } else {
    messages.push({
      role: 'user',
      content: prompt,
    });
  }

  const response = await fetch(`${GROK_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${error}`);
  }

  const data: GrokResponse = await response.json();
  const content = data.choices[0]?.message?.content || '';

  // Extract Typst code from markdown code blocks if present
  const codeMatch = content.match(/```typst\n([\s\S]*?)```/);
  if (codeMatch) {
    return codeMatch[1].trim();
  }

  // If no code block, assume entire response is code
  return content.trim();
}

export async function generateImage(prompt: string): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey) {
    throw new Error('GROK_API_KEY is not configured');
  }

  // Grok's image generation (Aurora) endpoint
  const response = await fetch(`${GROK_API_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-2-image',
      prompt: prompt,
      n: 1,
      response_format: 'url',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok image API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0]?.url || '';
}

function getDocumentSystemPrompt(): string {
  return `You are an expert Typst document generator. Your job is to create beautiful, professional documents using Typst markup.

RULES:
1. ONLY output valid Typst code - no explanations, no markdown
2. Use modern Typst syntax (v0.11+)
3. Create visually appealing layouts with proper spacing
4. Use #set rules for consistent styling
5. Include proper headings, paragraphs, and structure
6. For images, use placeholder: #rect(width: 100%, height: 200pt, fill: luma(240))[Image placeholder]

TYPST BASICS:
- Headings: = Title, == Section, === Subsection
- Bold: *bold*, Italic: _italic_
- Lists: - item or + numbered
- Math: $x^2 + y^2 = z^2$
- Code: \`inline\` or \`\`\`block\`\`\`
- Links: #link("url")[text]
- Images: #image("path.png")
- Tables: #table(columns: 3, [A], [B], [C], ...)

Always output complete, compilable Typst code.`;
}

function getSlideSystemPrompt(): string {
  return `You are an expert Typst presentation generator using Polylux. Create stunning slide decks.

RULES:
1. ONLY output valid Typst code - no explanations
2. Always import polylux: #import "@preview/polylux:0.3.1": *
3. Use #set page(paper: "presentation-16-9") for widescreen
4. Each slide uses #polylux-slide[...]
5. Create visually engaging slides with good typography
6. Use #align, #v, #h for layout
7. For images, use: #rect(width: 100%, height: 60%, fill: luma(240))[Image]

SLIDE STRUCTURE:
\`\`\`typst
#import "@preview/polylux:0.3.1": *
#set page(paper: "presentation-16-9", fill: rgb("#1a1a2e"))
#set text(fill: white, font: "Inter", size: 24pt)

#polylux-slide[
  #align(center + horizon)[
    #text(size: 48pt, weight: "bold")[Title]
  ]
]

#polylux-slide[
  == Slide Title

  - Point one
  - Point two
  - Point three
]
\`\`\`

Create professional, modern presentations with good visual hierarchy.`;
}

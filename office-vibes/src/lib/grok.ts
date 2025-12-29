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

export interface GenerationResult {
  code: string;
  images: { path: string; data: string }[]; // Base64 images
}

export async function generateTypstCode(
  prompt: string,
  documentType: 'document' | 'slides',
  existingCode?: string
): Promise<GenerationResult> {
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
      model: 'grok-3-latest',
      messages,
      temperature: 0.7,
      max_tokens: 8192,
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
  let code = codeMatch ? codeMatch[1].trim() : content.trim();

  // Check if we need to generate images
  const images: { path: string; data: string }[] = [];
  const imagePrompts = extractImagePrompts(prompt, code);

  if (imagePrompts.length > 0) {
    // Generate images in parallel
    const imageResults = await Promise.allSettled(
      imagePrompts.map(async (imgPrompt, index) => {
        const imageData = await generateImage(imgPrompt);
        return { path: `generated-${index + 1}.png`, data: imageData };
      })
    );

    for (const result of imageResults) {
      if (result.status === 'fulfilled' && result.value.data) {
        images.push(result.value);
      }
    }

    // Replace image placeholders in code with actual image paths
    if (images.length > 0) {
      code = replaceImagePlaceholders(code, images);
    }
  }

  return { code, images };
}

function extractImagePrompts(userPrompt: string, code: string): string[] {
  const prompts: string[] = [];

  // Check if user explicitly wants images
  const wantsImages = /\b(image|picture|photo|illustration|graphic|visual|icon|logo|diagram|chart)\b/i.test(userPrompt);

  if (!wantsImages) {
    return prompts;
  }

  // Find image placeholder patterns in generated code
  const placeholderMatches = code.matchAll(/\[(?:Image|IMAGE)(?:\s*(?:placeholder|:))?\s*([^\]]*)\]/gi);

  for (const match of placeholderMatches) {
    const description = match[1]?.trim();
    if (description) {
      prompts.push(`Professional, high-quality image for presentation: ${description}. Clean, modern style, suitable for business presentation.`);
    }
  }

  // If no specific placeholders but user wants images, generate based on context
  if (prompts.length === 0 && wantsImages) {
    // Extract key topics from user prompt
    prompts.push(`Professional, high-quality illustration for: ${userPrompt.slice(0, 200)}. Clean, modern style, suitable for ${code.includes('polylux') ? 'presentation slide' : 'document'}.`);
  }

  return prompts.slice(0, 3); // Limit to 3 images max
}

function replaceImagePlaceholders(code: string, images: { path: string; data: string }[]): string {
  let updatedCode = code;
  let imageIndex = 0;

  // Replace rect placeholders with actual images
  updatedCode = updatedCode.replace(
    /#rect\([^)]*fill:\s*luma\(\d+\)[^)]*\)\[[^\]]*(?:Image|IMAGE)[^\]]*\]/gi,
    () => {
      if (imageIndex < images.length) {
        const img = images[imageIndex++];
        return `#image("${img.path}", width: 100%)`;
      }
      return '#rect(width: 100%, height: 200pt, fill: luma(40))[Image]';
    }
  );

  return updatedCode;
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
      response_format: 'b64_json',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Image generation failed:', error);
    return ''; // Return empty on failure, don't break the flow
  }

  const data = await response.json();
  return data.data[0]?.b64_json || '';
}

function getDocumentSystemPrompt(): string {
  return `You are an expert Typst document generator. Create beautiful, professional documents using Typst markup.

CRITICAL RULES:
1. ONLY output valid Typst code - no explanations, no markdown wrapper
2. Use modern Typst syntax (v0.11+)
3. ALWAYS use dark theme: dark background with light text
4. Create visually stunning layouts with proper spacing

DARK THEME DEFAULTS:
#set page(fill: rgb("#0f0f1a"), margin: 1in)
#set text(fill: rgb("#e4e4e7"), font: "Inter", size: 11pt)
#show heading: set text(fill: rgb("#f4f4f5"))

TYPST BASICS:
- Headings: = Title, == Section, === Subsection
- Bold: *bold*, Italic: _italic_
- Lists: - item or + numbered
- Math: $x^2 + y^2 = z^2$
- Links: #link("url")[text]
- Images: #image("path.png")
- Tables: #table(columns: 3, [A], [B], [C], ...)

For images, use this placeholder pattern:
#rect(width: 100%, height: 200pt, fill: luma(40))[Image: description here]

Output complete, compilable Typst code with dark styling.`;
}

function getSlideSystemPrompt(): string {
  return `You are an expert Typst presentation generator using Polylux. Create stunning dark-themed slide decks.

CRITICAL RULES:
1. ONLY output valid Typst code - no explanations, no markdown
2. Always import polylux: #import "@preview/polylux:0.3.1": *
3. ALWAYS use dark theme - this is mandatory
4. Create visually stunning slides with great typography

MANDATORY DARK THEME STRUCTURE:
\`\`\`typst
#import "@preview/polylux:0.3.1": *

#set page(paper: "presentation-16-9", fill: rgb("#0a0a0f"))
#set text(fill: rgb("#f4f4f5"), font: "Inter", size: 24pt)

#show heading.where(level: 1): set text(fill: rgb("#ffffff"), size: 56pt, weight: "bold")
#show heading.where(level: 2): set text(fill: rgb("#a5b4fc"), size: 40pt, weight: "semibold")

#polylux-slide[
  #align(center + horizon)[
    = Your Title Here
    #v(0.5em)
    #text(size: 28pt, fill: rgb("#9ca3af"))[Subtitle or tagline]
  ]
]

#polylux-slide[
  == Slide Title
  #v(0.5em)

  #text(fill: rgb("#d1d5db"))[
    - First key point
    - Second key point
    - Third key point
  ]
]
\`\`\`

STYLING TIPS:
- Use accent colors: rgb("#6366f1") (indigo), rgb("#8b5cf6") (violet), rgb("#06b6d4") (cyan)
- Gradient backgrounds: fill: gradient.linear(rgb("#1a1a2e"), rgb("#16213e"))
- Subtle borders: stroke: 1pt + rgb("#374151")
- For image placeholders: #rect(width: 100%, height: 60%, fill: luma(30))[Image: description]

Create professional, modern, DARK themed presentations.`;
}

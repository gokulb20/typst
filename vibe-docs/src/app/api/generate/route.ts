import { NextRequest, NextResponse } from 'next/server';
import { generateTypstCode, generateImage } from '@/lib/grok';
import { compileToPages } from '@/lib/typst';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, documentType, existingCode, action } = body;

    // Handle image generation separately
    if (action === 'generate-image') {
      const imageUrl = await generateImage(prompt);
      return NextResponse.json({ imageUrl });
    }

    // Generate Typst code
    const typstCode = await generateTypstCode(prompt, documentType, existingCode);

    // Compile to preview images
    const compiled = await compileToPages(typstCode);

    if (!compiled.success) {
      // Return code anyway, with error
      return NextResponse.json({
        code: typstCode,
        pages: [],
        error: compiled.error,
      });
    }

    return NextResponse.json({
      code: typstCode,
      pages: compiled.pages,
    });
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

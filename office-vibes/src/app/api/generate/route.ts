import { NextRequest, NextResponse } from 'next/server';
import { generateTypstCode, generateImage } from '@/lib/grok';
import { compileToPages } from '@/lib/typst';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, documentType, existingCode, action } = body;

    // Handle standalone image generation
    if (action === 'generate-image') {
      const imageData = await generateImage(prompt);
      return NextResponse.json({ imageData });
    }

    // Generate Typst code (and images if needed)
    const result = await generateTypstCode(prompt, documentType, existingCode);

    // Compile to preview images, passing any generated images
    const compiled = await compileToPages(result.code, { images: result.images });

    if (!compiled.success) {
      // Return code anyway, with error
      return NextResponse.json({
        code: result.code,
        pages: [],
        error: compiled.error,
        imagesGenerated: result.images.length,
      });
    }

    return NextResponse.json({
      code: result.code,
      pages: compiled.pages,
      imagesGenerated: result.images.length,
    });
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

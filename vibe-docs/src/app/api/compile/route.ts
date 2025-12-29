import { NextRequest, NextResponse } from 'next/server';
import { compileToPages, compileTypst } from '@/lib/typst';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, format } = body;

    if (format === 'pdf') {
      const result = await compileTypst(code, 'pdf');
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return new NextResponse(result.pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="document.pdf"',
        },
      });
    }

    // Default: compile to preview pages
    const result = await compileToPages(code);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ pages: result.pages });
  } catch (error: any) {
    console.error('Compile error:', error);
    return NextResponse.json(
      { error: error.message || 'Compilation failed' },
      { status: 500 }
    );
  }
}

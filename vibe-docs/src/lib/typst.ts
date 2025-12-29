// Typst compilation utilities
// Uses typst CLI on server or WASM in browser (future)

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

const TEMP_DIR = '/tmp/vibe-docs';

export interface CompileResult {
  success: boolean;
  pdf?: Buffer;
  png?: Buffer;
  svg?: string;
  error?: string;
}

export async function ensureTempDir(): Promise<void> {
  try {
    await mkdir(TEMP_DIR, { recursive: true });
  } catch (e) {
    // Directory exists
  }
}

export async function compileTypst(
  code: string,
  format: 'pdf' | 'png' | 'svg' = 'png'
): Promise<CompileResult> {
  await ensureTempDir();

  const id = randomUUID();
  const inputPath = join(TEMP_DIR, `${id}.typ`);
  const outputPath = join(TEMP_DIR, `${id}.${format}`);

  try {
    // Write the Typst source
    await writeFile(inputPath, code, 'utf-8');

    // Compile with typst CLI
    const cmd = format === 'png'
      ? `typst compile "${inputPath}" "${outputPath}" --format png --ppi 144`
      : `typst compile "${inputPath}" "${outputPath}"`;

    await execAsync(cmd, { timeout: 30000 });

    // Read the output
    if (format === 'svg') {
      const svg = await readFile(outputPath, 'utf-8');
      return { success: true, svg };
    } else {
      const buffer = await readFile(outputPath);
      return format === 'pdf'
        ? { success: true, pdf: buffer }
        : { success: true, png: buffer };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.stderr || error.message || 'Compilation failed',
    };
  } finally {
    // Cleanup
    try {
      await unlink(inputPath);
      await unlink(outputPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

export async function compileToPages(code: string): Promise<{
  success: boolean;
  pages?: string[]; // Base64 encoded PNGs
  error?: string;
}> {
  await ensureTempDir();

  const id = randomUUID();
  const inputPath = join(TEMP_DIR, `${id}.typ`);
  const outputPattern = join(TEMP_DIR, `${id}-{n}.png`);

  try {
    await writeFile(inputPath, code, 'utf-8');

    // Compile all pages
    await execAsync(
      `typst compile "${inputPath}" "${outputPattern}" --format png --ppi 144`,
      { timeout: 60000 }
    );

    // Find all generated pages
    const { stdout } = await execAsync(`ls ${TEMP_DIR}/${id}-*.png 2>/dev/null || true`);
    const pageFiles = stdout.trim().split('\n').filter(Boolean).sort();

    if (pageFiles.length === 0) {
      // Single page output (no pattern expansion)
      const singleOutput = join(TEMP_DIR, `${id}-{n}.png`);
      try {
        const buffer = await readFile(singleOutput);
        return {
          success: true,
          pages: [buffer.toString('base64')]
        };
      } catch {
        return { success: false, error: 'No output generated' };
      }
    }

    const pages: string[] = [];
    for (const file of pageFiles) {
      const buffer = await readFile(file);
      pages.push(buffer.toString('base64'));
      await unlink(file);
    }

    return { success: true, pages };
  } catch (error: any) {
    return {
      success: false,
      error: error.stderr || error.message || 'Compilation failed',
    };
  } finally {
    try {
      await unlink(inputPath);
    } catch (e) {}
  }
}

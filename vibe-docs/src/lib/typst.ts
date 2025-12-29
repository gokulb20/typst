// Typst compilation utilities
// Uses typst CLI on server

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink, mkdir, readdir, rm } from 'fs/promises';
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

export interface CompileOptions {
  images?: { path: string; data: string }[]; // Base64 images to save
}

export async function ensureTempDir(): Promise<void> {
  try {
    await mkdir(TEMP_DIR, { recursive: true });
  } catch (e) {
    // Directory exists
  }
}

async function saveImages(projectDir: string, images: { path: string; data: string }[]): Promise<void> {
  for (const img of images) {
    if (!img.data) continue;
    const imgPath = join(projectDir, img.path);
    const buffer = Buffer.from(img.data, 'base64');
    await writeFile(imgPath, buffer);
  }
}

async function cleanupProjectDir(projectDir: string): Promise<void> {
  try {
    await rm(projectDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}

export async function compileTypst(
  code: string,
  format: 'pdf' | 'png' | 'svg' = 'png',
  options: CompileOptions = {}
): Promise<CompileResult> {
  await ensureTempDir();

  const id = randomUUID();
  const projectDir = join(TEMP_DIR, id);
  await mkdir(projectDir, { recursive: true });

  const inputPath = join(projectDir, 'main.typ');
  const outputPath = join(projectDir, `output.${format}`);

  try {
    // Save images if provided
    if (options.images && options.images.length > 0) {
      await saveImages(projectDir, options.images);
    }

    // Write the Typst source
    await writeFile(inputPath, code, 'utf-8');

    // Compile with typst CLI
    const cmd = format === 'png'
      ? `typst compile "${inputPath}" "${outputPath}" --format png --ppi 144`
      : `typst compile "${inputPath}" "${outputPath}"`;

    await execAsync(cmd, { timeout: 30000, cwd: projectDir });

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
    await cleanupProjectDir(projectDir);
  }
}

export async function compileToPages(
  code: string,
  options: CompileOptions = {}
): Promise<{
  success: boolean;
  pages?: string[]; // Base64 encoded PNGs
  error?: string;
}> {
  await ensureTempDir();

  const id = randomUUID();
  const projectDir = join(TEMP_DIR, id);
  await mkdir(projectDir, { recursive: true });

  const inputPath = join(projectDir, 'main.typ');
  const outputPattern = join(projectDir, 'page-{n}.png');

  try {
    // Save images if provided
    if (options.images && options.images.length > 0) {
      await saveImages(projectDir, options.images);
    }

    // Write the Typst source
    await writeFile(inputPath, code, 'utf-8');

    // Compile all pages
    await execAsync(
      `typst compile "${inputPath}" "${outputPattern}" --format png --ppi 144`,
      { timeout: 60000, cwd: projectDir }
    );

    // Find all generated pages
    const files = await readdir(projectDir);
    const pageFiles = files
      .filter(f => f.startsWith('page-') && f.endsWith('.png'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/page-(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/page-(\d+)/)?.[1] || '0');
        return numA - numB;
      });

    if (pageFiles.length === 0) {
      return { success: false, error: 'No output generated' };
    }

    const pages: string[] = [];
    for (const file of pageFiles) {
      const buffer = await readFile(join(projectDir, file));
      pages.push(buffer.toString('base64'));
    }

    return { success: true, pages };
  } catch (error: any) {
    return {
      success: false,
      error: error.stderr || error.message || 'Compilation failed',
    };
  } finally {
    await cleanupProjectDir(projectDir);
  }
}

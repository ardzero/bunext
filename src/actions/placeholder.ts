'use server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
function bufferToBase64(buffer: Buffer): string {
    return `data:image/png;base64,${buffer.toString('base64')}`;
}
async function getFileBufferLocal(src: string) {
    const realsrc = path.join(process.cwd(), 'public', src);
    return fs.readFile(realsrc);
}
async function getFileBufferRemote(url: string) {
    const response = await fetch(url);
    return Buffer.from(await response.arrayBuffer());
}
function getFileBuffer(src: string) {
    const isRemote = src.startsWith('http');
    return isRemote ? getFileBufferRemote(src) : getFileBufferLocal(src);
}
export async function getPlaceholderImage(src: string) {
    try {
        const originalBuffer = await (src.startsWith('http')
            ? getFileBuffer(src)
            : getFileBufferLocal(src));
        const resizedBuffer = await sharp(originalBuffer).resize(20).toBuffer();
        return bufferToBase64(resizedBuffer);
    } catch {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsa2yqBwAFCAICLICSyQAAAABJRU5ErkJggg==';
    }
}

export async function getImageDimensions(
    src: string
): Promise<{ width: number; height: number } | null> {
    try {
        const buffer = await (src.startsWith('http')
            ? getFileBuffer(src)
            : getFileBufferLocal(src));
        const { width, height } = await sharp(buffer).metadata();
        if (width == null || height == null) return null;
        return { width, height };
    } catch {
        return null;
    }
}
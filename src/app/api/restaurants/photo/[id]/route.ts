import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const row = db.prepare('SELECT photo_url FROM restaurants WHERE id = ?').get(id) as
    | { photo_url: string }
    | undefined;

  if (!row?.photo_url) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  // Base64 data URI stored directly in the DB (from upload or import)
  const match = row.photo_url.match(/^data:(image\/[\w+-.]+);base64,(.+)$/);
  if (match) {
    const mime = match[1];
    const buf = Buffer.from(match[2], 'base64');
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': mime,
        'Content-Length': String(buf.length),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // Legacy: photo_url is a path like /menu-photos/{id}.png — try the file (best effort)
  const cleanId = path.basename(row.photo_url).replace(/^\/+/, '');
  const filePath = path.join(process.cwd(), 'public', 'menu-photos', cleanId);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return new Response(fs.readFileSync(filePath), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
}

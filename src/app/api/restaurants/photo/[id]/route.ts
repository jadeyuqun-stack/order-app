import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Only serve files in menu-photos/
  const cleanId = id.replace(/[^a-zA-Z0-9-]/g, '');
  const filePath = path.join(process.cwd(), 'public', 'menu-photos', cleanId);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';

  // Use streaming instead of readFileSync to avoid blocking the event loop
  const fileStream = fs.createReadStream(filePath);
  return new NextResponse(fileStream, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}

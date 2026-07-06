import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: '請輸入帳號密碼' }, { status: 400 });
  }

  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password_hash = ?').get(username, hash);

  if (!admin) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }

  return NextResponse.json({ success: true, username: admin.username });
}

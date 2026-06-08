import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Params = { params: Promise<{ serverId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { serverId } = await params;
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/likes`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { serverId } = await params;
  const body = await req.json();
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 503 });
  }
}

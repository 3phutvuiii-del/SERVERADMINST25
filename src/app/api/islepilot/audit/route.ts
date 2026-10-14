import { NextResponse } from 'next/server';
import { getAuditLogsFromDb } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await getAuditLogsFromDb();
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

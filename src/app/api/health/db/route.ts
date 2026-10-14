import { NextResponse } from 'next/server';
import { testDbConnection } from '@/lib/db/mysql';

export async function GET() {
  try {
    const result = await testDbConnection();
    return NextResponse.json({
      ...result,
      database: process.env.MYSQL_DATABASE,
      host: process.env.MYSQL_HOST,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

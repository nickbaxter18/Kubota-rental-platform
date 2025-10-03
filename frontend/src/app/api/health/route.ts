import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Health check called');
  try {
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'frontend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
    console.log('Health check response:', response);
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Health check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

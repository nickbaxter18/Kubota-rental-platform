import { NextResponse } from 'next/server';

export async function GET() {
  const healthCheck: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: { status: 'unknown' as string },
      database: { status: 'unknown' as string },
      redis: { status: 'unknown' as string }
    }
  };

  try {
    // Check API connectivity
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/health`, {
      signal: AbortSignal.timeout(5000)
    });

    if (apiResponse.ok) {
      const apiHealth = await apiResponse.json();
      healthCheck.services.api = {
        status: apiHealth.status === 'ok' ? 'up' : 'down',
        response_time: Date.now() - new Date(healthCheck.timestamp).getTime(),
        details: apiHealth
      };
    } else {
      healthCheck.services.api = {
        status: 'down',
        error: `HTTP ${apiResponse.status}`
      };
    }
  } catch (error) {
    healthCheck.services.api = {
      status: 'down',
      error: error.message
    };
  }

  // Update overall status based on service health
  const criticalServices = ['api'];
  const hasCriticalFailures = criticalServices.some(service =>
    healthCheck.services[service].status === 'down'
  );

  if (hasCriticalFailures) {
    healthCheck.status = 'error';
  }

  const statusCode = healthCheck.status === 'ok' ? 200 : 503;

  return NextResponse.json(healthCheck, { status: statusCode });
}

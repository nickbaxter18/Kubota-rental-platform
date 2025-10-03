import { NextRequest, NextResponse } from 'next/server';

// Equipment availability API endpoint
// This would typically call your NestJS backend for real data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const equipmentId = searchParams.get('equipmentId');

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual API call to NestJS backend
    // For now, simulate availability check with mock data
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock availability response
    const isAvailable = Math.random() > 0.3; // 70% availability rate

    const availabilityData = {
      equipmentId: equipmentId || 'kubota-svl75',
      startDate,
      endDate,
      available: isAvailable,
      message: isAvailable
        ? 'Equipment is available for the selected dates'
        : 'Equipment is not available for these dates. Please select different dates.',
      alternatives: !isAvailable ? [
        {
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reason: 'Next available slot',
        },
        {
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reason: 'Alternative slot',
        },
      ] : [],
      pricing: {
        dailyRate: 350,
        currency: 'CAD',
        taxes: 0.15, // 15% HST
      },
    };

    return NextResponse.json(availabilityData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

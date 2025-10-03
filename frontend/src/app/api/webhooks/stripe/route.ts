import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// This would typically call your NestJS backend
// For now, we'll log the webhook and return success
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    // TODO: Verify Stripe webhook signature
    // const isValidSignature = verifyStripeSignature(body, signature);

    console.log('Stripe webhook received:', {
      body: JSON.parse(body),
      signature,
      timestamp: new Date().toISOString(),
    });

    // TODO: Process the webhook based on event type
    // - payment_intent.succeeded: Mark booking as paid
    // - payment_intent.payment_failed: Handle failed payment
    // - invoice.payment_succeeded: Handle subscription payments

    // For now, just acknowledge receipt
    return NextResponse.json(
      { received: true, timestamp: new Date().toISOString() },
      { status: 200 }
    );

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  });
}

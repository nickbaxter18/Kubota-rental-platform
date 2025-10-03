import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfirmPaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('security-deposit/:bookingId')
  @ApiOperation({ summary: 'Create payment intent for $500 security deposit' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async createSecurityDepositIntent(
    @Param('bookingId') bookingId: string,
    @Body() body: { customerEmail: string },
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    return await this.paymentsService.createSecurityDepositIntent(
      bookingId,
      body.customerEmail,
    );
  }

  @Post('booking-payment/:bookingId')
  @ApiOperation({ summary: 'Create payment intent for full booking payment' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async createBookingPaymentIntent(
    @Param('bookingId') bookingId: string,
    @Body() body: { customerEmail: string },
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    return await this.paymentsService.createBookingPaymentIntent(
      bookingId,
      body.customerEmail,
    );
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm payment after successful Stripe payment' })
  @ApiResponse({ status: 201, description: 'Payment confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Payment confirmation failed' })
  async confirmPayment(@Body() confirmPaymentDto: ConfirmPaymentDto) {
    return await this.paymentsService.confirmPayment(confirmPaymentDto);
  }

  @Post('refund/:bookingId')
  @ApiOperation({ summary: 'Process refund for cancelled booking' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Refund processing failed' })
  async processRefund(
    @Param('bookingId') bookingId: string,
    @Body() body: { amount?: number },
  ): Promise<{ refundId: string; amount: number }> {
    return await this.paymentsService.processRefund(bookingId, body.amount);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get all payments for a booking' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getPaymentsByBooking(@Param('bookingId') bookingId: string) {
    return await this.paymentsService.findByBooking(bookingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@Param('id') id: string) {
    return await this.paymentsService.findOne(id);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const sig = req.headers['stripe-signature'] as string;
    const body = req.body;

    try {
      await this.paymentsService.handleWebhookEvent(sig, body);
      res.status(HttpStatus.OK).json({ received: true });
    } catch (error) {
      console.error('Webhook processing failed:', error);
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Webhook processing failed' });
    }
  }
}

import { envConfig } from '@/config/env.config';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { Payment, PaymentMethod, PaymentStatus, PaymentType } from '../entities/payment.entity';
import { User } from '../entities/user.entity';
import { ConfirmPaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    if (envConfig.features.stripe && envConfig.stripe.secretKey) {
      this.stripe = new Stripe(envConfig.stripe.secretKey);
    }
  }

  /**
   * Create payment intent for $500 security deposit pre-auth
   */
  async createSecurityDepositIntent(
    bookingId: string,
    customerEmail: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (!envConfig.features.stripe) {
      throw new BadRequestException('Stripe integration is not enabled');
    }

    // Get booking details
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['customer'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.securityDeposit !== 500) {
      throw new BadRequestException('Security deposit must be $500');
    }

    try {
      // Create or retrieve Stripe customer
      let stripeCustomer = await this.findOrCreateStripeCustomer(booking.customer, customerEmail);

      // Create payment intent for $500 pre-auth
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(booking.securityDeposit * 100), // Convert to cents
        currency: 'cad',
        customer: stripeCustomer.id,
        metadata: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          customerEmail: customerEmail,
          type: 'security_deposit',
        },
        setup_future_usage: 'off_session', // Allow future charges
        description: `Security Deposit for Booking ${booking.bookingNumber}`,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Create payment intent for full booking payment
   */
  async createBookingPaymentIntent(
    bookingId: string,
    customerEmail: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (!envConfig.features.stripe) {
      throw new BadRequestException('Stripe integration is not enabled');
    }

    // Get booking details
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['customer'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    try {
      // Create or retrieve Stripe customer
      let stripeCustomer = await this.findOrCreateStripeCustomer(booking.customer, customerEmail);

      // Create payment intent for full amount
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(booking.total * 100), // Convert to cents
        currency: 'cad',
        customer: stripeCustomer.id,
        metadata: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          customerEmail: customerEmail,
          type: 'booking_payment',
        },
        description: `Payment for Booking ${booking.bookingNumber}`,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Confirm payment and update booking status
   */
  async confirmPayment(confirmPaymentDto: ConfirmPaymentDto): Promise<Payment> {
    if (!envConfig.features.stripe) {
      throw new BadRequestException('Stripe integration is not enabled');
    }

    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        confirmPaymentDto.paymentIntentId,
      );

      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException('Payment has not succeeded');
      }

      // Find booking by payment intent ID
      const booking = await this.bookingRepository.findOne({
        where: {
          // This would need to be stored when creating the payment intent
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Create payment record
      const payment = this.paymentRepository.create({
        bookingId: booking.id,
        paymentNumber: await this.generatePaymentNumber(),
        type: PaymentType.DEPOSIT,
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.CREDIT_CARD,
        amount: paymentIntent.amount / 100, // Convert from cents
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: paymentIntent.latest_charge as string,
        description: `Security deposit for booking ${booking.bookingNumber}`,
        processedAt: new Date(),
      });

      const savedPayment = await this.paymentRepository.save(payment);

      // Update booking status
      if (payment.type === PaymentType.DEPOSIT) {
        booking.status = BookingStatus.PAID;
        await this.bookingRepository.save(booking);
      }

      return savedPayment;
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw new BadRequestException('Failed to confirm payment');
    }
  }

  /**
   * Process refund for cancelled booking
   */
  async processRefund(
    bookingId: string,
    amount?: number,
  ): Promise<{ refundId: string; amount: number }> {
    if (!envConfig.features.stripe) {
      throw new BadRequestException('Stripe integration is not enabled');
    }

    // Get booking with payments
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['payments'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Find successful payments
    const successfulPayments = booking.payments.filter(
      p => p.status === PaymentStatus.COMPLETED && p.stripeChargeId,
    );

    if (successfulPayments.length === 0) {
      throw new BadRequestException('No successful payments found to refund');
    }

    try {
      // Calculate refund amount (default to total paid)
      const refundAmount = amount || successfulPayments.reduce((sum, p) => sum + p.amount, 0);

      // Process refund on the most recent charge
      const latestPayment = successfulPayments[successfulPayments.length - 1];
      const refund = await this.stripe.refunds.create({
        charge: latestPayment.stripeChargeId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        metadata: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          reason: 'booking_cancelled',
        },
      });

      // Update payment record
      latestPayment.status = PaymentStatus.PARTIALLY_REFUNDED;
      latestPayment.amountRefunded = refundAmount;
      latestPayment.stripeRefundId = refund.id;
      await this.paymentRepository.save(latestPayment);

      return {
        refundId: refund.id,
        amount: refundAmount,
      };
    } catch (error) {
      console.error('Refund processing failed:', error);
      throw new BadRequestException('Failed to process refund');
    }
  }

  /**
   * Get payment by ID
   */
  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['booking', 'booking.customer'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Get payments by booking ID
   */
  async findByBooking(bookingId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { bookingId },
      relations: ['booking'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find or create Stripe customer
   */
  private async findOrCreateStripeCustomer(
    user: User,
    email: string,
  ): Promise<Stripe.Customer> {
    try {
      // If user already has a Stripe customer ID, retrieve it
      if (user.stripeCustomerId) {
        return await this.stripe.customers.retrieve(user.stripeCustomerId) as Stripe.Customer;
      }

      // Create new Stripe customer
      const customer = await this.stripe.customers.create({
        email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id,
        },
      });

      // Update user with Stripe customer ID
      user.stripeCustomerId = customer.id;
      await this.userRepository.save(user);

      return customer;
    } catch (error) {
      console.error('Stripe customer creation/retrieval failed:', error);
      throw new BadRequestException('Failed to create or retrieve customer');
    }
  }

  /**
   * Generate unique payment number
   */
  private async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = 'PAY';

    // Get the count of payments this year
    const count = await this.paymentRepository.count({
      where: {
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        } as any,
      },
    });

    return `${prefix}-${year}-${(count + 1).toString().padStart(3, '0')}`;
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(
    signature: string,
    body: Buffer,
  ): Promise<void> {
    if (!envConfig.stripe.webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        envConfig.stripe.webhookSecret,
      );

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.dispute.created':
          await this.handleChargeDispute(event.data.object as Stripe.Dispute);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Update payment record
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (payment) {
      payment.status = PaymentStatus.COMPLETED;
      payment.processedAt = new Date();
      await this.paymentRepository.save(payment);

      // Update booking status if this was a deposit
      if (payment.type === PaymentType.DEPOSIT) {
        const booking = await this.bookingRepository.findOne({
          where: { id: payment.bookingId },
        });

        if (booking) {
          booking.status = BookingStatus.PAID;
          await this.bookingRepository.save(booking);
        }
      }
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Update payment record
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      payment.failedAt = new Date();
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await this.paymentRepository.save(payment);

      // Update booking status
      const booking = await this.bookingRepository.findOne({
        where: { id: payment.bookingId },
      });

      if (booking) {
        booking.status = BookingStatus.PENDING;
        await this.bookingRepository.save(booking);
      }
    }
  }

  private async handleChargeDispute(dispute: Stripe.Dispute): Promise<void> {
    // Handle charge disputes
    console.log('Charge dispute created:', dispute.id);
    // Implement dispute handling logic
  }
}

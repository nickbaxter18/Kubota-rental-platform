import { QUEUES } from '@/config/redis.config';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailJobData } from '../jobs.service';

@Processor(QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<EmailJobData>): Promise<any> {
    this.logger.log(`Processing email job: ${job.name} for ${job.data.to}`);

    switch (job.name) {
      case 'booking-confirmation':
        await this.handleBookingConfirmation(job);
        break;
      case 'payment-receipt':
        await this.handlePaymentReceipt(job);
        break;
      case 'booking-reminder':
        await this.handleBookingReminder(job);
        break;
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleBookingConfirmation(job: Job<EmailJobData>) {
    this.logger.log(`Processing booking confirmation email for ${job.data.to}`);

    try {
      await this.sendEmail(job.data);
      this.logger.log(`Successfully sent booking confirmation email to ${job.data.to}`);
    } catch (error) {
      this.logger.error(`Failed to send booking confirmation email to ${job.data.to}`, error);
      throw error;
    }
  }

  private async handlePaymentReceipt(job: Job<EmailJobData>) {
    this.logger.log(`Processing payment receipt email for ${job.data.to}`);

    try {
      await this.sendEmail(job.data);
      this.logger.log(`Successfully sent payment receipt email to ${job.data.to}`);
    } catch (error) {
      this.logger.error(`Failed to send payment receipt email to ${job.data.to}`, error);
      throw error;
    }
  }

  private async handleBookingReminder(job: Job<EmailJobData>) {
    this.logger.log(`Processing booking reminder email for ${job.data.to}`);

    try {
      await this.sendEmail(job.data);
      this.logger.log(`Successfully sent booking reminder email to ${job.data.to}`);
    } catch (error) {
      this.logger.error(`Failed to send booking reminder email to ${job.data.to}`, error);
      throw error;
    }
  }

  private async sendEmail(emailData: EmailJobData): Promise<void> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: Replace with actual email service implementation
    this.logger.log(`[MOCK] Sending email:`, {
      to: emailData.to,
      subject: emailData.subject,
      template: emailData.template,
      data: emailData.data,
    });

    // Example implementation with a real email service:
    /*
    const emailService = new EmailService();
    await emailService.send({
      to: emailData.to,
      subject: emailData.subject,
      template: emailData.template,
      data: emailData.data,
    });
    */
  }
}

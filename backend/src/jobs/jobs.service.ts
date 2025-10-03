import { JOB_PRIORITIES, QUEUES } from '@/config/redis.config';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface NotificationJobData {
  userId: string;
  type: 'booking_confirmed' | 'payment_received' | 'equipment_ready' | 'reminder';
  data: Record<string, any>;
}

export interface BookingProcessingJobData {
  bookingId: string;
  action: 'confirm' | 'cancel' | 'modify';
  data?: Record<string, any>;
}

export interface PdfGenerationJobData {
  type: 'contract' | 'invoice' | 'receipt';
  entityId: string;
  userId: string;
}

export interface CleanupJobData {
  type: 'old_bookings' | 'failed_payments' | 'temp_files';
  olderThanDays: number;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue(QUEUES.EMAIL) private emailQueue: Queue,
    @InjectQueue(QUEUES.NOTIFICATIONS) private notificationQueue: Queue,
    @InjectQueue(QUEUES.BOOKING_PROCESSING) private bookingQueue: Queue,
    @InjectQueue(QUEUES.PDF_GENERATION) private pdfQueue: Queue,
    @InjectQueue(QUEUES.CLEANUP) private cleanupQueue: Queue,
  ) {}

  // Email jobs
  async sendBookingConfirmationEmail(emailData: EmailJobData) {
    try {
      await this.emailQueue.add(
        'booking-confirmation',
        emailData,
        {
          priority: JOB_PRIORITIES.HIGH,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );
      this.logger.log(`Queued booking confirmation email to ${emailData.to}`);
    } catch (error) {
      this.logger.error('Failed to queue booking confirmation email', error);
      throw error;
    }
  }

  async sendPaymentReceiptEmail(emailData: EmailJobData) {
    try {
      await this.emailQueue.add(
        'payment-receipt',
        emailData,
        {
          priority: JOB_PRIORITIES.HIGH,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );
      this.logger.log(`Queued payment receipt email to ${emailData.to}`);
    } catch (error) {
      this.logger.error('Failed to queue payment receipt email', error);
      throw error;
    }
  }

  // Notification jobs
  async sendBookingNotification(notificationData: NotificationJobData) {
    try {
      await this.notificationQueue.add(
        'booking-notification',
        notificationData,
        {
          priority: JOB_PRIORITIES.NORMAL,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        }
      );
      this.logger.log(`Queued notification for user ${notificationData.userId}`);
    } catch (error) {
      this.logger.error('Failed to queue notification', error);
      throw error;
    }
  }

  // Booking processing jobs
  async processBookingAction(bookingData: BookingProcessingJobData) {
    try {
      await this.bookingQueue.add(
        'process-booking',
        bookingData,
        {
          priority: JOB_PRIORITIES.HIGH,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );
      this.logger.log(`Queued booking processing for booking ${bookingData.bookingId}`);
    } catch (error) {
      this.logger.error('Failed to queue booking processing', error);
      throw error;
    }
  }

  // PDF generation jobs
  async generatePdf(pdfData: PdfGenerationJobData) {
    try {
      await this.pdfQueue.add(
        'generate-pdf',
        pdfData,
        {
          priority: JOB_PRIORITIES.NORMAL,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
        }
      );
      this.logger.log(`Queued PDF generation for ${pdfData.type} ${pdfData.entityId}`);
    } catch (error) {
      this.logger.error('Failed to queue PDF generation', error);
      throw error;
    }
  }

  // Cleanup jobs
  async scheduleCleanup(cleanupData: CleanupJobData) {
    try {
      await this.cleanupQueue.add(
        'cleanup-data',
        cleanupData,
        {
          priority: JOB_PRIORITIES.LOW,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        }
      );
      this.logger.log(`Queued cleanup job for ${cleanupData.type}`);
    } catch (error) {
      this.logger.error('Failed to queue cleanup job', error);
      throw error;
    }
  }

  // Queue management methods
  async getQueueStats() {
    try {
      const [emailStats, notificationStats, bookingStats, pdfStats, cleanupStats] = await Promise.all([
        this.emailQueue.getJobCounts(),
        this.notificationQueue.getJobCounts(),
        this.bookingQueue.getJobCounts(),
        this.pdfQueue.getJobCounts(),
        this.cleanupQueue.getJobCounts(),
      ]);

      return {
        email: emailStats,
        notifications: notificationStats,
        booking: bookingStats,
        pdf: pdfStats,
        cleanup: cleanupStats,
      };
    } catch (error) {
      this.logger.error('Failed to get queue stats', error);
      throw error;
    }
  }

  async pauseQueue(queueName: string) {
    try {
      const queue = this.getQueueByName(queueName);
      await queue.pause();
      this.logger.log(`Paused queue: ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to pause queue ${queueName}`, error);
      throw error;
    }
  }

  async resumeQueue(queueName: string) {
    try {
      const queue = this.getQueueByName(queueName);
      await queue.resume();
      this.logger.log(`Resumed queue: ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to resume queue ${queueName}`, error);
      throw error;
    }
  }

  private getQueueByName(queueName: string): Queue {
    switch (queueName) {
      case QUEUES.EMAIL:
        return this.emailQueue;
      case QUEUES.NOTIFICATIONS:
        return this.notificationQueue;
      case QUEUES.BOOKING_PROCESSING:
        return this.bookingQueue;
      case QUEUES.PDF_GENERATION:
        return this.pdfQueue;
      case QUEUES.CLEANUP:
        return this.cleanupQueue;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
  }
}

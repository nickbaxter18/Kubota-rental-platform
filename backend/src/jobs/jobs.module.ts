import { QUEUES } from '@/config/redis.config';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { BookingProcessor } from './processors/booking.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { EmailProcessor } from './processors/email.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { PdfProcessor } from './processors/pdf.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUES.EMAIL },
      { name: QUEUES.NOTIFICATIONS },
      { name: QUEUES.BOOKING_PROCESSING },
      { name: QUEUES.PDF_GENERATION },
      { name: QUEUES.CLEANUP },
    ),
  ],
  providers: [
    JobsService,
    EmailProcessor,
    NotificationProcessor,
    BookingProcessor,
    PdfProcessor,
    CleanupProcessor,
  ],
  exports: [JobsService],
})
export class JobsModule {}

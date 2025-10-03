import { envConfig } from '@/config/env.config';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Booking, BookingStatus, BookingType } from '../entities/booking.entity';
import { Equipment } from '../entities/equipment.entity';
import { User } from '../entities/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Check equipment availability for given dates
   */
  async checkAvailability(equipmentId: string, startDate: Date, endDate: Date): Promise<boolean> {
    const conflictingBookings = await this.bookingRepository.find({
      where: {
        equipmentId,
        status: BookingStatus.CONFIRMED,
        startDate: Between(startDate, endDate),
      },
    });

    return conflictingBookings.length === 0;
  }

  /**
   * Calculate booking pricing including taxes and fees
   */
  async calculatePricing(
    equipmentId: string,
    startDate: Date,
    endDate: Date,
    type: BookingType,
  ): Promise<{
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
    subtotal: number;
    taxes: number;
    floatFee: number;
    total: number;
    duration: { days: number; weeks: number; months: number };
  }> {
    const equipment = await this.equipmentRepository.findOne({
      where: { id: equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    // Calculate duration
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.ceil(diffDays / 7);
    const diffMonths = Math.ceil(diffDays / 30);

    // Calculate float fee based on type and service area
    const floatFee = type === BookingType.DELIVERY ? envConfig.rental.defaultFloatFee : 0;

    // Simple pricing logic - can be enhanced with more complex rules
    let subtotal = 0;
    if (diffDays <= 7) {
      subtotal = equipment.dailyRate * diffDays;
    } else if (diffDays <= 30) {
      subtotal = equipment.weeklyRate * diffWeeks;
    } else {
      subtotal = equipment.monthlyRate * diffMonths;
    }

    // Calculate taxes (assuming 15% HST for New Brunswick)
    const taxes = subtotal * 0.15;

    const total = subtotal + taxes + floatFee;

    return {
      dailyRate: equipment.dailyRate,
      weeklyRate: equipment.weeklyRate,
      monthlyRate: equipment.monthlyRate,
      subtotal,
      taxes,
      floatFee,
      total,
      duration: { days: diffDays, weeks: diffWeeks, months: diffMonths },
    };
  }

  /**
   * Create a new booking
   */
  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Validate customer exists
    const customer = await this.userRepository.findOne({
      where: { id: createBookingDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate equipment exists
    const equipment = await this.equipmentRepository.findOne({
      where: { id: createBookingDto.equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    // Check equipment availability
    const isAvailable = await this.checkAvailability(
      createBookingDto.equipmentId,
      createBookingDto.startDate,
      createBookingDto.endDate,
    );

    if (!isAvailable) {
      throw new ConflictException('Equipment is not available for the selected dates');
    }

    // Calculate pricing
    const pricing = await this.calculatePricing(
      createBookingDto.equipmentId,
      createBookingDto.startDate,
      createBookingDto.endDate,
      createBookingDto.type,
    );

    // Generate booking number
    const bookingNumber = await this.generateBookingNumber();

    // Create booking
    const booking = this.bookingRepository.create({
      bookingNumber,
      customerId: createBookingDto.customerId,
      equipmentId: createBookingDto.equipmentId,
      startDate: createBookingDto.startDate,
      endDate: createBookingDto.endDate,
      type: createBookingDto.type,
      deliveryAddress: createBookingDto.deliveryAddress,
      deliveryCity: createBookingDto.deliveryCity,
      deliveryProvince: createBookingDto.deliveryProvince,
      deliveryPostalCode: createBookingDto.deliveryPostalCode,
      specialInstructions: createBookingDto.specialInstructions,
      dailyRate: pricing.dailyRate,
      weeklyRate: pricing.weeklyRate,
      monthlyRate: pricing.monthlyRate,
      subtotal: pricing.subtotal,
      taxes: pricing.taxes,
      floatFee: pricing.floatFee,
      total: pricing.total,
      securityDeposit: envConfig.rental.securityDeposit,
      status: BookingStatus.PENDING,
    });

    return await this.bookingRepository.save(booking);
  }

  /**
   * Get all bookings with optional filters
   */
  async findAll(filters?: {
    status?: BookingStatus;
    customerId?: string;
    equipmentId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Booking[]> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.equipment', 'equipment');

    if (filters?.status) {
      queryBuilder.andWhere('booking.status = :status', { status: filters.status });
    }

    if (filters?.customerId) {
      queryBuilder.andWhere('booking.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters?.equipmentId) {
      queryBuilder.andWhere('booking.equipmentId = :equipmentId', { equipmentId: filters.equipmentId });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('booking.startDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('booking.endDate <= :endDate', { endDate: filters.endDate });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get booking by ID
   */
  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['customer', 'equipment', 'payments', 'insuranceDocuments'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  /**
   * Update booking status
   */
  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.findOne(id);

    booking.status = status;
    booking.updatedAt = new Date();

    return await this.bookingRepository.save(booking);
  }

  /**
   * Cancel booking
   */
  async cancel(id: string, reason: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    booking.updatedAt = new Date();

    return await this.bookingRepository.save(booking);
  }

  /**
   * Generate unique booking number
   */
  private async generateBookingNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = 'UDR';

    // Get the count of bookings this year
    const count = await this.bookingRepository.count({
      where: {
        createdAt: Between(
          new Date(year, 0, 1),
          new Date(year + 1, 0, 1),
        ),
      },
    });

    return `${prefix}-${year}-${(count + 1).toString().padStart(3, '0')}`;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment, EquipmentStatus } from '../entities/equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
  ) {}

  async create(createEquipmentDto: CreateEquipmentDto): Promise<Equipment> {
    const equipment = this.equipmentRepository.create(createEquipmentDto);
    return await this.equipmentRepository.save(equipment);
  }

  async findAll(
    filters?: any,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    equipment: Equipment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const query = this.equipmentRepository.createQueryBuilder('equipment');

    if (filters) {
      if (filters.status) {
        query.andWhere('equipment.status = :status', { status: filters.status });
      }
      if (filters.type) {
        query.andWhere('equipment.type = :type', { type: filters.type });
      }
      if (filters.category) {
        query.andWhere('equipment.category = :category', { category: filters.category });
      }
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [equipment, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      equipment,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<Equipment> {
    const equipment = await this.equipmentRepository.findOne({
      where: { id },
    });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    return equipment;
  }

  async checkAvailability(
    equipmentId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    // Check if equipment exists and is available
    const equipment = await this.findOne(equipmentId);

    if (equipment.status !== EquipmentStatus.AVAILABLE) {
      return false;
    }

    // Check for conflicting bookings
    const conflictingBookings = await this.equipmentRepository
      .createQueryBuilder('equipment')
      .leftJoinAndSelect('equipment.bookings', 'booking')
      .where('equipment.id = :equipmentId', { equipmentId })
      .andWhere('booking.status NOT IN (:...excludeStatuses)', {
        excludeStatuses: ['cancelled', 'completed'],
      })
      .andWhere(
        '(booking.startDate <= :endDate AND booking.endDate >= :startDate)',
        { startDate, endDate },
      )
      .getCount();

    return conflictingBookings === 0;
  }

  async getBookings(equipmentId: string): Promise<any> {
    const equipment = await this.findOne(equipmentId);
    return {
      equipmentId,
      bookings: equipment.bookings || [],
    };
  }

  async updateStatus(id: string, status: EquipmentStatus): Promise<Equipment> {
    const equipment = await this.findOne(id);
    equipment.status = status;
    return await this.equipmentRepository.save(equipment);
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.equipmentRepository
      .createQueryBuilder('equipment')
      .select('DISTINCT equipment.category', 'category')
      .where('equipment.category IS NOT NULL')
      .getRawMany();

    return categories.map(cat => cat.category).filter(Boolean);
  }

  async getStats(): Promise<any> {
    const total = await this.equipmentRepository.count();
    const available = await this.equipmentRepository.count({
      where: { status: EquipmentStatus.AVAILABLE },
    });
    const maintenance = await this.equipmentRepository.count({
      where: { status: EquipmentStatus.MAINTENANCE },
    });
    const rented = await this.equipmentRepository.count({
      where: { status: EquipmentStatus.RENTED },
    });

    return {
      total,
      available,
      maintenance,
      rented,
      utilizationRate: total > 0 ? ((rented / total) * 100).toFixed(1) : 0,
    };
  }

  async search(query?: string, location?: string): Promise<Equipment[]> {
    const queryBuilder = this.equipmentRepository.createQueryBuilder('equipment');

    if (query) {
      queryBuilder.andWhere(
        '(equipment.model LIKE :query OR equipment.description LIKE :query OR equipment.make LIKE :query)',
        { query: `%${query}%` },
      );
    }

    if (location) {
      queryBuilder.andWhere(
        '(equipment.location.city LIKE :location OR equipment.location.province LIKE :location)',
        { location: `%${location}%` },
      );
    }

    return await queryBuilder.getMany();
  }
}

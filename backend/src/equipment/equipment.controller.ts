import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Equipment, EquipmentStatus } from '../entities/equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { EquipmentService } from './equipment.service';

@ApiTags('Equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create new equipment' })
  @ApiResponse({ status: 201, description: 'Equipment created successfully', type: Equipment })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createEquipmentDto: CreateEquipmentDto): Promise<Equipment> {
    return await this.equipmentService.create(createEquipmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all equipment with optional filters' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully' })
  async findAll(
    @Query('status') status?: EquipmentStatus,
    @Query('type') type?: string,
    @Query('available') available?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    equipment: Equipment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const filters: any = {};
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;

    if (status) filters.status = status;
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (available === 'true') filters.status = EquipmentStatus.AVAILABLE;

    return await this.equipmentService.findAll(filters, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment by ID' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async findOne(@Param('id') id: string): Promise<Equipment> {
    return await this.equipmentService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check equipment availability for specific dates' })
  @ApiResponse({ status: 200, description: 'Availability checked successfully' })
  async checkAvailability(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{
    available: boolean;
    alternatives?: Array<{ date: string; reason: string }>;
    pricing: { dailyRate: number; currency: string };
  }> {
    const equipment = await this.equipmentService.findOne(id);

    const available = await this.equipmentService.checkAvailability(
      id,
      new Date(startDate),
      new Date(endDate),
    );

    return {
      available,
      pricing: {
        dailyRate: equipment.dailyRate,
        currency: 'CAD',
      },
    };
  }

  @Get(':id/bookings')
  @ApiOperation({ summary: 'Get bookings for specific equipment' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  async getBookings(@Param('id') id: string): Promise<any> {
    return await this.equipmentService.getBookings(id);
  }

  @Post(':id/maintenance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark equipment for maintenance' })
  @ApiResponse({ status: 200, description: 'Equipment marked for maintenance' })
  async markForMaintenance(
    @Param('id') id: string,
    @Body() body: { reason: string; estimatedDuration?: number },
  ): Promise<Equipment> {
    return await this.equipmentService.updateStatus(id, EquipmentStatus.MAINTENANCE);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate equipment' })
  @ApiResponse({ status: 200, description: 'Equipment activated' })
  async activate(@Param('id') id: string): Promise<Equipment> {
    return await this.equipmentService.updateStatus(id, EquipmentStatus.AVAILABLE);
  }

  @Get('categories/all')
  @ApiOperation({ summary: 'Get all equipment categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(): Promise<string[]> {
    return await this.equipmentService.getCategories();
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get equipment overview statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(): Promise<any> {
    return await this.equipmentService.getStats();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search equipment' })
  @ApiResponse({ status: 200, description: 'Search completed successfully' })
  async search(
    @Query('query') query?: string,
    @Query('location') location?: string,
  ): Promise<Equipment[]> {
    return await this.equipmentService.search(query, location);
  }
}

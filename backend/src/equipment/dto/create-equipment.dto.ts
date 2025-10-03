import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EquipmentStatus, EquipmentType } from '../../entities/equipment.entity';

export class CreateEquipmentDto {
  @IsString()
  unitId: string;

  @IsString()
  serialNumber: string;

  @IsEnum(EquipmentType)
  type: EquipmentType;

  @IsString()
  model: string;

  @IsNumber()
  year: number;

  @IsString()
  make: string;

  @IsString()
  description: string;

  @IsNumber()
  replacementValue: number;

  @IsNumber()
  dailyRate: number;

  @IsNumber()
  weeklyRate: number;

  @IsNumber()
  monthlyRate: number;

  @IsNumber()
  overageHourlyRate: number;

  @IsNumber()
  dailyHourAllowance: number;

  @IsNumber()
  weeklyHourAllowance: number;

  @IsOptional()
  specifications?: {
    operatingWeight: number;
    transportDimensions: {
      length: number;
      width: number;
      height: number;
    };
    engineHours: number;
    fuelType: string;
    attachments: string[];
  };

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  attachments?: {
    name: string;
    type: string;
    included: boolean;
    additionalCost?: number;
  }[];

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  lastMaintenanceDate?: Date;

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  nextMaintenanceDue?: Date;

  @IsOptional()
  @IsNumber()
  totalEngineHours?: number;

  @IsOptional()
  location?: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  @IsOptional()
  @IsArray()
  images?: {
    url: string;
    alt: string;
    isPrimary: boolean;
  }[];

  @IsOptional()
  @IsArray()
  documents?: {
    type: string;
    url: string;
    name: string;
  }[];
}

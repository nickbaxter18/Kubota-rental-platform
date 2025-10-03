import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { InsuranceDocumentStatus, InsuranceDocumentType } from '../../entities/insurance-document.entity';

export class UploadInsuranceDto {
  @IsUUID()
  bookingId: string;

  @IsEnum(InsuranceDocumentType)
  type: InsuranceDocumentType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  insuranceCompany?: string;

  @IsOptional()
  @IsString()
  policyNumber?: string;

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  effectiveDate?: Date;

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  expirationDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  generalLiabilityLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  equipmentLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  deductible?: number;

  @IsOptional()
  @IsObject()
  metadata?: {
    uploadedBy?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export class ValidateInsuranceDto {
  @IsUUID()
  insuranceDocumentId: string;

  @IsEnum(InsuranceDocumentStatus)
  status: InsuranceDocumentStatus;

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;
}

export class InsuranceValidationResultDto {
  @IsUUID()
  bookingId: string;

  @IsEnum(InsuranceDocumentStatus)
  status: InsuranceDocumentStatus;

  @IsOptional()
  @IsObject()
  validationDetails?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    requirements: {
      generalLiabilityRequired: number;
      equipmentLimitRequired: number;
      additionalInsuredRequired: boolean;
      lossPayeeRequired: boolean;
      waiverOfSubrogationRequired: boolean;
    };
    actual: {
      generalLiabilityLimit?: number;
      equipmentLimit?: number;
      additionalInsuredIncluded: boolean;
      lossPayeeIncluded: boolean;
      waiverOfSubrogationIncluded: boolean;
    };
  };
}

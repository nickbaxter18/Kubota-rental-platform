import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ContractType, SignatureType } from '../../entities/contract.entity';

export class CreateContractDto {
  @IsUUID()
  bookingId: string;

  @IsEnum(ContractType)
  type: ContractType;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsObject()
  additionalData?: Record<string, any>;
}

export class SignContractDto {
  @IsUUID()
  contractId: string;

  @IsEnum(SignatureType)
  signatureType: SignatureType;

  @IsString()
  fullName: string;

  @IsString()
  email: string;

  @IsObject()
  initials: {
    section2: string; // Insurance
    section3: string; // Transport & Tie-Down
    section4: string; // Operating Limits & Safety
    section5: string; // Prohibited Uses
    section7: string; // Damage/Loss/Theft & Environmental
    section8: string; // Financial Terms
    finalAcceptance: string;
  };

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class GenerateContractDto {
  @IsUUID()
  bookingId: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, string>;
}

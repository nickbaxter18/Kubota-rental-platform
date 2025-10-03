import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { MoreThan, Repository } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { InsuranceDocument, InsuranceDocumentStatus } from '../entities/insurance-document.entity';
import { InsuranceValidationResultDto, UploadInsuranceDto, ValidateInsuranceDto } from './dto/insurance.dto';

@Injectable()
export class InsuranceService {
  private readonly uploadDir = './uploads/insurance';

  constructor(
    @InjectRepository(InsuranceDocument)
    private readonly insuranceDocumentRepository: Repository<InsuranceDocument>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload and validate insurance document
   */
  async uploadInsuranceDocument(
    file: Express.Multer.File,
    uploadDto: UploadInsuranceDto,
  ): Promise<InsuranceDocument> {
    // Validate booking exists and is in correct status
    const booking = await this.bookingRepository.findOne({
      where: { id: uploadDto.bookingId },
      relations: ['customer'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot upload insurance for completed booking');
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 10MB');
    }

    try {
      // Generate unique filename
      const fileExt = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
      const filePath = path.join(this.uploadDir, fileName);

      // Save file
      fs.writeFileSync(filePath, file.buffer);

      // Generate document number
      const documentNumber = await this.generateDocumentNumber();

      // Extract data from document (simplified - in real implementation would use OCR)
      const extractedData = await this.extractInsuranceData(file);

      // Create insurance document record
      const insuranceDocument = this.insuranceDocumentRepository.create({
        bookingId: uploadDto.bookingId,
        documentNumber,
        type: uploadDto.type,
        status: InsuranceDocumentStatus.PENDING,
        fileName,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileUrl: filePath,
        description: uploadDto.description,
        insuranceCompany: uploadDto.insuranceCompany,
        policyNumber: uploadDto.policyNumber,
        effectiveDate: uploadDto.effectiveDate,
        expiresAt: uploadDto.expirationDate,
        generalLiabilityLimit: uploadDto.generalLiabilityLimit,
        equipmentLimit: uploadDto.equipmentLimit,
        deductible: uploadDto.deductible,
        extractedData,
        metadata: uploadDto.metadata || {
          uploadedBy: 'customer',
          ipAddress: 'unknown',
          userAgent: 'unknown',
        },
      });

      const savedDocument = await this.insuranceDocumentRepository.save(insuranceDocument);

      // Validate insurance requirements
      await this.validateInsuranceRequirements(savedDocument, booking);

      return savedDocument;
    } catch (error) {
      console.error('Insurance document upload failed:', error);
      throw new BadRequestException('Failed to upload insurance document');
    }
  }

  /**
   * Validate insurance requirements for booking
   */
  async validateInsuranceRequirements(
    insuranceDocument: InsuranceDocument,
    booking: Booking,
  ): Promise<InsuranceValidationResultDto> {
    const requirements = {
      generalLiabilityRequired: 2000000, // $2M as per Rider
      equipmentLimitRequired: 120000,    // $120k as per Rider
      additionalInsuredRequired: true,
      lossPayeeRequired: true,
      waiverOfSubrogationRequired: true,
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check General Liability limit
    if (!insuranceDocument.generalLiabilityLimit || insuranceDocument.generalLiabilityLimit < requirements.generalLiabilityRequired) {
      errors.push(`General Liability limit must be at least $${requirements.generalLiabilityRequired.toLocaleString()}`);
    }

    // Check Equipment limit
    if (!insuranceDocument.equipmentLimit || insuranceDocument.equipmentLimit < requirements.equipmentLimitRequired) {
      errors.push(`Equipment limit must be at least $${requirements.equipmentLimitRequired.toLocaleString()}`);
    }

    // Check expiration date
    if (insuranceDocument.expiresAt && insuranceDocument.expiresAt <= new Date()) {
      errors.push('Insurance document has expired');
    }

    // Check effective date
    if (insuranceDocument.effectiveDate && insuranceDocument.effectiveDate > new Date()) {
      warnings.push('Insurance document is not yet effective');
    }

    // Check extracted data for additional insured and loss payee
    const extracted = insuranceDocument.extractedData || {};
    if (!extracted.additionalInsured?.includes('U-Dig It Rentals Inc.')) {
      errors.push('U-Dig It Rentals Inc. must be named as Additional Insured');
    }

    if (!extracted.lossPayee?.includes('U-Dig It Rentals Inc.')) {
      errors.push('U-Dig It Rentals Inc. must be named as Loss Payee');
    }

    const isValid = errors.length === 0;

    // Update document status based on validation
    insuranceDocument.status = isValid ? InsuranceDocumentStatus.APPROVED : InsuranceDocumentStatus.REJECTED;
    insuranceDocument.validationResults = {
      isValid,
      errors,
      warnings,
      checkedAt: new Date(),
      checkedBy: 'system',
    };

    await this.insuranceDocumentRepository.save(insuranceDocument);

    // Update booking status if insurance is valid
    if (isValid && booking.status === BookingStatus.PAID) {
      booking.status = BookingStatus.INSURANCE_VERIFIED;
      await this.bookingRepository.save(booking);
    }

    return {
      bookingId: booking.id,
      status: insuranceDocument.status,
      validationDetails: {
        isValid,
        errors,
        warnings,
        requirements,
        actual: {
          generalLiabilityLimit: insuranceDocument.generalLiabilityLimit,
          equipmentLimit: insuranceDocument.equipmentLimit,
          additionalInsuredIncluded: extracted.additionalInsured?.includes('U-Dig It Rentals Inc.') || false,
          lossPayeeIncluded: extracted.lossPayee?.includes('U-Dig It Rentals Inc.') || false,
          waiverOfSubrogationIncluded: true, // Assume present unless specified otherwise
        },
      },
    };
  }

  /**
   * Check if booking can be released (No COI, No Release)
   */
  async canReleaseEquipment(bookingId: string): Promise<{
    canRelease: boolean;
    reason?: string;
    missingRequirements?: string[];
  }> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['insuranceDocuments'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if booking is in correct status
    if (booking.status !== BookingStatus.INSURANCE_VERIFIED) {
      return {
        canRelease: false,
        reason: 'Booking is not ready for equipment release',
        missingRequirements: ['Booking must be in INSURANCE_VERIFIED status'],
      };
    }

    // Check if insurance is valid and approved
    const approvedInsurance = booking.insuranceDocuments.filter(
      doc => doc.status === InsuranceDocumentStatus.APPROVED &&
             doc.expiresAt &&
             doc.expiresAt > new Date(),
    );

    if (approvedInsurance.length === 0) {
      return {
        canRelease: false,
        reason: 'No valid approved insurance documents found',
        missingRequirements: ['Valid Certificate of Insurance', 'Current insurance coverage'],
      };
    }

    // Check insurance requirements
    const latestInsurance = approvedInsurance[approvedInsurance.length - 1];
    const validation = latestInsurance.validationResults;

    if (!validation?.isValid) {
      return {
        canRelease: false,
        reason: 'Insurance does not meet requirements',
        missingRequirements: validation?.errors || ['Insurance validation failed'],
      };
    }

    return {
      canRelease: true,
      reason: 'All insurance requirements met',
    };
  }

  /**
   * Review and validate insurance document (admin function)
   */
  async reviewInsuranceDocument(
    insuranceDocumentId: string,
    validateDto: ValidateInsuranceDto,
  ): Promise<InsuranceDocument> {
    const insuranceDocument = await this.insuranceDocumentRepository.findOne({
      where: { id: insuranceDocumentId },
      relations: ['booking'],
    });

    if (!insuranceDocument) {
      throw new NotFoundException('Insurance document not found');
    }

    // Update document with review results
    insuranceDocument.status = validateDto.status;
    insuranceDocument.reviewNotes = validateDto.reviewNotes;
    insuranceDocument.reviewedAt = new Date();
    insuranceDocument.reviewedBy = validateDto.reviewedBy;

    const savedDocument = await this.insuranceDocumentRepository.save(insuranceDocument);

    // Update booking status based on insurance approval
    if (validateDto.status === InsuranceDocumentStatus.APPROVED && insuranceDocument.booking) {
      insuranceDocument.booking.status = BookingStatus.INSURANCE_VERIFIED;
      await this.bookingRepository.save(insuranceDocument.booking);
    }

    return savedDocument;
  }

  /**
   * Get insurance documents for a booking
   */
  async getInsuranceDocuments(bookingId: string): Promise<InsuranceDocument[]> {
    return await this.insuranceDocumentRepository.find({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get insurance document by ID
   */
  async getInsuranceDocument(id: string): Promise<InsuranceDocument> {
    const document = await this.insuranceDocumentRepository.findOne({
      where: { id },
      relations: ['booking'],
    });

    if (!document) {
      throw new NotFoundException('Insurance document not found');
    }

    return document;
  }

  /**
   * Extract insurance data from uploaded document (simplified implementation)
   */
  private async extractInsuranceData(file: Express.Multer.File): Promise<any> {
    // In a real implementation, this would use OCR or PDF parsing
    // For now, return mock data structure
    return {
      insurerName: 'Sample Insurance Company',
      policyNumber: 'POL-' + Date.now(),
      effectiveDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      coverageLimits: {
        generalLiability: 2000000,
        equipment: 120000,
        deductible: 1000,
      },
      endorsements: ['Additional Insured', 'Waiver of Subrogation'],
      additionalInsured: ['U-Dig It Rentals Inc.'],
      lossPayee: ['U-Dig It Rentals Inc.'],
    };
  }

  /**
   * Generate unique document number
   */
  private async generateDocumentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = 'INS';

    // Get the count of documents this year
    const count = await this.insuranceDocumentRepository.count({
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
   * Check for expired insurance documents
   */
  async checkExpiredInsurance(): Promise<InsuranceDocument[]> {
    const expiredDocuments = await this.insuranceDocumentRepository.find({
      where: {
        status: InsuranceDocumentStatus.APPROVED,
        expiresAt: MoreThan(new Date()),
      },
    });

    // Mark expired documents
    for (const document of expiredDocuments) {
      document.status = InsuranceDocumentStatus.EXPIRED;
      await this.insuranceDocumentRepository.save(document);

      // Update related booking status if needed
      const booking = await this.bookingRepository.findOne({
        where: { id: document.bookingId },
      });

      if (booking && booking.status === BookingStatus.INSURANCE_VERIFIED) {
        booking.status = BookingStatus.PAID; // Revert to paid status
        await this.bookingRepository.save(booking);
      }
    }

    return expiredDocuments;
  }

  /**
   * Get insurance compliance report for a booking
   */
  async getInsuranceComplianceReport(bookingId: string): Promise<{
    bookingId: string;
    status: string;
    canRelease: boolean;
    documents: InsuranceDocument[];
    requirements: any;
    lastUpdated: Date;
  }> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['insuranceDocuments'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const releaseCheck = await this.canReleaseEquipment(bookingId);

    return {
      bookingId,
      status: booking.status,
      canRelease: releaseCheck.canRelease,
      documents: booking.insuranceDocuments,
      requirements: {
        generalLiabilityRequired: 2000000,
        equipmentLimitRequired: 120000,
        additionalInsuredRequired: true,
        lossPayeeRequired: true,
        waiverOfSubrogationRequired: true,
      },
      lastUpdated: new Date(),
    };
  }
}

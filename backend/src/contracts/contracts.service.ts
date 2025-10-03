import { envConfig } from '@/config/env.config';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as puppeteer from 'puppeteer';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { Contract, ContractStatus, ContractType, SignatureType } from '../entities/contract.entity';
import { GenerateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * Generate combined rental agreement PDF with Terms & Rider
   */
  async generateRentalAgreement(generateContractDto: GenerateContractDto): Promise<Contract> {
    // Get booking with related data
    const booking = await this.bookingRepository.findOne({
      where: { id: generateContractDto.bookingId },
      relations: ['customer', 'equipment'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Generate contract number
    const contractNumber = await this.generateContractNumber();

    // Create contract record
    const contract = this.contractRepository.create({
      contractNumber,
      bookingId: generateContractDto.bookingId,
      type: ContractType.COMBINED,
      status: ContractStatus.DRAFT,
      legalVersions: {
        termsVersion: envConfig.legal.termsVersion,
        riderVersion: envConfig.legal.riderVersion,
        termsHash: envConfig.legal.termsHash,
        riderHash: envConfig.legal.riderHash,
        combinedHash: '', // Will be set after PDF generation
      },
    });

    const savedContract = await this.contractRepository.save(contract);

    try {
      // Generate PDF using Puppeteer
      const pdfBuffer = await this.generateContractPDF(booking, generateContractDto);

      // Calculate hash for integrity verification
      const combinedHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

      // Update contract with PDF data and hash
      savedContract.documentContent = pdfBuffer.toString('base64');
      savedContract.documentMetadata = {
        fileName: `rental-agreement-${contractNumber}.pdf`,
        fileSize: pdfBuffer.length,
        mimeType: 'application/pdf',
        pageCount: await this.getPDFPageCount(pdfBuffer),
        hash: combinedHash,
      };
      savedContract.legalVersions.combinedHash = combinedHash;

      return await this.contractRepository.save(savedContract);
    } catch (error) {
      console.error('Contract PDF generation failed:', error);
      throw new BadRequestException('Failed to generate contract PDF');
    }
  }

  /**
   * Send contract for DocuSign signature
   */
  async sendForSignature(contractId: string, customerEmail: string): Promise<{ envelopeId: string }> {
    if (!envConfig.features.docusign) {
      throw new BadRequestException('DocuSign integration is not enabled');
    }

    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
      relations: ['booking', 'booking.customer'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (!contract.documentContent) {
      throw new BadRequestException('Contract PDF not generated');
    }

    try {
      // TODO: Implement DocuSign API integration
      // This would involve:
      // 1. Creating DocuSign envelope
      // 2. Adding document with signature/initials tabs
      // 3. Setting up recipient with specific tab placements
      // 4. Sending for signature

      // For now, simulate the process
      const mockEnvelopeId = `mock-envelope-${Date.now()}`;

      contract.envelopeId = mockEnvelopeId;
      contract.status = ContractStatus.SENT_FOR_SIGNATURE;
      contract.sentAt = new Date();
      contract.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await this.contractRepository.save(contract);

      return { envelopeId: mockEnvelopeId };
    } catch (error) {
      console.error('DocuSign envelope creation failed:', error);
      throw new BadRequestException('Failed to send contract for signature');
    }
  }

  /**
   * Process contract signature completion
   */
  async processSignatureCompletion(
    envelopeId: string,
    signatureData: any,
  ): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { envelopeId },
      relations: ['booking'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Update contract with signature data
    contract.status = ContractStatus.SIGNED;
    contract.signedAt = new Date();
    contract.signatures = {
      customerSignature: {
        type: SignatureType.ELECTRONIC,
        signedAt: new Date(),
        ipAddress: signatureData.ipAddress || 'unknown',
        userAgent: signatureData.userAgent || 'unknown',
        initials: signatureData.initials,
        fullName: signatureData.fullName,
        email: signatureData.email,
      },
    };

    // Update booking status
    if (contract.booking) {
      contract.booking.status = BookingStatus.INSURANCE_VERIFIED;
      await this.bookingRepository.save(contract.booking);
    }

    return await this.contractRepository.save(contract);
  }

  /**
   * Generate contract PDF using Puppeteer
   */
  private async generateContractPDF(booking: Booking, dto: GenerateContractDto): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Generate HTML content for the contract
      const htmlContent = await this.generateContractHTML(booking, dto);

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1in',
          right: '1in',
          bottom: '1in',
          left: '1in',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate HTML content for the rental agreement
   */
  private async generateContractHTML(booking: Booking, dto: GenerateContractDto): Promise<string> {
    const customerName = dto.customerName || `${booking.customer.firstName} ${booking.customer.lastName}`;
    const currentDate = new Date().toLocaleDateString('en-CA');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rental Agreement - ${booking.bookingNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
          .signature-section { margin-top: 50px; page-break-inside: avoid; }
          .initials-box { display: inline-block; width: 100px; height: 30px; border: 1px solid #000; text-align: center; margin-right: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>U-Dig It Rentals Inc.</h1>
          <h2>Rental Agreement & Equipment-Specific Rider</h2>
          <p><strong>Contract #: ${booking.bookingNumber}</strong></p>
          <p><strong>Date:</strong> ${currentDate}</p>
        </div>

        <div class="section">
          <div class="section-title">1. Parties</div>
          <p><strong>Lessor:</strong> U-Dig It Rentals Inc., 945 Golden Grove Road, Saint John, New Brunswick, Canada, E2H 2X1</p>
          <p><strong>Lessee:</strong> ${customerName}, ${dto.customerEmail || booking.customer.email}</p>
        </div>

        <div class="section">
          <div class="section-title">2. Equipment</div>
          <table>
            <tr><th>Unit ID</th><td>${booking.equipment.unitId}</td></tr>
            <tr><th>Model</th><td>${booking.equipment.model}</td></tr>
            <tr><th>Serial Number</th><td>${booking.equipment.serialNumber}</td></tr>
            <tr><th>Replacement Value</th><td>$${booking.equipment.replacementValue.toLocaleString()}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">3. Rental Period</div>
          <table>
            <tr><th>Start Date</th><td>${booking.startDate.toLocaleDateString()}</td></tr>
            <tr><th>End Date</th><td>${booking.endDate.toLocaleDateString()}</td></tr>
            <tr><th>Duration</th><td>${Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24))} days</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">4. Rental Charges</div>
          <table>
            <tr><th>Subtotal</th><td>$${booking.subtotal.toFixed(2)}</td></tr>
            <tr><th>Taxes (HST 15%)</th><td>$${booking.taxes.toFixed(2)}</td></tr>
            <tr><th>Float Fee</th><td>$${booking.floatFee.toFixed(2)}</td></tr>
            <tr><th><strong>Total</strong></th><td><strong>$${booking.total.toFixed(2)}</strong></td></tr>
            <tr><th>Security Deposit</th><td>$${booking.securityDeposit.toFixed(2)}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">5. Terms & Conditions Acceptance</div>
          <p>By signing this agreement, the Lessee acknowledges that they have read, understood, and agree to be bound by the U-Dig It Rentals Inc. Terms & Conditions (Version ${envConfig.legal.termsVersion}) and the Equipment-Specific Rider (Version ${envConfig.legal.riderVersion}).</p>
        </div>

        <div class="section">
          <div class="section-title">6. Insurance Requirements (Rider Section 2)</div>
          <p>The Lessee must maintain Commercial General Liability insurance of not less than $2,000,000 per occurrence and insurance covering the rented equipment for its full replacement value ($120,000) naming U-Dig It Rentals Inc. as Additional Insured and Loss Payee.</p>
          <p><strong>Lessee Initials:</strong> <span class="initials-box">___</span> (Section 2 - Insurance)</p>
        </div>

        <div class="section">
          <div class="section-title">7. Transport & Tie-Down (Rider Section 3)</div>
          <p>Equipment must be transported using properly rated trailer, hitch, and tie-downs with minimum 4-point securement.</p>
          <p><strong>Lessee Initials:</strong> <span class="initials-box">___</span> (Section 3 - Transport & Tie-Down)</p>
        </div>

        <div class="section">
          <div class="section-title">8. Operating Limits & Safety (Rider Section 4)</div>
          <p>Maximum grade/slope: ≤ 25°. No riders. Follow all safety protocols and manufacturer guidelines.</p>
          <p><strong>Lessee Initials:</strong> <span class="initials-box">___</span> (Section 4 - Operating Limits & Safety)</p>
        </div>

        <div class="section">
          <div class="section-title">9. Prohibited Uses (Rider Section 5)</div>
          <p>No demolition, hazmat operations, or operation in saltwater/surf without written permission.</p>
          <p><strong>Lessee Initials:</strong> <span class="initials-box">___</span> (Section 5 - Prohibited Uses)</p>
        </div>

        <div class="section">
          <div class="section-title">10. Financial Terms (Rider Section 8)</div>
          <p>Security deposit: $500. Fuel must be returned full. Excessive cleaning billed at $100.</p>
          <p><strong>Lessee Initials:</strong> <span class="initials-box">___</span> (Section 8 - Financial Terms)</p>
        </div>

        <div class="signature-section">
          <div class="section-title">11. Signatures</div>
          <p><strong>Lessee Signature:</strong> ______________________________ Date: ________</p>
          <p><strong>Print Name:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${dto.customerEmail || booking.customer.email}</p>
        </div>

        <div class="signature-section">
          <p><strong>Lessor Signature:</strong> ______________________________ Date: ________</p>
          <p><strong>U-Dig It Rentals Inc.</strong></p>
        </div>

        <div style="margin-top: 30px; font-size: 10px; text-align: center;">
          <p>Document Hash: ${await this.calculateStringHash(`contract-${booking.id}-${Date.now()}`)}</p>
          <p>Generated on: ${new Date().toISOString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get PDF page count (simplified implementation)
   */
  private async getPDFPageCount(pdfBuffer: Buffer): Promise<number> {
    // This is a simplified implementation
    // In a real application, you might use a PDF library like pdf-lib
    return 8; // Estimated page count
  }

  /**
   * Calculate hash for string content
   */
  private async calculateStringHash(content: string): Promise<string> {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generate unique contract number
   */
  private async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = 'CON';

    // Get the count of contracts this year
    const count = await this.contractRepository.count({
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
   * Get contract by ID
   */
  async findOne(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['booking', 'booking.customer', 'booking.equipment'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  /**
   * Get contracts by booking ID
   */
  async findByBooking(bookingId: string): Promise<Contract[]> {
    return await this.contractRepository.find({
      where: { bookingId },
      relations: ['booking'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update contract status
   */
  async updateStatus(id: string, status: ContractStatus): Promise<Contract> {
    const contract = await this.findOne(id);

    contract.status = status;
    contract.updatedAt = new Date();

    // Add to audit trail
    if (!contract.auditTrail) contract.auditTrail = [];
    contract.auditTrail.push({
      action: `Status changed to ${status}`,
      timestamp: new Date(),
      ipAddress: 'system',
      userAgent: 'system',
      details: `Contract status updated to ${status}`,
    });

    return await this.contractRepository.save(contract);
  }

  /**
   * Void contract
   */
  async voidContract(id: string, reason: string): Promise<Contract> {
    const contract = await this.findOne(id);

    if (contract.status === ContractStatus.SIGNED) {
      throw new BadRequestException('Cannot void signed contract');
    }

    contract.status = ContractStatus.VOIDED;
    contract.updatedAt = new Date();

    // Add to audit trail
    if (!contract.auditTrail) contract.auditTrail = [];
    contract.auditTrail.push({
      action: 'Contract voided',
      timestamp: new Date(),
      ipAddress: 'system',
      userAgent: 'system',
      details: `Contract voided: ${reason}`,
    });

    return await this.contractRepository.save(contract);
  }
}

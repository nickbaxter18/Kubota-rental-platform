import { BadRequestException, Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InsuranceDocument } from '../entities/insurance-document.entity';
import { UploadInsuranceDto, ValidateInsuranceDto } from './dto/insurance.dto';
import { InsuranceService } from './insurance.service';

@ApiTags('Insurance')
@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload insurance document (COI)' })
  @ApiResponse({ status: 201, description: 'Insurance document uploaded successfully', type: InsuranceDocument })
  @ApiResponse({ status: 400, description: 'Invalid file or booking status' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async uploadInsurance(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadInsuranceDto,
  ): Promise<InsuranceDocument> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return await this.insuranceService.uploadInsuranceDocument(file, uploadDto);
  }

  @Post('validate/:insuranceDocumentId')
  @ApiOperation({ summary: 'Review and validate insurance document' })
  @ApiResponse({ status: 200, description: 'Insurance document validated successfully' })
  @ApiResponse({ status: 404, description: 'Insurance document not found' })
  async validateInsurance(
    @Param('insuranceDocumentId') insuranceDocumentId: string,
    @Body() validateDto: ValidateInsuranceDto,
  ): Promise<InsuranceDocument> {
    return await this.insuranceService.reviewInsuranceDocument(insuranceDocumentId, validateDto);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get all insurance documents for a booking' })
  @ApiResponse({ status: 200, description: 'Insurance documents retrieved successfully' })
  async getInsuranceDocuments(@Param('bookingId') bookingId: string): Promise<InsuranceDocument[]> {
    return await this.insuranceService.getInsuranceDocuments(bookingId);
  }

  @Get('booking/:bookingId/compliance')
  @ApiOperation({ summary: 'Get insurance compliance report for booking' })
  @ApiResponse({ status: 200, description: 'Compliance report generated successfully' })
  async getInsuranceCompliance(@Param('bookingId') bookingId: string) {
    return await this.insuranceService.getInsuranceComplianceReport(bookingId);
  }

  @Get('booking/:bookingId/can-release')
  @ApiOperation({ summary: 'Check if equipment can be released (No COI, No Release)' })
  @ApiResponse({ status: 200, description: 'Release eligibility checked successfully' })
  async canReleaseEquipment(@Param('bookingId') bookingId: string) {
    return await this.insuranceService.canReleaseEquipment(bookingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get insurance document by ID' })
  @ApiResponse({ status: 200, description: 'Insurance document retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Insurance document not found' })
  async getInsuranceDocument(@Param('id') id: string): Promise<InsuranceDocument> {
    return await this.insuranceService.getInsuranceDocument(id);
  }

  @Get('check-expired')
  @ApiOperation({ summary: 'Check for expired insurance documents' })
  @ApiResponse({ status: 200, description: 'Expired documents checked successfully' })
  async checkExpiredInsurance() {
    return await this.insuranceService.checkExpiredInsurance();
  }
}

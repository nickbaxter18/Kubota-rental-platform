import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Contract, ContractStatus } from '../entities/contract.entity';
import { ContractsService } from './contracts.service';
import { GenerateContractDto } from './dto/create-contract.dto';

@ApiTags('Contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate rental agreement PDF' })
  @ApiResponse({ status: 201, description: 'Contract generated successfully', type: Contract })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async generateContract(@Body() generateContractDto: GenerateContractDto): Promise<Contract> {
    return await this.contractsService.generateRentalAgreement(generateContractDto);
  }

  @Post(':id/send-for-signature')
  @ApiOperation({ summary: 'Send contract for DocuSign signature' })
  @ApiResponse({ status: 200, description: 'Contract sent for signature successfully' })
  @ApiResponse({ status: 400, description: 'DocuSign not enabled or contract not ready' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async sendForSignature(
    @Param('id') id: string,
    @Body() body: { customerEmail: string },
  ): Promise<{ envelopeId: string }> {
    return await this.contractsService.sendForSignature(id, body.customerEmail);
  }

  @Post(':id/process-signature')
  @ApiOperation({ summary: 'Process signature completion' })
  @ApiResponse({ status: 200, description: 'Signature processed successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async processSignatureCompletion(
    @Param('id') id: string,
    @Body() body: {
      envelopeId: string;
      signatureData: {
        fullName: string;
        email: string;
        initials: any;
        ipAddress?: string;
        userAgent?: string;
      };
    },
  ): Promise<Contract> {
    return await this.contractsService.processSignatureCompletion(
      body.envelopeId,
      body.signatureData,
    );
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get all contracts for a booking' })
  @ApiResponse({ status: 200, description: 'Contracts retrieved successfully' })
  async getContractsByBooking(@Param('bookingId') bookingId: string): Promise<Contract[]> {
    return await this.contractsService.findByBooking(bookingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiResponse({ status: 200, description: 'Contract retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getContract(@Param('id') id: string): Promise<Contract> {
    return await this.contractsService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download contract PDF' })
  @ApiResponse({ status: 200, description: 'Contract PDF downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async downloadContract(@Param('id') id: string) {
    const contract = await this.contractsService.findOne(id);

    if (!contract.documentContent) {
      throw new NotFoundException('Contract PDF not found');
    }

    // Return PDF as downloadable file
    return {
      fileName: contract.documentMetadata?.fileName || `contract-${contract.contractNumber}.pdf`,
      mimeType: 'application/pdf',
      content: Buffer.from(contract.documentContent, 'base64'),
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update contract status' })
  @ApiResponse({ status: 200, description: 'Contract status updated successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ContractStatus },
  ): Promise<Contract> {
    return await this.contractsService.updateStatus(id, body.status);
  }

  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void a contract' })
  @ApiResponse({ status: 200, description: 'Contract voided successfully' })
  @ApiResponse({ status: 400, description: 'Cannot void signed contract' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async voidContract(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ): Promise<Contract> {
    return await this.contractsService.voidContract(id, body.reason);
  }
}

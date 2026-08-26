import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  AdminDashboardService,
  FinancialReportFilters,
} from './admin-dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminDashboardService.getDashboard();
  }

  @Get('contributions/summary')
  async getContributionsSummary() {
    return this.adminDashboardService.getContributionsSummary();
  }

  @Get('contributions')
  async listContributions(
    @Query('channel') channel: 'AIRTIME' | 'BANK_TRANSFER' | undefined,
    @Query('status') status: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.adminDashboardService.listContributions(
      channel,
      status,
      page,
      pageSize,
    );
  }

  // =====================================================
  // STEP 9 — Admin financial reporting
  // =====================================================

  private parseFinancialFilters(
    dateFrom?: string,
    dateTo?: string,
    memberId?: string,
    operatorId?: string,
    bankId?: string,
    channel?: 'AIRTIME' | 'BANK_TRANSFER',
    status?: string,
    insuranceProviderId?: string,
    reference?: string,
  ): FinancialReportFilters {
    return {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      memberId: memberId ? Number(memberId) : undefined,
      operatorId: operatorId ? Number(operatorId) : undefined,
      bankId: bankId ? Number(bankId) : undefined,
      channel: channel || undefined,
      status: status || undefined,
      insuranceProviderId: insuranceProviderId ? Number(insuranceProviderId) : undefined,
      reference: reference || undefined,
    };
  }

  @Get('reports/financial/filters')
  async getFinancialReportFilterOptions() {
    return this.adminDashboardService.getFinancialReportFilterOptions();
  }

  @Get('reports/financial')
  async getFinancialReport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('memberId') memberId?: string,
    @Query('operatorId') operatorId?: string,
    @Query('bankId') bankId?: string,
    @Query('channel') channel?: 'AIRTIME' | 'BANK_TRANSFER',
    @Query('status') status?: string,
    @Query('insuranceProviderId') insuranceProviderId?: string,
    @Query('reference') reference?: string,
  ) {
    return this.adminDashboardService.getFinancialReport(
      this.parseFinancialFilters(
        dateFrom,
        dateTo,
        memberId,
        operatorId,
        bankId,
        channel,
        status,
        insuranceProviderId,
        reference,
      ),
    );
  }

  @Get('reports/financial/transactions')
  async listFinancialTransactions(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('memberId') memberId?: string,
    @Query('operatorId') operatorId?: string,
    @Query('bankId') bankId?: string,
    @Query('channel') channel?: 'AIRTIME' | 'BANK_TRANSFER',
    @Query('status') status?: string,
    @Query('insuranceProviderId') insuranceProviderId?: string,
    @Query('reference') reference?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize = 20,
  ) {
    return this.adminDashboardService.listFinancialTransactions(
      this.parseFinancialFilters(
        dateFrom,
        dateTo,
        memberId,
        operatorId,
        bankId,
        channel,
        status,
        insuranceProviderId,
        reference,
      ),
      page,
      pageSize,
    );
  }
}

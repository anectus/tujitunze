import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminDashboardService } from './admin-dashboard.service';
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
}

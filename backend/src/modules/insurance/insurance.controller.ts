import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { InsuranceService } from './insurance.service';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('insurance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.insuranceService.getDashboard(user.userId);
  }

  @Get('claims')
  async listClaims(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    return this.insuranceService.listClaims(user.userId, status);
  }

  @Patch('claims/:id/status')
  async updateClaimStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClaimStatusDto,
    @Req() request: Request,
  ) {
    return this.insuranceService.updateClaimStatus(
      user.userId,
      id,
      dto,
      request.ip,
    );
  }

  @Get('settlements')
  async listSettlements(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    return this.insuranceService.listSettlements(user.userId, status);
  }

  @Get('allocations')
  async listAllocations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.insuranceService.listAllocations(
      user.userId,
      status,
      page,
      pageSize,
    );
  }

  @Get('allocations/:id/trace')
  async getAllocationTrace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.insuranceService.getAllocationTrace(user.userId, id);
  }

  @Get('reports')
  async getReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    return this.insuranceService.getReports(user.userId, period);
  }
}

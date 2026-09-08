import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

// No @Roles(...) here — every authenticated role can call this endpoint,
// unlike almost every other controller in this codebase. RolesGuard still
// runs (harmlessly passes through when no roles are required — see
// roles.guard.ts) so JwtAuthGuard's authentication check is the only real
// gate at this layer; SearchService.search() is what actually scopes
// *what* each role's token is allowed to see.
@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query() query: SearchQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.searchService.search(query.q, user);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MonthQueryDto } from '../../common/query.dto';
import { CurrentUser } from '../auth/auth.decorators';
import { AnalyticsService } from './analytics.service';
@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}
  @Get('monthly') monthly(
    @CurrentUser() userId: string,
    @Query() query: MonthQueryDto,
  ) {
    return this.analytics.monthly(userId, query);
  }
}

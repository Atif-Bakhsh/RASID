import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MonthQueryDto } from '../../common/query.dto';
import { CurrentUser } from '../auth/auth.decorators';
import { InsightsService } from './insights.service';
@ApiTags('Insights')
@ApiBearerAuth()
@Controller('insights')
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}
  @Get() get(@CurrentUser() userId: string, @Query() query: MonthQueryDto) {
    return this.insights.get(userId, query);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MonthQueryDto } from '../../common/query.dto';
import { CurrentUser } from '../auth/auth.decorators';
import { AiInsightsService } from './ai-insights.service';
import { ExplainInsightsDto } from './dto/explain-insights.dto';
import { InsightsService } from './insights.service';
@ApiTags('Insights')
@ApiBearerAuth()
@Controller('insights')
export class InsightsController {
  constructor(
    private readonly insights: InsightsService,
    private readonly aiInsights: AiInsightsService,
  ) {}
  @Get() get(@CurrentUser() userId: string, @Query() query: MonthQueryDto) {
    return this.insights.get(userId, query);
  }

  @Post('explain')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  explain(@CurrentUser() userId: string, @Body() dto: ExplainInsightsDto) {
    return this.aiInsights.explain(userId, dto);
  }
}

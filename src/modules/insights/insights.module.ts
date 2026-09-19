import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { AiInsightsService } from './ai-insights.service';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { OpenAiAnalystClient } from './openai-analyst.client';
@Module({
  imports: [AnalyticsModule, BudgetsModule],
  controllers: [InsightsController],
  providers: [InsightsService, AiInsightsService, OpenAiAnalystClient],
})
export class InsightsModule {}

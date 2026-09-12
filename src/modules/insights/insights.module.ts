import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
@Module({
  imports: [AnalyticsModule, BudgetsModule],
  controllers: [InsightsController],
  providers: [InsightsService],
})
export class InsightsModule {}

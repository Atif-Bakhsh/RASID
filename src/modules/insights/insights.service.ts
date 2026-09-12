import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MonthQueryDto } from '../../common/query.dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { BudgetsService } from '../budgets/budgets.service';
import { evaluateInsights } from './insight-rules';
@Injectable()
export class InsightsService {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly budgets: BudgetsService,
    private readonly db: DataSource,
  ) {}
  async get(userId: string, query: MonthQueryDto) {
    return this.db.transaction('REPEATABLE READ', async (manager) => {
      const monthly = await this.analytics.monthly(userId, query, manager);
      const budgets = await this.budgets.list(
        userId,
        {
          ...query,
          month: monthly.month,
        },
        manager,
      );
      return {
        month: monthly.month,
        currency: query.currency,
        dataMode: 'DEMO_ONLY',
        disclaimerAr: 'ملاحظات وصفية من بيانات تجريبية، وليست نصيحة مالية.',
        disclaimerEn:
          'Descriptive observations from demo data; not financial advice.',
        data: evaluateInsights({
          income: monthly.income,
          spending: monthly.spending,
          previousSpending: monthly.comparison.spending,
          transactionCount: monthly.transactionCount,
          budgets: budgets.data,
        }),
      };
    });
  }
}

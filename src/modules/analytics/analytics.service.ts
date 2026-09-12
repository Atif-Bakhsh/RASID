import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { fromMinor, toMinor } from '../../common/money';
import {
  MonthQueryDto,
  monthRange,
  previousMonth,
  Currency,
} from '../../common/query.dto';
import { Obligation } from '../obligations/obligation.entity';

interface Totals {
  income: string;
  spending: string;
  transactionCount: number;
}
export interface CategoryTotal {
  categoryId: string | null;
  nameAr: string;
  nameEn: string;
  spending: string;
  transactionCount: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: DataSource) {}

  async monthly(
    userId: string,
    query: MonthQueryDto,
    transaction?: EntityManager,
  ) {
    // All cards reflect one database snapshot even if another request imports rows.
    const compute = async (manager: EntityManager) => {
      const { month, start, end } = monthRange(query.month);
      const previous = previousMonth(month);
      const current = await this.totals(manager, userId, query.currency, month);
      const prior = await this.totals(
        manager,
        userId,
        query.currency,
        previous,
      );
      const categories = await manager.query<CategoryTotal[]>(
        `
        SELECT t.category_id AS "categoryId", COALESCE(c.name_ar,'غير مصنف') AS "nameAr",
          COALESCE(c.name_en,'Uncategorized') AS "nameEn", SUM(t.amount)::text AS spending,
          COUNT(*)::int AS "transactionCount"
        FROM transactions t JOIN accounts a ON a.id = t.account_id LEFT JOIN categories c ON c.id = t.category_id
        WHERE a.user_id = $1 AND a.currency = $2 AND t.posted_at >= $3 AND t.posted_at < $4 AND t.direction = 'EXPENSE'
        GROUP BY t.category_id, c.name_ar, c.name_en ORDER BY SUM(t.amount) DESC, t.category_id ASC NULLS LAST
      `,
        [userId, query.currency, start, end],
      );
      const obligations = await manager.getRepository(Obligation).find({
        where: { userId, currency: query.currency, isActive: true },
        order: { dueDay: 'ASC', id: 'ASC' },
      });
      const obligationsTotal = fromMinor(
        obligations.reduce((sum, item) => sum + toMinor(item.amount), 0n),
      );
      const net = fromMinor(
        toMinor(current.income) - toMinor(current.spending),
      );
      return {
        month,
        currency: query.currency,
        ...current,
        net,
        categories,
        comparison: {
          previousMonth: previous,
          ...prior,
          spendingChange: fromMinor(
            toMinor(current.spending) - toMinor(prior.spending),
          ),
          spendingChangePercent:
            toMinor(prior.spending) === 0n
              ? null
              : Number(
                  ((toMinor(current.spending) - toMinor(prior.spending)) *
                    10000n) /
                    toMinor(prior.spending),
                ) / 100,
        },
        obligations: {
          total: obligationsTotal,
          interpretation: 'RECURRING_ESTIMATE_NOT_ADDITIONAL_SPENDING',
          items: obligations.map((item) => ({
            ...item,
            dueDate: `${month}-${String(item.dueDay).padStart(2, '0')}`,
          })),
        },
        dataMode: 'DEMO_ONLY',
      };
    };
    return transaction
      ? compute(transaction)
      : this.db.transaction('REPEATABLE READ', compute);
  }

  private async totals(
    manager: EntityManager,
    userId: string,
    currency: Currency,
    month: string,
  ): Promise<Totals> {
    const { start, end } = monthRange(month);
    const [result] = await manager.query<Totals[]>(
      `
      SELECT COALESCE(SUM(t.amount) FILTER (WHERE t.direction = 'INCOME'),0)::numeric(24,2)::text AS income,
        COALESCE(SUM(t.amount) FILTER (WHERE t.direction = 'EXPENSE'),0)::numeric(24,2)::text AS spending,
        COUNT(*)::int AS "transactionCount"
      FROM transactions t JOIN accounts a ON a.id = t.account_id
      WHERE a.user_id = $1 AND a.currency = $2 AND t.posted_at >= $3 AND t.posted_at < $4
    `,
      [userId, currency, start, end],
    );
    return result;
  }
}

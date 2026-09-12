import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { notFound } from '../../common/errors';
import { fromMinor, toMinor } from '../../common/money';
import { MonthQueryDto, monthRange } from '../../common/query.dto';
import { CategoriesService } from '../categories/categories.service';
import { positiveAmount } from '../transactions/transaction-facts';
import { Budget } from './budget.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

interface BudgetRow {
  id: string;
  categoryId: string;
  month: string;
  currency: string;
  limitAmount: string;
  spent: string;
  nameAr: string;
  nameEn: string;
}

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget) private readonly budgets: Repository<Budget>,
    private readonly db: DataSource,
    private readonly categories: CategoriesService,
  ) {}
  async create(userId: string, dto: CreateBudgetDto) {
    await this.categories.visible(userId, dto.categoryId);
    const budget = await this.budgets.save(
      this.budgets.create({
        ...dto,
        userId,
        month: `${dto.month}-01`,
        limitAmount: positiveAmount(dto.limitAmount),
      }),
    );
    return { ...budget, month: dto.month };
  }
  async list(
    userId: string,
    query: MonthQueryDto,
    manager: EntityManager = this.db.manager,
  ) {
    const { month, start, end } = monthRange(query.month);
    const rows = await manager.query<BudgetRow[]>(
      `
      SELECT b.id, b.category_id AS "categoryId", to_char(b.month, 'YYYY-MM') AS month, b.currency,
        b.limit_amount::text AS "limitAmount", c.name_ar AS "nameAr", c.name_en AS "nameEn",
        COALESCE(s.spent,0)::numeric(24,2)::text AS spent
      FROM budgets b JOIN categories c ON c.id = b.category_id
      LEFT JOIN (
        SELECT t.category_id, SUM(t.amount) AS spent FROM transactions t JOIN accounts a ON a.id = t.account_id
        WHERE a.user_id = $1 AND a.currency = $2 AND t.direction = 'EXPENSE' AND t.posted_at >= $3 AND t.posted_at < $4
        GROUP BY t.category_id
      ) s ON s.category_id = b.category_id
      WHERE b.user_id = $1 AND b.currency = $2 AND b.month = $3 ORDER BY b.id
    `,
      [userId, query.currency, start, end],
    );
    return {
      month,
      currency: query.currency,
      data: rows.map((row) => ({
        ...row,
        remaining: fromMinor(toMinor(row.limitAmount) - toMinor(row.spent)),
        utilizationPercent:
          Number((toMinor(row.spent) * 10000n) / toMinor(row.limitAmount)) /
          100,
        isExceeded: toMinor(row.spent) > toMinor(row.limitAmount),
      })),
    };
  }
  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    const budget = await this.budgets.findOneBy({ id, userId });
    if (!budget) notFound();
    if (dto.limitAmount !== undefined)
      await this.budgets.update(
        { id, userId },
        { limitAmount: positiveAmount(dto.limitAmount) },
      );
    const updated = await this.budgets.findOneByOrFail({ id, userId });
    return { ...updated, month: updated.month.slice(0, 7) };
  }
  async remove(userId: string, id: string) {
    const result = await this.budgets.delete({ id, userId });
    if (!result.affected) notFound();
  }
}

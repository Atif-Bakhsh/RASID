import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { fail, notFound, pgCode } from '../../common/errors';
import { paginated } from '../../common/query.dto';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/account.entity';
import { CategoriesService } from '../categories/categories.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { Transaction } from './transaction.entity';
import { fingerprint, positiveAmount } from './transaction-facts';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactions: Repository<Transaction>,
    private readonly db: DataSource,
    private readonly accounts: AccountsService,
    private readonly categories: CategoriesService,
  ) {}

  private ownedQuery(userId: string, manager?: EntityManager) {
    return (manager?.getRepository(Transaction) ?? this.transactions)
      .createQueryBuilder('t')
      .innerJoin(Account, 'a', 'a.id = t.accountId')
      .where('a.userId = :userId', { userId });
  }

  async create(userId: string, dto: CreateTransactionDto) {
    try {
      return await this.db.transaction(async (manager) => {
        await this.accounts.owned(userId, dto.accountId, manager);
        if (dto.categoryId)
          await this.categories.visible(userId, dto.categoryId, manager);
        const facts = {
          ...dto,
          amount: positiveAmount(dto.amount),
          categoryId: dto.categoryId ?? null,
          reference: dto.reference ?? null,
        };
        return manager.save(
          Transaction,
          manager.create(Transaction, {
            ...facts,
            fingerprint: fingerprint(facts),
            source: 'MANUAL',
          }),
        );
      });
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async list(userId: string, dto: TransactionQueryDto) {
    if (dto.accountId) await this.accounts.owned(userId, dto.accountId);
    if (dto.from && dto.to && dto.from > dto.to)
      fail(
        400,
        'INVALID_DATE_RANGE',
        'from must not be after to.',
        'بداية الفترة يجب ألا تتجاوز نهايتها.',
      );
    const q = this.ownedQuery(userId);
    if (dto.accountId)
      q.andWhere('t.accountId = :accountId', { accountId: dto.accountId });
    if (dto.categoryId)
      q.andWhere('t.categoryId = :categoryId', { categoryId: dto.categoryId });
    if (dto.direction)
      q.andWhere('t.direction = :direction', { direction: dto.direction });
    if (dto.currency)
      q.andWhere('a.currency = :currency', { currency: dto.currency });
    if (dto.from) q.andWhere('t.postedAt >= :from', { from: dto.from });
    if (dto.to) q.andWhere('t.postedAt <= :to', { to: dto.to });
    if (dto.search)
      q.andWhere('t.merchant ILIKE :search', {
        search: `%${dto.search.replace(/[\\%_]/g, '\\$&')}%`,
      });
    const columns = {
      postedAt: 't.postedAt',
      amount: 't.amount',
      createdAt: 't.createdAt',
    };
    q.orderBy(columns[dto.orderBy], dto.order).addOrderBy('t.id', dto.order);
    const [data, total] = await q
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit)
      .getManyAndCount();
    return paginated(data, total, dto);
  }

  async get(userId: string, id: string) {
    const transaction = await this.ownedQuery(userId)
      .andWhere('t.id = :id', { id })
      .getOne();
    if (!transaction) notFound();
    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    try {
      return await this.db.transaction(async (manager) => {
        const transaction = await this.ownedQuery(userId, manager)
          .andWhere('t.id = :id', { id })
          .setLock('pessimistic_write', undefined, ['t'])
          .getOne();
        if (!transaction) notFound();
        if (dto.categoryId)
          await this.categories.visible(userId, dto.categoryId, manager);
        const effective = { ...transaction, ...dto };
        effective.amount = positiveAmount(effective.amount);
        Object.assign(transaction, dto, {
          amount: effective.amount,
          fingerprint: fingerprint(effective),
        });
        return manager.save(Transaction, transaction);
      });
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async remove(userId: string, id: string) {
    const result = await this.transactions
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .andWhere(
        'account_id IN (SELECT id FROM accounts WHERE user_id = :userId)',
        { userId },
      )
      .execute();
    if (!result.affected) notFound();
  }

  private handleDuplicate(error: unknown): never {
    if (pgCode(error) === '23505')
      fail(
        409,
        'DUPLICATE_TRANSACTION',
        'An identical transaction exists in this account. Distinct purchases need distinct references.',
        'توجد عملية مطابقة في الحساب. استخدم مرجعاً مميزاً للعمليات المختلفة.',
      );
    throw error;
  }
}

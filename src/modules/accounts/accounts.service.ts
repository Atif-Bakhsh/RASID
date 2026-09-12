import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { fail, notFound } from '../../common/errors';
import { money } from '../../common/money';
import { paginated, PaginationDto } from '../../common/query.dto';
import { Account } from './account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account) private readonly accounts: Repository<Account>,
  ) {}

  create(userId: string, dto: CreateAccountDto) {
    return this.accounts.save(
      this.accounts.create({
        ...dto,
        userId,
        balance: money(dto.balance),
        balanceAsOf: new Date(dto.balanceAsOf),
      }),
    );
  }

  async list(userId: string, query: PaginationDto) {
    const [data, total] = await this.accounts.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: query.limit,
      skip: (query.page - 1) * query.limit,
    });
    return paginated(data, total, query);
  }

  async owned(
    userId: string,
    id: string,
    manager?: EntityManager,
  ): Promise<Account> {
    const account = await (
      manager?.getRepository(Account) ?? this.accounts
    ).findOneBy({ id, userId });
    if (!account) notFound();
    return account;
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.owned(userId, id);
    if ((dto.balance !== undefined) !== (dto.balanceAsOf !== undefined)) {
      fail(
        400,
        'BALANCE_TIMESTAMP_REQUIRED',
        'Send balance and balanceAsOf together.',
        'أرسل الرصيد وتاريخ الرصيد معاً.',
      );
    }
    const fields = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.balance !== undefined
        ? {
            balance: money(dto.balance),
            balanceAsOf: new Date(dto.balanceAsOf!),
          }
        : {}),
    };
    if (Object.keys(fields).length)
      await this.accounts.update({ id, userId }, fields);
    return this.owned(userId, id);
  }

  async remove(userId: string, id: string) {
    const result = await this.accounts.delete({ id, userId });
    if (!result.affected) notFound();
  }
}

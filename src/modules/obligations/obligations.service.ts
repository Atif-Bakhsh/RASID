import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { notFound } from '../../common/errors';
import { paginated, PaginationDto } from '../../common/query.dto';
import { CategoriesService } from '../categories/categories.service';
import { positiveAmount } from '../transactions/transaction-facts';
import { Obligation } from './obligation.entity';
import { CreateObligationDto } from './dto/create-obligation.dto';
import { UpdateObligationDto } from './dto/update-obligation.dto';

@Injectable()
export class ObligationsService {
  constructor(
    @InjectRepository(Obligation)
    private readonly obligations: Repository<Obligation>,
    private readonly categories: CategoriesService,
  ) {}
  async create(userId: string, dto: CreateObligationDto) {
    if (dto.categoryId) await this.categories.visible(userId, dto.categoryId);
    return this.obligations.save(
      this.obligations.create({
        ...dto,
        userId,
        amount: positiveAmount(dto.amount),
        categoryId: dto.categoryId ?? null,
      }),
    );
  }
  async list(userId: string, query: PaginationDto) {
    const [data, total] = await this.obligations.findAndCount({
      where: { userId },
      order: { dueDay: 'ASC', id: 'ASC' },
      take: query.limit,
      skip: (query.page - 1) * query.limit,
    });
    return paginated(data, total, query);
  }
  async update(userId: string, id: string, dto: UpdateObligationDto) {
    const record = await this.obligations.findOneBy({ id, userId });
    if (!record) notFound();
    if (dto.categoryId) await this.categories.visible(userId, dto.categoryId);
    if (Object.keys(dto).length)
      await this.obligations.update(
        { id, userId },
        {
          ...dto,
          ...(dto.amount !== undefined
            ? { amount: positiveAmount(dto.amount) }
            : {}),
        },
      );
    return this.obligations.findOneByOrFail({ id, userId });
  }
  async remove(userId: string, id: string) {
    const result = await this.obligations.delete({ id, userId });
    if (!result.affected) notFound();
  }
}

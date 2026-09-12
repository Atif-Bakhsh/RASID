import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { fail, notFound } from '../../common/errors';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}
  list(userId: string, manager?: EntityManager) {
    return (manager?.getRepository(Category) ?? this.categories)
      .createQueryBuilder('c')
      .where(
        new Brackets((q) =>
          q
            .where('c.ownerUserId IS NULL')
            .orWhere('c.ownerUserId = :userId', { userId }),
        ),
      )
      .orderBy('c.nameEn', 'ASC')
      .addOrderBy('c.id', 'ASC')
      .getMany();
  }
  async visible(userId: string, id: string, manager?: EntityManager) {
    const category = await (manager?.getRepository(Category) ?? this.categories)
      .createQueryBuilder('c')
      .where('c.id = :id', { id })
      .andWhere('(c.ownerUserId IS NULL OR c.ownerUserId = :userId)', {
        userId,
      })
      .getOne();
    if (!category) notFound();
    return category;
  }
  async create(userId: string, dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.visible(userId, dto.parentId);
      if (parent.parentId)
        fail(
          400,
          'CATEGORY_DEPTH',
          'Choose a root category as parent.',
          'اختر تصنيفاً رئيسياً كأصل.',
        );
    }
    return this.categories.save(
      this.categories.create({
        ...dto,
        ownerUserId: userId,
        parentId: dto.parentId ?? null,
      }),
    );
  }
  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.categories.findOneBy({
      id,
      ownerUserId: userId,
    });
    if (!category) notFound();
    if (Object.keys(dto).length)
      await this.categories.update({ id, ownerUserId: userId }, dto);
    return this.categories.findOneByOrFail({ id, ownerUserId: userId });
  }
  async remove(userId: string, id: string) {
    const result = await this.categories.delete({ id, ownerUserId: userId });
    if (!result.affected) notFound();
  }
}

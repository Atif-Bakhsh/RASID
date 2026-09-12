import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { DataSource, In, Repository } from 'typeorm';
import { fail, notFound, pgCode } from '../../common/errors';
import { paginated, PaginationDto } from '../../common/query.dto';
import { AccountsService } from '../accounts/accounts.service';
import { CategoriesService } from '../categories/categories.service';
import { Transaction } from '../transactions/transaction.entity';
import { parsePreview } from './csv-preview';
import { Import } from './import.entity';
import { PreviewRow } from './import.types';

@Injectable()
export class ImportsService {
  constructor(
    @InjectRepository(Import) private readonly imports: Repository<Import>,
    private readonly db: DataSource,
    private readonly accounts: AccountsService,
    private readonly categories: CategoriesService,
  ) {}

  async preview(
    userId: string,
    accountId: string,
    file: Express.Multer.File | undefined,
  ) {
    await this.accounts.owned(userId, accountId);
    if (!file)
      fail(
        400,
        'CSV_REQUIRED',
        'Attach a CSV in the file field.',
        'أرفق ملف CSV في حقل file.',
      );
    if (
      !/\.csv$/i.test(file.originalname) ||
      ![
        'text/csv',
        'application/csv',
        'application/vnd.ms-excel',
        'application/octet-stream',
      ].includes(file.mimetype)
    ) {
      fail(
        400,
        'CSV_FILE_TYPE',
        'Only CSV files are supported.',
        'تُقبل ملفات CSV فقط.',
      );
    }
    const contentHash = createHash('sha256').update(file.buffer).digest('hex');
    const previous = await this.imports.findOneBy({
      userId,
      accountId,
      contentHash,
    });
    if (previous) return this.present(previous);
    const categories = await this.categories.list(userId);
    const rows = parsePreview(
      file.buffer,
      accountId,
      new Set(categories.map((category) => category.id)),
    );
    const fingerprints = rows.flatMap((row) =>
      row.record ? [row.record.fingerprint] : [],
    );
    const existing = fingerprints.length
      ? await this.db.getRepository(Transaction).find({
          where: { accountId, fingerprint: In(fingerprints) },
          select: { fingerprint: true },
        })
      : [];
    const known = new Set(
      existing.map((transaction) => transaction.fingerprint),
    );
    for (const row of rows) {
      if (
        row.status === 'ACCEPTED' &&
        row.record &&
        known.has(row.record.fingerprint)
      ) {
        row.status = 'DUPLICATE';
        row.errors = ['DUPLICATE_IN_ACCOUNT'];
      }
    }
    const filename = [...(file.originalname.split(/[\\/]/).pop() ?? 'demo.csv')]
      .filter(
        (character) =>
          character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127,
      )
      .join('')
      .slice(0, 160);
    try {
      const batch = await this.imports.save(
        this.imports.create({
          userId,
          accountId,
          filename,
          contentHash,
          rows,
          status: 'PREVIEW',
          result: null,
          committedAt: null,
        }),
      );
      return this.present(batch);
    } catch (error) {
      if (pgCode(error) !== '23505') throw error;
      return this.present(
        await this.imports.findOneByOrFail({ userId, accountId, contentHash }),
      );
    }
  }

  async get(userId: string, id: string) {
    const batch = await this.imports.findOneBy({ id, userId });
    if (!batch) notFound();
    return this.present(batch);
  }

  async list(userId: string, query: PaginationDto) {
    const [batches, total] = await this.imports.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: query.limit,
      skip: (query.page - 1) * query.limit,
    });
    return paginated(
      batches.map((batch) => {
        const { rows, ...summary } = this.present(batch);
        void rows;
        return summary;
      }),
      total,
      query,
    );
  }

  async commit(userId: string, id: string, acknowledgeRejectedRows: boolean) {
    return this.db.transaction(async (manager) => {
      const batch = await manager
        .getRepository(Import)
        .createQueryBuilder('i')
        .where('i.id = :id AND i.userId = :userId', { id, userId })
        .setLock('pessimistic_write')
        .getOne();
      if (!batch) notFound();
      if (batch.status === 'COMMITTED') return this.present(batch);
      const invalid = batch.rows.filter(
        (row) => row.status === 'INVALID',
      ).length;
      if (invalid && !acknowledgeRejectedRows)
        fail(
          422,
          'IMPORT_HAS_ROW_ERRORS',
          'Review row errors and set acknowledgeRejectedRows=true to accept valid rows only.',
          'راجع أخطاء الصفوف وأكد استيراد الصفوف الصالحة فقط.',
        );
      await this.accounts.owned(userId, batch.accountId, manager);
      const accepted = batch.rows.flatMap((row) =>
        row.status === 'ACCEPTED' && row.record ? [row.record] : [],
      );
      const visibleIds = new Set(
        (await this.categories.list(userId, manager)).map(
          (category) => category.id,
        ),
      );
      if (
        accepted.some(
          (row) => row.categoryId && !visibleIds.has(row.categoryId),
        )
      )
        fail(
          409,
          'IMPORT_CATEGORY_CHANGED',
          'A preview category is no longer available. Upload a corrected CSV.',
          'أحد تصنيفات المعاينة لم يعد متاحاً. ارفع ملفاً مصححاً.',
        );
      let inserted = 0;
      if (accepted.length) {
        const result = await manager
          .createQueryBuilder()
          .insert()
          .into(Transaction)
          .values(
            accepted.map((record) => ({
              ...record,
              accountId: batch.accountId,
              importId: batch.id,
              source: 'CSV' as const,
            })),
          )
          .onConflict('(account_id, fingerprint) DO NOTHING')
          .returning('id')
          .execute();
        inserted = (result.raw as { id: string }[]).length;
      }
      batch.result = {
        inserted,
        duplicates:
          batch.rows.filter((row) => row.status === 'DUPLICATE').length +
          accepted.length -
          inserted,
        invalid,
      };
      batch.status = 'COMMITTED';
      batch.committedAt = new Date();
      await manager.save(Import, batch);
      return this.present(batch);
    });
  }

  private present(batch: Import) {
    const count = (status: PreviewRow['status']) =>
      batch.rows.filter((row) => row.status === status).length;
    return {
      ...batch,
      summary: {
        total: batch.rows.length,
        accepted: count('ACCEPTED'),
        duplicates: count('DUPLICATE'),
        invalid: count('INVALID'),
      },
    };
  }
}

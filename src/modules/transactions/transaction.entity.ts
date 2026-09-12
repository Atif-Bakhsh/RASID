import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { Direction } from '../../common/query.dto';

@Entity('transactions')
export class Transaction extends BaseEntity {
  @Column({ name: 'account_id', type: 'uuid' }) accountId!: string;
  @Column({ name: 'posted_at', type: 'date' }) postedAt!: string;
  @Column({ type: 'numeric', precision: 18, scale: 2 }) amount!: string;
  @Column({ type: 'varchar', length: 8 }) direction!: Direction;
  @Column({ type: 'varchar', length: 160 }) merchant!: string;
  @Column({ name: 'category_id', type: 'uuid', nullable: true }) categoryId!:
    string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) reference!:
    string | null;
  @Column({ type: 'varchar', length: 64 }) fingerprint!: string;
  @Column({ type: 'varchar', length: 12, default: 'MANUAL' }) source!:
    'MANUAL' | 'CSV' | 'SYNTHETIC';
  @Column({ name: 'import_id', type: 'uuid', nullable: true }) importId!:
    string | null;
}

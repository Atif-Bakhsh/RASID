import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { Currency } from '../../common/query.dto';

@Entity('obligations')
export class Obligation extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ type: 'varchar', length: 100 }) name!: string;
  @Column({ type: 'numeric', precision: 18, scale: 2 }) amount!: string;
  @Column({ type: 'varchar', length: 3 }) currency!: Currency;
  @Column({ name: 'due_day', type: 'smallint' }) dueDay!: number;
  @Column({ name: 'category_id', type: 'uuid', nullable: true }) categoryId!:
    string | null;
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { Currency } from '../../common/query.dto';

@Entity('budgets')
export class Budget extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ name: 'category_id', type: 'uuid' }) categoryId!: string;
  @Column({ type: 'date' }) month!: string;
  @Column({ type: 'varchar', length: 3 }) currency!: Currency;
  @Column({ name: 'limit_amount', type: 'numeric', precision: 18, scale: 2 })
  limitAmount!: string;
}

import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { Currency } from '../../common/query.dto';

export enum AccountType {
  CURRENT = 'CURRENT',
  SAVINGS = 'SAVINGS',
  CASH = 'CASH',
}

@Entity('accounts')
export class Account extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ type: 'varchar', length: 80 }) name!: string;
  @Column({ type: 'varchar', length: 16 }) type!: AccountType;
  @Column({ type: 'varchar', length: 3 }) currency!: Currency;
  @Column({ type: 'numeric', precision: 18, scale: 2 }) balance!: string;
  @Column({ name: 'balance_as_of', type: 'timestamptz' }) balanceAsOf!: Date;
}

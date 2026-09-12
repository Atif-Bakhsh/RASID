import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import type { CommitResult, PreviewRow } from './import.types';

@Entity('imports')
export class Import extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ name: 'account_id', type: 'uuid' }) accountId!: string;
  @Column({ type: 'varchar', length: 10, default: 'PREVIEW' }) status!:
    'PREVIEW' | 'COMMITTED';
  @Column({ type: 'varchar', length: 160 }) filename!: string;
  @Column({ name: 'content_hash', type: 'varchar', length: 64 })
  contentHash!: string;
  @Column({ type: 'jsonb' }) rows!: PreviewRow[];
  @Column({ type: 'jsonb', nullable: true }) result!: CommitResult | null;
  @Column({ name: 'committed_at', type: 'timestamptz', nullable: true })
  committedAt!: Date | null;
}

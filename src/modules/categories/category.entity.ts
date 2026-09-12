import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId!: string | null;
  @Column({ name: 'name_ar', type: 'varchar', length: 60 }) nameAr!: string;
  @Column({ name: 'name_en', type: 'varchar', length: 60 }) nameEn!: string;
  @Column({ name: 'parent_id', type: 'uuid', nullable: true }) parentId!:
    string | null;
}

import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 254, unique: true }) email!: string;
  @Column({ name: 'password_hash', type: 'text', select: false })
  passwordHash!: string;
  @Column({ type: 'varchar', length: 2, default: 'ar' }) locale!: 'ar' | 'en';
  @Column({ type: 'varchar', length: 100, default: 'Asia/Riyadh' })
  timezone!: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Direction } from '../../../common/query.dto';
import { MONEY_PATTERN } from '../../../common/money';
import { CalendarDate, Trim } from '../../../common/validation';

export class CreateTransactionDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') accountId!: string;
  @ApiProperty({ example: '2026-09-10', format: 'date' })
  @CalendarDate()
  postedAt!: string;
  @ApiProperty({ example: '42.50', type: String })
  @Matches(MONEY_PATTERN)
  amount!: string;
  @ApiProperty({ enum: Direction }) @IsEnum(Direction) direction!: Direction;
  @ApiProperty({ example: 'متجر تجريبي', maxLength: 160 })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  merchant!: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf((_object: unknown, value: unknown) => value != null)
  @IsUUID('4')
  categoryId?: string | null;
  @ApiPropertyOptional({
    nullable: true,
    maxLength: 100,
    description: 'Stable reference to distinguish otherwise identical records.',
  })
  @ValidateIf((_object: unknown, value: unknown) => value != null)
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  reference?: string | null;
}

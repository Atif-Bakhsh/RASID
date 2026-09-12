import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Currency, Direction, PaginationDto } from '../../../common/query.dto';
import { CalendarDate, Optional, Trim } from '../../../common/validation';

export class TransactionQueryDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @Optional()
  @IsUUID('4')
  accountId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @Optional()
  @IsUUID('4')
  categoryId?: string;
  @ApiPropertyOptional({ enum: Direction })
  @Optional()
  @IsEnum(Direction)
  direction?: Direction;
  @ApiPropertyOptional({ enum: Currency })
  @Optional()
  @IsEnum(Currency)
  currency?: Currency;
  @ApiPropertyOptional({ format: 'date', example: '2026-09-01' })
  @Optional()
  @CalendarDate()
  from?: string;
  @ApiPropertyOptional({ format: 'date', example: '2026-09-30' })
  @Optional()
  @CalendarDate()
  to?: string;
  @ApiPropertyOptional({
    description:
      'Literal case-insensitive merchant substring; % and _ are not wildcards.',
    maxLength: 80,
  })
  @Optional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  search?: string;
  @ApiPropertyOptional({
    enum: ['postedAt', 'amount', 'createdAt'],
    default: 'postedAt',
  })
  @IsIn(['postedAt', 'amount', 'createdAt'])
  orderBy: 'postedAt' | 'amount' | 'createdAt' = 'postedAt';
  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';
}

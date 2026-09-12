import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Matches, Max, Min } from 'class-validator';
import { Optional } from './validation';

export enum Currency {
  SAR = 'SAR',
  USD = 'USD',
  EUR = 'EUR',
}
export enum Direction {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 10000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class MonthQueryDto {
  @ApiPropertyOptional({
    example: '2026-09',
    description:
      'Defaults to current UTC calendar month. Booking dates are date-only.',
  })
  @Optional()
  @Matches(/^20\d{2}-(0[1-9]|1[0-2])$/)
  month?: string;

  @ApiPropertyOptional({ enum: Currency, default: Currency.SAR })
  @IsEnum(Currency)
  currency: Currency = Currency.SAR;
}

export function monthRange(month = new Date().toISOString().slice(0, 7)) {
  const start = `${month}-01`;
  const next = new Date(`${start}T00:00:00.000Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { month, start, end: next.toISOString().slice(0, 10) };
}

export function previousMonth(month: string) {
  const date = new Date(`${month}-01T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
}

export function paginated<T>(data: T[], total: number, query: PaginationDto) {
  return {
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

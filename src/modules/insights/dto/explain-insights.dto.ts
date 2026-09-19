import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Currency } from '../../../common/query.dto';
import { Optional, Trim } from '../../../common/validation';

export enum AnalystLocale {
  AR = 'ar',
  EN = 'en',
}

export class ExplainInsightsDto {
  @ApiPropertyOptional({ example: '2026-09' })
  @Optional()
  @Matches(/^20\d{2}-(0[1-9]|1[0-2])$/)
  month?: string;

  @ApiProperty({ enum: Currency, default: Currency.SAR })
  @IsEnum(Currency)
  currency: Currency = Currency.SAR;

  @ApiProperty({ enum: AnalystLocale })
  @IsEnum(AnalystLocale)
  locale!: AnalystLocale;

  @ApiPropertyOptional({ maxLength: 300 })
  @Optional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  question?: string;
}

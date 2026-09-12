import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Currency } from '../../../common/query.dto';
import { SIGNED_MONEY_PATTERN } from '../../../common/money';
import { Trim } from '../../../common/validation';
import { AccountType } from '../account.entity';

export class CreateAccountDto {
  @ApiProperty({ example: 'حساب تجريبي', maxLength: 80 })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ enum: AccountType }) @IsEnum(AccountType) type!: AccountType;
  @ApiProperty({ enum: Currency }) @IsEnum(Currency) currency!: Currency;
  @ApiProperty({
    example: '5000.00',
    type: String,
    description: 'Manual balance snapshot, not inferred from transactions.',
  })
  @Matches(SIGNED_MONEY_PATTERN)
  balance!: string;

  @ApiProperty({ example: '2026-09-01T09:00:00+03:00', format: 'date-time' })
  @IsDateString({ strict: true })
  @Matches(/T.*(Z|[+-]\d{2}:\d{2})$/)
  balanceAsOf!: string;
}

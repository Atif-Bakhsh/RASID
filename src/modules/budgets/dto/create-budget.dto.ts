import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, Matches } from 'class-validator';
import { Currency } from '../../../common/query.dto';
import { MONEY_PATTERN } from '../../../common/money';
export class CreateBudgetDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') categoryId!: string;
  @ApiProperty({ example: '2026-09' })
  @Matches(/^20\d{2}-(0[1-9]|1[0-2])$/)
  month!: string;
  @ApiProperty({ enum: Currency }) @IsEnum(Currency) currency!: Currency;
  @ApiProperty({ example: '1200.00', type: String })
  @Matches(MONEY_PATTERN)
  limitAmount!: string;
}

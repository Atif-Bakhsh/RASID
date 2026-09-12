import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { MONEY_PATTERN } from '../../../common/money';
import { Currency } from '../../../common/query.dto';
import { Trim } from '../../../common/validation';

export class CreateObligationDto {
  @ApiProperty({ example: 'إيجار تجريبي' })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
  @ApiProperty({ example: '1800.00', type: String })
  @Matches(MONEY_PATTERN)
  amount!: string;
  @ApiProperty({ enum: Currency }) @IsEnum(Currency) currency!: Currency;
  @ApiProperty({ minimum: 1, maximum: 28, example: 1 })
  @IsInt()
  @Min(1)
  @Max(28)
  dueDay!: number;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf((_object: unknown, value: unknown) => value != null)
  @IsUUID('4')
  categoryId?: string | null;
  @ApiPropertyOptional({ default: true }) @IsBoolean() isActive = true;
}

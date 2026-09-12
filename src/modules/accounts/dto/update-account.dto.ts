import { PartialType, PickType } from '@nestjs/swagger';
import { CreateAccountDto } from './create-account.dto';

export class UpdateAccountDto extends PartialType(
  PickType(CreateAccountDto, ['name', 'balance', 'balanceAsOf'] as const),
  { skipNullProperties: false },
) {}

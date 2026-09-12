import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTransactionDto } from './create-transaction.dto';
export class UpdateTransactionDto extends PartialType(
  OmitType(CreateTransactionDto, ['accountId'] as const),
  { skipNullProperties: false },
) {}

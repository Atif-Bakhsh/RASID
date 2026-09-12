import { PartialType, PickType } from '@nestjs/swagger';
import { CreateBudgetDto } from './create-budget.dto';
export class UpdateBudgetDto extends PartialType(
  PickType(CreateBudgetDto, ['limitAmount'] as const),
  { skipNullProperties: false },
) {}

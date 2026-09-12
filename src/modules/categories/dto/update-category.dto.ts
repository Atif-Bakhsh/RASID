import { PartialType, PickType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
export class UpdateCategoryDto extends PartialType(
  PickType(CreateCategoryDto, ['nameAr', 'nameEn'] as const),
  { skipNullProperties: false },
) {}

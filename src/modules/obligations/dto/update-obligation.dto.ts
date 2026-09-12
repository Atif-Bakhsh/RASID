import { OmitType, PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { Optional } from '../../../common/validation';
import { CreateObligationDto } from './create-obligation.dto';

// Omit default-valued field before making a PATCH DTO; omitted isActive must stay omitted.
export class UpdateObligationDto extends PartialType(
  OmitType(CreateObligationDto, ['isActive'] as const),
  { skipNullProperties: false },
) {
  @ApiPropertyOptional() @Optional() @IsBoolean() isActive?: boolean;
}

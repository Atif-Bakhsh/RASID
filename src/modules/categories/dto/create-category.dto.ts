import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Trim } from '../../../common/validation';

export class CreateCategoryDto {
  @ApiProperty({ example: 'القهوة', maxLength: 60 })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nameAr!: string;
  @ApiProperty({ example: 'Coffee', maxLength: 60 })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nameEn!: string;
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Visible root category; hierarchy is one level deep.',
  })
  @ValidateIf((_object: unknown, value: unknown) => value != null)
  @IsUUID('4')
  parentId?: string | null;
}

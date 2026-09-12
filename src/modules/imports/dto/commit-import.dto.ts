import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
export class CommitImportDto {
  @ApiPropertyOptional({
    default: false,
    description:
      'Required true when the preview contains INVALID rows; only ACCEPTED rows will be committed.',
  })
  @IsBoolean()
  acknowledgeRejectedRows = false;
}

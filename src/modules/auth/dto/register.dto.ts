import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { Timezone } from '../../../common/validation';
import { LoginDto } from './login.dto';

export class RegisterDto extends LoginDto {
  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsIn(['ar', 'en'])
  locale: 'ar' | 'en' = 'ar';

  @ApiPropertyOptional({ default: 'Asia/Riyadh' })
  @Timezone()
  timezone = 'Asia/Riyadh';
}

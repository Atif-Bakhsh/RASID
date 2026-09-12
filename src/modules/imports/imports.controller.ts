import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PaginationDto } from '../../common/query.dto';
import { CurrentUser } from '../auth/auth.decorators';
import { MAX_CSV_BYTES } from './csv-preview';
import { CommitImportDto } from './dto/commit-import.dto';
import { ImportsService } from './imports.service';

@ApiTags('CSV Imports')
@ApiBearerAuth()
@Controller('imports')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}
  @Post('accounts/:accountId/preview')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      // Busboy counts the closing boundary toward partsLimit; file/field limits enforce one file.
      limits: { fileSize: MAX_CSV_BYTES, files: 1, fields: 0, parts: 2 },
    }),
  )
  preview(
    @CurrentUser() userId: string,
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.imports.preview(userId, accountId, file);
  }
  @Get() list(@CurrentUser() userId: string, @Query() query: PaginationDto) {
    return this.imports.list(userId, query);
  }
  @Get(':id') get(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.imports.get(userId, id);
  }
  @Post(':id/commit')
  @HttpCode(200)
  commit(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CommitImportDto,
  ) {
    return this.imports.commit(userId, id, dto.acknowledgeRejectedRows);
  }
}

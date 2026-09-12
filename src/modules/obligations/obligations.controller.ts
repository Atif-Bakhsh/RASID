import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/query.dto';
import { CurrentUser } from '../auth/auth.decorators';
import { ObligationsService } from './obligations.service';
import { CreateObligationDto } from './dto/create-obligation.dto';
import { UpdateObligationDto } from './dto/update-obligation.dto';

@ApiTags('Obligations')
@ApiBearerAuth()
@Controller('obligations')
export class ObligationsController {
  constructor(private readonly obligations: ObligationsService) {}
  @Get() list(@CurrentUser() userId: string, @Query() query: PaginationDto) {
    return this.obligations.list(userId, query);
  }
  @Post() create(
    @CurrentUser() userId: string,
    @Body() dto: CreateObligationDto,
  ) {
    return this.obligations.create(userId, dto);
  }
  @Patch(':id') update(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateObligationDto,
  ) {
    return this.obligations.update(userId, id, dto);
  }
  @Delete(':id') @HttpCode(204) remove(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.obligations.remove(userId, id);
  }
}

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
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('Accounts')
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}
  @Post() create(@CurrentUser() userId: string, @Body() dto: CreateAccountDto) {
    return this.accounts.create(userId, dto);
  }
  @Get() list(@CurrentUser() userId: string, @Query() query: PaginationDto) {
    return this.accounts.list(userId, query);
  }
  @Get(':id') get(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.accounts.owned(userId, id);
  }
  @Patch(':id') update(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accounts.update(userId, id, dto);
  }
  @Delete(':id') @HttpCode(204) remove(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.accounts.remove(userId, id);
  }
}

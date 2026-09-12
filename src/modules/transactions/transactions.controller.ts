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
import { CurrentUser } from '../auth/auth.decorators';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}
  @Post() create(
    @CurrentUser() userId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactions.create(userId, dto);
  }
  @Get() list(
    @CurrentUser() userId: string,
    @Query() query: TransactionQueryDto,
  ) {
    return this.transactions.list(userId, query);
  }
  @Get(':id') get(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.transactions.get(userId, id);
  }
  @Patch(':id') update(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactions.update(userId, id, dto);
  }
  @Delete(':id') @HttpCode(204) remove(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.transactions.remove(userId, id);
  }
}

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
import { MonthQueryDto } from '../../common/query.dto';
import { CurrentUser } from '../auth/auth.decorators';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
@ApiTags('Budgets')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}
  @Get() list(@CurrentUser() userId: string, @Query() query: MonthQueryDto) {
    return this.budgets.list(userId, query);
  }
  @Post() create(@CurrentUser() userId: string, @Body() dto: CreateBudgetDto) {
    return this.budgets.create(userId, dto);
  }
  @Patch(':id') update(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgets.update(userId, id, dto);
  }
  @Delete(':id') @HttpCode(204) remove(
    @CurrentUser() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.budgets.remove(userId, id);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module';
import { Obligation } from './obligation.entity';
import { ObligationsController } from './obligations.controller';
import { ObligationsService } from './obligations.service';
@Module({
  imports: [TypeOrmModule.forFeature([Obligation]), CategoriesModule],
  controllers: [ObligationsController],
  providers: [ObligationsService],
})
export class ObligationsModule {}

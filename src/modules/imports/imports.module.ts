import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { CategoriesModule } from '../categories/categories.module';
import { Import } from './import.entity';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Import]),
    AccountsModule,
    CategoriesModule,
  ],
  controllers: [ImportsController],
  providers: [ImportsService],
})
export class ImportsModule {}

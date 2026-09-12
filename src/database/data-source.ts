import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { validateEnvironment, Environment } from '../config/environment';
import { User } from '../modules/auth/user.entity';
import { Session } from '../modules/auth/session.entity';
import { Account } from '../modules/accounts/account.entity';
import { Category } from '../modules/categories/category.entity';
import { Transaction } from '../modules/transactions/transaction.entity';
import { Import } from '../modules/imports/import.entity';
import { Budget } from '../modules/budgets/budget.entity';
import { Obligation } from '../modules/obligations/obligation.entity';
import { InitialSchema1788998400000 } from './migrations/1788998400000-initial-schema';

export function databaseOptions(env: Environment): DataSourceOptions {
  return {
    type: 'postgres',
    url: env.DATABASE_URL,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : false,
    entities: [
      User,
      Session,
      Account,
      Category,
      Transaction,
      Import,
      Budget,
      Obligation,
    ],
    migrations: [InitialSchema1788998400000],
    migrationsTransactionMode: 'all',
    synchronize: false,
    migrationsRun: false,
    logging: false,
    installExtensions: false,
    extra: {
      max: 10,
      connectionTimeoutMillis: 5000,
      statement_timeout: 10000,
      idle_in_transaction_session_timeout: 15000,
    },
    applicationName: 'rasid-api',
  };
}

export default new DataSource(
  databaseOptions(validateEnvironment(process.env)),
);

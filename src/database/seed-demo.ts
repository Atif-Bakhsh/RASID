import { isEmail } from 'class-validator';
import dataSource from './data-source';
import { User } from '../modules/auth/user.entity';
import { hashPassword } from '../modules/auth/password';
import { Account, AccountType } from '../modules/accounts/account.entity';
import { Currency, Direction, previousMonth } from '../common/query.dto';
import { Transaction } from '../modules/transactions/transaction.entity';
import { fingerprint } from '../modules/transactions/transaction-facts';
import { Budget } from '../modules/budgets/budget.entity';
import { Obligation } from '../modules/obligations/obligation.entity';
import { fromMinor, toMinor } from '../common/money';

async function seed() {
  const email = process.env.DEMO_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_PASSWORD;
  const month = process.env.DEMO_MONTH ?? new Date().toISOString().slice(0, 7);
  if (
    !email ||
    !isEmail(email) ||
    !email.endsWith('@example.test') ||
    !password ||
    password.length < 12 ||
    password.length > 128
  ) {
    throw new Error(
      'Set DEMO_EMAIL to an @example.test address and DEMO_PASSWORD to 12–128 characters before seeding.',
    );
  }
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error('DEMO_MONTH must be YYYY-MM between 2000 and 2099.');
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_DEMO_SEED !== 'true'
  )
    throw new Error('Production demo seeding requires ALLOW_DEMO_SEED=true.');
  await dataSource.initialize();
  try {
    if (await dataSource.getRepository(User).existsBy({ email })) {
      console.log(
        'Demo email already exists; nothing changed. Use another @example.test address for a fresh demo.',
      );
      return;
    }
    const passwordHash = await hashPassword(password);
    const result = await dataSource.transaction(async (manager) => {
      const user = await manager.save(
        User,
        manager.create(User, {
          email,
          passwordHash,
          locale: 'ar',
          timezone: 'Asia/Riyadh',
        }),
      );
      const account = await manager.save(
        Account,
        manager.create(Account, {
          userId: user.id,
          name: 'حساب جاري — بيانات اصطناعية',
          type: AccountType.CURRENT,
          currency: Currency.SAR,
          balance: '7600.00',
          balanceAsOf: new Date(`${month}-20T09:00:00Z`),
        }),
      );
      const cash = await manager.save(
        Account,
        manager.create(Account, {
          userId: user.id,
          name: 'نقد — بيانات اصطناعية',
          type: AccountType.CASH,
          currency: Currency.SAR,
          balance: '600.00',
          balanceAsOf: new Date(`${month}-20T09:00:00Z`),
        }),
      );
      await manager.save(
        Account,
        manager.create(Account, {
          userId: user.id,
          name: 'دولار — بيانات اصطناعية',
          type: AccountType.SAVINGS,
          currency: Currency.USD,
          balance: '1000.00',
          balanceAsOf: new Date(`${month}-20T09:00:00Z`),
        }),
      );
      const category = (suffix: number) =>
        `10000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
      const facts: [string, string, Direction, string, number][] = [
        ['01', '12000.00', Direction.INCOME, 'راتب تجريبي', 1],
        ['01', '3200.00', Direction.EXPENSE, 'إيجار تجريبي', 4],
        ['03', '420.75', Direction.EXPENSE, 'بقالة تجريبية', 2],
        ['04', '18.50', Direction.EXPENSE, 'قهوة تجريبية', 2],
        ['06', '85.00', Direction.EXPENSE, 'مواصلات تجريبية', 3],
        ['07', '230.00', Direction.EXPENSE, 'إنترنت تجريبي', 5],
        ['10', '160.00', Direction.EXPENSE, 'كتب تجريبية', 6],
        ['12', '48.25', Direction.EXPENSE, 'غداء تجريبي', 2],
        ['14', '300.00', Direction.INCOME, 'عمل إضافي تجريبي', 1],
        ['15', '120.00', Direction.EXPENSE, 'ترفيه تجريبي', 8],
        ['18', '95.00', Direction.EXPENSE, 'صيدلية تجريبية', 7],
        ['20', '260.50', Direction.EXPENSE, 'بقالة ثانية تجريبية', 2],
      ];
      const transactions = facts.map(
        ([day, amount, direction, merchant, cat], index) => {
          const value = {
            accountId: account.id,
            postedAt: `${month}-${day}`,
            amount,
            direction,
            merchant,
            categoryId: category(cat),
            reference: `synthetic-${month}-${index}`,
          };
          return manager.create(Transaction, {
            ...value,
            fingerprint: fingerprint(value),
            source: 'SYNTHETIC',
          });
        },
      );
      const bus = {
        accountId: cash.id,
        postedAt: `${month}-08`,
        amount: '15.00',
        direction: Direction.EXPENSE,
        merchant: 'حافلة تجريبية',
        categoryId: category(3),
        reference: `synthetic-bus-${month}`,
      };
      transactions.push(
        manager.create(Transaction, {
          ...bus,
          fingerprint: fingerprint(bus),
          source: 'SYNTHETIC',
        }),
      );
      const prior = {
        accountId: account.id,
        postedAt: `${previousMonth(month)}-15`,
        amount: '4000.00',
        direction: Direction.EXPENSE,
        merchant: 'مصروفات شهر سابق تجريبية',
        categoryId: category(2),
        reference: `synthetic-previous-${month}`,
      };
      transactions.push(
        manager.create(Transaction, {
          ...prior,
          fingerprint: fingerprint(prior),
          source: 'SYNTHETIC',
        }),
      );
      await manager.save(Transaction, transactions);
      await manager.save(
        Budget,
        manager.create(Budget, {
          userId: user.id,
          categoryId: category(2),
          month: `${month}-01`,
          currency: Currency.SAR,
          limitAmount: '700.00',
        }),
      );
      await manager.save(
        Obligation,
        manager.create(Obligation, {
          userId: user.id,
          name: 'إيجار شهري تجريبي',
          amount: '3200.00',
          currency: Currency.SAR,
          dueDay: 1,
          categoryId: category(4),
          isActive: true,
        }),
      );
      const current = transactions.filter((item) =>
        item.postedAt.startsWith(month),
      );
      const sum = (direction: Direction) =>
        current
          .filter((item) => item.direction === direction)
          .reduce((total, item) => total + toMinor(item.amount), 0n);
      return {
        dataMode: 'SYNTHETIC',
        email,
        month,
        accounts: 3,
        transactions: transactions.length,
        expected: {
          income: fromMinor(sum(Direction.INCOME)),
          spending: fromMinor(sum(Direction.EXPENSE)),
          net: fromMinor(sum(Direction.INCOME) - sum(Direction.EXPENSE)),
        },
      };
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await dataSource.destroy();
  }
}
void seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Seed failed');
  process.exitCode = 1;
});

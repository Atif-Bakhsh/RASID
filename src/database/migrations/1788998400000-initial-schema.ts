import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788998400000 implements MigrationInterface {
  name = 'InitialSchema1788998400000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email varchar(254) NOT NULL UNIQUE,
        password_hash text NOT NULL, locale varchar(2) NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar','en')),
        timezone varchar(100) NOT NULL DEFAULT 'Asia/Riyadh', created_at timestamptz NOT NULL DEFAULT now(),
        CHECK (email = lower(email))
      );
      CREATE TABLE sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash varchar(64) NOT NULL, expires_at timestamptz NOT NULL, revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX sessions_user_idx ON sessions(user_id, created_at DESC);
      CREATE TABLE accounts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar(80) NOT NULL CHECK (length(trim(name)) > 0),
        type varchar(16) NOT NULL CHECK (type IN ('CURRENT','SAVINGS','CASH')),
        currency varchar(3) NOT NULL CHECK (currency IN ('SAR','USD','EUR')),
        balance numeric(18,2) NOT NULL, balance_as_of timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id, user_id)
      );
      CREATE INDEX accounts_owner_idx ON accounts(user_id, created_at DESC, id);
      CREATE TABLE categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        name_ar varchar(60) NOT NULL CHECK (length(trim(name_ar)) > 0),
        name_en varchar(60) NOT NULL CHECK (length(trim(name_en)) > 0),
        parent_id uuid REFERENCES categories(id) ON DELETE RESTRICT, created_at timestamptz NOT NULL DEFAULT now(),
        CHECK (parent_id IS DISTINCT FROM id)
      );
      CREATE INDEX categories_owner_idx ON categories(owner_user_id);
      CREATE INDEX categories_parent_idx ON categories(parent_id);
      CREATE TABLE imports (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_id uuid NOT NULL, status varchar(10) NOT NULL DEFAULT 'PREVIEW' CHECK (status IN ('PREVIEW','COMMITTED')),
        filename varchar(160) NOT NULL, content_hash varchar(64) NOT NULL,
        rows jsonb NOT NULL CHECK (jsonb_typeof(rows) = 'array'), result jsonb, committed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(account_id, content_hash),
        FOREIGN KEY(account_id, user_id) REFERENCES accounts(id, user_id) ON DELETE RESTRICT,
        UNIQUE(id, account_id), CHECK ((status = 'COMMITTED') = (committed_at IS NOT NULL AND result IS NOT NULL))
      );
      CREATE INDEX imports_owner_idx ON imports(user_id, created_at DESC, id);
      CREATE TABLE transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
        posted_at date NOT NULL CHECK (posted_at >= '2000-01-01' AND posted_at < '2100-01-01'),
        amount numeric(18,2) NOT NULL CHECK (amount > 0 AND amount <= 999999999999.99),
        direction varchar(8) NOT NULL CHECK (direction IN ('INCOME','EXPENSE')),
        merchant varchar(160) NOT NULL CHECK (length(trim(merchant)) > 0),
        category_id uuid REFERENCES categories(id) ON DELETE RESTRICT, reference varchar(100),
        fingerprint varchar(64) NOT NULL, source varchar(12) NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL','CSV','SYNTHETIC')),
        import_id uuid, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(account_id, fingerprint),
        FOREIGN KEY(import_id, account_id) REFERENCES imports(id, account_id) ON DELETE RESTRICT
      );
      CREATE INDEX transactions_account_date_idx ON transactions(account_id, posted_at DESC, id DESC);
      CREATE INDEX transactions_category_idx ON transactions(category_id);
      CREATE INDEX transactions_import_idx ON transactions(import_id);
      CREATE TABLE budgets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        month date NOT NULL CHECK (extract(day FROM month) = 1 AND month >= '2000-01-01' AND month < '2100-01-01'),
        currency varchar(3) NOT NULL CHECK (currency IN ('SAR','USD','EUR')),
        limit_amount numeric(18,2) NOT NULL CHECK (limit_amount > 0 AND limit_amount <= 999999999999.99),
        created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, category_id, month)
      );
      CREATE INDEX budgets_category_idx ON budgets(category_id);
      CREATE TABLE obligations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar(100) NOT NULL CHECK (length(trim(name)) > 0),
        amount numeric(18,2) NOT NULL CHECK (amount > 0 AND amount <= 999999999999.99),
        currency varchar(3) NOT NULL CHECK (currency IN ('SAR','USD','EUR')),
        due_day smallint NOT NULL CHECK (due_day BETWEEN 1 AND 28),
        category_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
        is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX obligations_owner_idx ON obligations(user_id, currency, is_active);
      CREATE INDEX obligations_category_idx ON obligations(category_id);
      INSERT INTO categories(id, name_ar, name_en) VALUES
        ('10000000-0000-4000-8000-000000000001','الراتب','Salary'),
        ('10000000-0000-4000-8000-000000000002','الطعام','Food'),
        ('10000000-0000-4000-8000-000000000003','المواصلات','Transport'),
        ('10000000-0000-4000-8000-000000000004','السكن','Housing'),
        ('10000000-0000-4000-8000-000000000005','الفواتير','Utilities'),
        ('10000000-0000-4000-8000-000000000006','التسوق','Shopping'),
        ('10000000-0000-4000-8000-000000000007','الصحة','Health'),
        ('10000000-0000-4000-8000-000000000008','الترفيه','Entertainment');
    `);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE obligations, budgets, transactions, imports, categories, accounts, sessions, users',
    );
  }
}

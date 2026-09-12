import type {
  OpenAPIObject,
  OperationObject,
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger';

type Schema = SchemaObject | ReferenceObject;
const text: SchemaObject = { type: 'string' };
const uuid: SchemaObject = { type: 'string', format: 'uuid' };
const date: SchemaObject = { type: 'string', format: 'date' };
const timestamp: SchemaObject = { type: 'string', format: 'date-time' };
const amount: SchemaObject = {
  type: 'string',
  example: '42.50',
  description: 'Exact decimal string, never a JSON floating-point number.',
};
const integer: SchemaObject = { type: 'integer' };
const decimal: SchemaObject = { type: 'number' };
const boolean: SchemaObject = { type: 'boolean' };
const currency: SchemaObject = { type: 'string', enum: ['SAR', 'USD', 'EUR'] };
const month: SchemaObject = {
  type: 'string',
  pattern: '^20\\d{2}-(0[1-9]|1[0-2])$',
  example: '2026-09',
};
const ref = (name: string): ReferenceObject => ({
  $ref: `#/components/schemas/${name}`,
});
const array = (items: Schema): SchemaObject => ({ type: 'array', items });
const object = (
  properties: Record<string, Schema>,
  required = Object.keys(properties),
): SchemaObject => ({ type: 'object', properties, required });
const common = { id: uuid, createdAt: timestamp };
const totals = { income: amount, spending: amount, transactionCount: integer };
const baseBudget = {
  id: uuid,
  categoryId: uuid,
  month,
  currency,
  limitAmount: amount,
};
const obligation = {
  ...common,
  userId: uuid,
  name: text,
  amount,
  currency,
  dueDay: integer,
  categoryId: { ...uuid, nullable: true },
  isActive: boolean,
};
const importProperties = {
  ...common,
  userId: uuid,
  accountId: uuid,
  status: { type: 'string', enum: ['PREVIEW', 'COMMITTED'] } as SchemaObject,
  filename: text,
  contentHash: text,
  committedAt: { ...timestamp, nullable: true },
  result: {
    ...object({ inserted: integer, duplicates: integer, invalid: integer }),
    nullable: true,
  },
  summary: object({
    total: integer,
    accepted: integer,
    duplicates: integer,
    invalid: integer,
  }),
};

/** Response schemas are centralized because aggregate DTOs are not persistence entities. */
export function describeResponses(document: OpenAPIObject): OpenAPIObject {
  const schemas: Record<string, SchemaObject> = {
    ApiError: object({
      error: object(
        {
          code: text,
          message: text,
          messageAr: text,
          details: { type: 'array', items: {} },
        },
        ['code', 'message', 'messageAr'],
      ),
      requestId: text,
      timestamp,
    }),
    UserProfile: object({
      ...common,
      email: text,
      locale: { type: 'string', enum: ['ar', 'en'] },
      timezone: text,
      dataMode: { type: 'string', enum: ['DEMO_ONLY'] },
    }),
    AuthSession: object({
      accessToken: text,
      tokenType: { type: 'string', enum: ['Bearer'] },
      expiresIn: integer,
      sessionId: uuid,
      user: ref('UserProfile'),
    }),
    SessionRecord: object({
      ...common,
      userId: uuid,
      expiresAt: timestamp,
      revokedAt: { ...timestamp, nullable: true },
    }),
    AccountRecord: object({
      ...common,
      userId: uuid,
      name: text,
      type: { type: 'string', enum: ['CURRENT', 'SAVINGS', 'CASH'] },
      currency,
      balance: amount,
      balanceAsOf: timestamp,
    }),
    CategoryRecord: object({
      ...common,
      ownerUserId: { ...uuid, nullable: true },
      nameAr: text,
      nameEn: text,
      parentId: { ...uuid, nullable: true },
    }),
    TransactionRecord: object({
      ...common,
      accountId: uuid,
      postedAt: date,
      amount,
      direction: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
      merchant: text,
      categoryId: { ...uuid, nullable: true },
      reference: { ...text, nullable: true },
      fingerprint: text,
      source: { type: 'string', enum: ['MANUAL', 'CSV', 'SYNTHETIC'] },
      importId: { ...uuid, nullable: true },
    }),
    BudgetRecord: object({ ...common, ...baseBudget, userId: uuid }),
    BudgetUsage: object({
      ...baseBudget,
      nameAr: text,
      nameEn: text,
      spent: amount,
      remaining: amount,
      utilizationPercent: decimal,
      isExceeded: boolean,
    }),
    ObligationRecord: object(obligation),
    ImportRow: object(
      {
        row: integer,
        status: { type: 'string', enum: ['ACCEPTED', 'INVALID', 'DUPLICATE'] },
        errors: array(text),
        record: object({
          postedAt: date,
          amount,
          direction: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          merchant: text,
          categoryId: { ...uuid, nullable: true },
          reference: { ...text, nullable: true },
          fingerprint: text,
        }),
      },
      ['row', 'status', 'errors'],
    ),
    ImportSummary: object(importProperties),
    ImportPreview: object({
      ...importProperties,
      rows: array(ref('ImportRow')),
    }),
    MonthlyAnalytics: object({
      month,
      currency,
      ...totals,
      net: amount,
      categories: array(
        object({
          categoryId: { ...uuid, nullable: true },
          nameAr: text,
          nameEn: text,
          spending: amount,
          transactionCount: integer,
        }),
      ),
      comparison: object({
        previousMonth: month,
        ...totals,
        spendingChange: amount,
        spendingChangePercent: { ...decimal, nullable: true },
      }),
      obligations: object({
        total: amount,
        interpretation: {
          type: 'string',
          enum: ['RECURRING_ESTIMATE_NOT_ADDITIONAL_SPENDING'],
        },
        items: array(object({ ...obligation, dueDate: date })),
      }),
      dataMode: text,
    }),
    Insights: object({
      month,
      currency,
      dataMode: text,
      disclaimerAr: text,
      disclaimerEn: text,
      data: array(
        object({
          rule: {
            type: 'string',
            enum: [
              'NO_DATA',
              'SPENDING_ABOVE_INCOME',
              'SPENDING_INCREASE',
              'BUDGET_NEAR_LIMIT',
              'BUDGET_EXCEEDED',
            ],
          },
          version: integer,
          severity: { type: 'string', enum: ['info', 'warning'] },
          titleAr: text,
          titleEn: text,
          explanationAr: text,
          explanationEn: text,
          facts: {
            type: 'object',
            additionalProperties: { oneOf: [text, decimal] },
          },
        }),
      ),
    }),
    Budgets: object({ month, currency, data: array(ref('BudgetUsage')) }),
    ServiceInfo: object({
      name: text,
      version: text,
      dataMode: text,
      description: text,
      docs: text,
      health: text,
      readiness: text,
    }),
    Liveness: object({ status: text, service: text, dataMode: text }),
    Readiness: object({ status: text, service: text }),
  };
  const page = (name: string) => {
    const key = `${name}Page`;
    schemas[key] = object({
      data: array(ref(name)),
      meta: object({
        page: integer,
        limit: integer,
        total: integer,
        totalPages: integer,
      }),
    });
    return ref(key);
  };
  const responses: Record<string, Schema> = {
    'get /api/v1': ref('ServiceInfo'),
    'get /api/v1/health/live': ref('Liveness'),
    'get /api/v1/health/ready': ref('Readiness'),
    'get /api/v1/auth/me': ref('UserProfile'),
    'get /api/v1/auth/sessions': array(ref('SessionRecord')),
    'get /api/v1/analytics/monthly': ref('MonthlyAnalytics'),
    'get /api/v1/insights': ref('Insights'),
    'get /api/v1/budgets': ref('Budgets'),
    'get /api/v1/categories': array(ref('CategoryRecord')),
    'get /api/v1/imports': page('ImportSummary'),
    'get /api/v1/imports/{id}': ref('ImportPreview'),
    'post /api/v1/imports/accounts/{accountId}/preview': ref('ImportPreview'),
    'post /api/v1/imports/{id}/commit': ref('ImportPreview'),
  };
  for (const path of ['register', 'login', 'refresh'])
    responses[`post /api/v1/auth/${path}`] = ref('AuthSession');
  for (const [resource, name] of [
    ['accounts', 'AccountRecord'],
    ['transactions', 'TransactionRecord'],
    ['categories', 'CategoryRecord'],
    ['budgets', 'BudgetRecord'],
    ['obligations', 'ObligationRecord'],
  ]) {
    responses[`post /api/v1/${resource}`] = ref(name);
    responses[`patch /api/v1/${resource}/{id}`] = ref(name);
    if (['accounts', 'transactions'].includes(resource))
      responses[`get /api/v1/${resource}/{id}`] = ref(name);
    if (['accounts', 'transactions', 'obligations'].includes(resource))
      responses[`get /api/v1/${resource}`] = page(name);
  }
  document.components ??= {};
  document.components.schemas = { ...document.components.schemas, ...schemas };
  for (const [path, item] of Object.entries(document.paths)) {
    for (const [method, value] of Object.entries(item)) {
      if (!['get', 'post', 'patch', 'delete'].includes(method)) continue;
      const operation = value as OperationObject;
      const schema = responses[`${method} ${path.replace(/\/$/, '')}`];
      if (schema) {
        const code =
          Object.keys(operation.responses).find((code) =>
            code.startsWith('2'),
          ) ?? '200';
        operation.responses[code] = {
          description: 'Successful response. All records are demo data.',
          content: { 'application/json': { schema } },
        };
      }
      for (const status of [
        '400',
        '401',
        '403',
        '404',
        '409',
        '413',
        '422',
        '429',
        '500',
        '503',
      ])
        operation.responses[status] ??= {
          description:
            'Consistent error envelope; see error.code and requestId.',
          content: { 'application/json': { schema: ref('ApiError') } },
        };
    }
  }
  return document;
}

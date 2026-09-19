import { HttpException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Currency } from '../../common/query.dto';
import type { Environment } from '../../config/environment';
import { AiInsightsService } from './ai-insights.service';
import { AnalystLocale } from './dto/explain-insights.dto';
import type { InsightsService } from './insights.service';
import type { OpenAiAnalystClient } from './openai-analyst.client';

const snapshot = {
  monthly: {
    month: '2026-09',
    currency: Currency.SAR,
    income: '1000.00',
    spending: '250.00',
    net: '750.00',
    transactionCount: 2,
    categories: [],
    comparison: {
      previousMonth: '2026-08',
      income: '800.00',
      spending: '200.00',
      transactionCount: 2,
      spendingChange: '50.00',
      spendingChangePercent: 25,
    },
    obligations: {
      total: '0.00',
      interpretation: 'RECURRING_ESTIMATE_NOT_ADDITIONAL_SPENDING',
      items: [],
    },
    dataMode: 'DEMO_ONLY',
  },
  budgets: { month: '2026-09', currency: Currency.SAR, data: [] },
  rules: [],
};

function service(enabled: boolean, explain = jest.fn()) {
  const values: Partial<Environment> = {
    AI_ENABLED: enabled,
    OPENAI_MODEL: 'gpt-5.6-luna',
  };
  const config = {
    get: jest.fn((key: keyof Environment) => values[key]),
  } as unknown as ConfigService<Environment, true>;
  const snapshotRequest = jest.fn().mockResolvedValue(snapshot);
  const insights = { snapshot: snapshotRequest } as unknown as InsightsService;
  const client = { explain } as unknown as OpenAiAnalystClient;
  return {
    subject: new AiInsightsService(config, insights, client),
    snapshotRequest,
    explain,
  };
}

const dto = {
  month: '2026-09',
  currency: Currency.SAR,
  locale: AnalystLocale.EN,
};

describe('AI insights service', () => {
  it('fails closed without querying data when the optional feature is disabled', async () => {
    const { subject, snapshotRequest, explain } = service(false);
    await expect(subject.explain('user-id', dto)).rejects.toMatchObject({
      status: 503,
    });
    expect(snapshotRequest).not.toHaveBeenCalled();
    expect(explain).not.toHaveBeenCalled();
  });

  it('returns trusted evidence values, never model-provided values', async () => {
    const completion = jest.fn().mockResolvedValue({
      draft: {
        status: 'ANSWERED',
        answer: 'Recorded spending is 250.00 SAR.',
        evidenceIds: ['monthly.spending'],
      },
      usage: { inputTokens: 100, outputTokens: 20 },
    });
    const { subject, snapshotRequest } = service(true, completion);
    await expect(subject.explain('user-id', dto)).resolves.toMatchObject({
      status: 'ANSWERED',
      answer: 'Recorded spending is 250.00 SAR.',
      model: 'gpt-5.6-luna',
      promptVersion: 'monthly-analyst-v1',
      evidence: [{ id: 'monthly.spending', value: '250.00', unit: 'SAR' }],
    });
    expect(snapshotRequest).toHaveBeenCalledWith('user-id', dto);
  });

  it('converts provider and evidence-validation failures into AI_UNAVAILABLE', async () => {
    const { subject } = service(
      true,
      jest.fn().mockRejectedValue(new Error('provider failed')),
    );
    try {
      await subject.explain('user-id', dto);
      throw new Error('Expected request to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(503);
      expect((error as HttpException).getResponse()).toMatchObject({
        code: 'AI_UNAVAILABLE',
      });
    }
  });
});

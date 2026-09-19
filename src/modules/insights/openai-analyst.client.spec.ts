import type { ConfigService } from '@nestjs/config';
import { Currency } from '../../common/query.dto';
import type { Environment } from '../../config/environment';
import { AnalystLocale } from './dto/explain-insights.dto';
import { OpenAiAnalystClient } from './openai-analyst.client';

describe('OpenAI analyst client', () => {
  it('uses a stateless structured Responses request and parses output text', async () => {
    const values: Partial<Environment> = {
      OPENAI_API_KEY: 'secret-test-key',
      OPENAI_MODEL: 'gpt-5.6-luna',
      AI_TIMEOUT_MS: 10000,
    };
    const config = {
      get: jest.fn((key: keyof Environment) => values[key]),
    } as unknown as ConfigService<Environment, true>;
    let capturedRequest: RequestInit | undefined;
    const fetchRequest = jest.fn<Promise<Response>, Parameters<typeof fetch>>(
      (_input, request) => {
        capturedRequest = request;
        return Promise.resolve(
          new Response(
            JSON.stringify({
              output: [
                {
                  type: 'message',
                  content: [
                    {
                      type: 'output_text',
                      text: JSON.stringify({
                        status: 'ANSWERED',
                        answer: 'Spending is 250.00 SAR.',
                        evidenceIds: ['monthly.spending'],
                      }),
                    },
                  ],
                },
              ],
              usage: { input_tokens: 80, output_tokens: 18 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      },
    );
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchRequest,
    });
    const client = new OpenAiAnalystClient(config);
    await expect(
      client.explain({
        userId: 'user-one',
        locale: AnalystLocale.EN,
        facts: [
          {
            id: 'monthly.spending',
            labelAr: 'الإنفاق المسجل',
            labelEn: 'Recorded spending',
            value: '250.00',
            unit: Currency.SAR,
          },
        ],
      }),
    ).resolves.toMatchObject({
      draft: { status: 'ANSWERED' },
      usage: { inputTokens: 80, outputTokens: 18 },
    });
    if (!capturedRequest || typeof capturedRequest.body !== 'string')
      throw new Error('Expected a JSON request body');
    const body = JSON.parse(capturedRequest.body) as Record<string, unknown>;
    expect(body).toMatchObject({
      model: 'gpt-5.6-luna',
      store: false,
      reasoning: { effort: 'none' },
      max_output_tokens: 500,
      text: { format: { type: 'json_schema', strict: true } },
    });
    expect(body.safety_identifier).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(body)).not.toContain('secret-test-key');
  });

  it('rejects a provider error without exposing its response body', async () => {
    const config = {
      get: jest.fn((key: keyof Environment) =>
        key === 'AI_TIMEOUT_MS' ? 10000 : 'test',
      ),
    } as unknown as ConfigService<Environment, true>;
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: jest
        .fn()
        .mockResolvedValue(
          new Response('provider-secret-detail', { status: 429 }),
        ),
    });
    const client = new OpenAiAnalystClient(config);
    await expect(
      client.explain({
        userId: 'user-one',
        locale: AnalystLocale.EN,
        facts: [],
      }),
    ).rejects.toThrow('OpenAI request failed: 429');
  });

  it('reports an incomplete response before attempting to parse output', async () => {
    const config = {
      get: jest.fn((key: keyof Environment) =>
        key === 'AI_TIMEOUT_MS' ? 10000 : 'test',
      ),
    } as unknown as ConfigService<Environment, true>;
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 'incomplete',
            incomplete_details: { reason: 'max_output_tokens' },
            output: [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    });
    const client = new OpenAiAnalystClient(config);
    await expect(
      client.explain({
        userId: 'user-one',
        locale: AnalystLocale.EN,
        facts: [],
      }),
    ).rejects.toThrow('OpenAI response incomplete: max_output_tokens');
  });
});

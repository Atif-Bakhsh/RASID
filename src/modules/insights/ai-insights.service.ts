import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../config/environment';
import { fail } from '../../common/errors';
import { buildAnalystFacts, validateAnalystDraft } from './analyst-facts';
import type { ExplainInsightsDto } from './dto/explain-insights.dto';
import { InsightsService } from './insights.service';
import { OpenAiAnalystClient } from './openai-analyst.client';

const PROMPT_VERSION = 'monthly-analyst-v1';

@Injectable()
export class AiInsightsService {
  private readonly logger = new Logger(AiInsightsService.name);

  constructor(
    private readonly config: ConfigService<Environment, true>,
    private readonly insights: InsightsService,
    private readonly client: OpenAiAnalystClient,
  ) {}

  async explain(userId: string, dto: ExplainInsightsDto) {
    if (!this.config.get('AI_ENABLED', { infer: true })) this.unavailable();
    const snapshot = await this.insights.snapshot(userId, dto);
    const facts = buildAnalystFacts(snapshot);
    const startedAt = Date.now();
    try {
      const completion = await this.client.explain({
        userId,
        locale: dto.locale,
        question: dto.question,
        facts,
      });
      const draft = validateAnalystDraft(completion.draft, facts);
      const evidence = draft.evidenceIds.map((id) => {
        const fact = facts.find((item) => item.id === id)!;
        return fact;
      });
      this.logger.log({
        event: 'ai_insight_completed',
        model: this.config.get('OPENAI_MODEL', { infer: true }),
        promptVersion: PROMPT_VERSION,
        status: draft.status,
        evidenceCount: evidence.length,
        inputTokens: completion.usage.inputTokens,
        outputTokens: completion.usage.outputTokens,
        durationMs: Date.now() - startedAt,
      });
      return {
        month: snapshot.monthly.month,
        currency: dto.currency,
        locale: dto.locale,
        status: draft.status,
        answer: draft.answer,
        evidence,
        model: this.config.get('OPENAI_MODEL', { infer: true }),
        promptVersion: PROMPT_VERSION,
        dataMode: 'DEMO_ONLY',
        disclaimerAr:
          'شرح مولّد لبيانات تجريبية ومقيد بالأدلة المعروضة، وليس نصيحة مالية.',
        disclaimerEn:
          'AI-generated explanation of demo data, limited to the displayed evidence; not financial advice.',
      };
    } catch (error) {
      this.logger.warn({
        event: 'ai_insight_failed',
        model: this.config.get('OPENAI_MODEL', { infer: true }),
        promptVersion: PROMPT_VERSION,
        reason: error instanceof Error ? error.message : 'Unknown AI failure',
        durationMs: Date.now() - startedAt,
      });
      this.unavailable();
    }
  }

  private unavailable(): never {
    return fail(
      HttpStatus.SERVICE_UNAVAILABLE,
      'AI_UNAVAILABLE',
      'The optional AI explanation is unavailable. Your recorded overview remains available.',
      'الشرح الاختياري بالذكاء الاصطناعي غير متاح. تظل النظرة العامة المسجلة متاحة.',
    );
  }
}

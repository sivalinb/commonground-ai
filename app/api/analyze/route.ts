import { analyzeRequestSchema } from '@/lib/contracts';
import { issueApprovalToken } from '@/lib/approval';
import { consumeRateLimit, getDatabase, savePendingApproval } from '@/lib/db';
import { D1CheckpointSaver } from '@/lib/d1-checkpointer';
import { hasEvaluationAccess } from '@/lib/evaluation-access';
import { requireSameOrigin, secureJson } from '@/lib/http';
import { detectSensitiveData } from '@/lib/safety';
import { verifyTurnstile } from '@/lib/turnstile';
import { executeWorkflow, WorkflowExecutionError } from '@/lib/workflow';
import { workflowRuntimeFromEnvironment } from '@/lib/workflow-runtime';
import { ZodError } from 'zod';

function failureClass(error: unknown) {
  if (error instanceof WorkflowExecutionError)
    return `${error.stage}_${error.reason}`;
  const name =
    error && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : '';
  if (error instanceof ZodError || name.includes('Zod'))
    return 'provider_response_validation';
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Fireworks')) return 'model_provider';
  if (message.includes('Pinecone')) return 'retrieval_provider';
  if (message.includes('timed out')) return 'provider_timeout';
  return 'workflow_runtime';
}

export async function POST(request: Request) {
  const traceId = `cg_${crypto.randomUUID()}`;
  const evaluationAccess = hasEvaluationAccess(request);
  const preserveEvaluationCheckpoint =
    evaluationAccess &&
    request.headers.get('x-eval-preserve-checkpoint') === 'true';
  if (!requireSameOrigin(request))
    return secureJson(
      { error: 'Cross-origin requests are not accepted.', traceId },
      403,
    );
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return secureJson(
      { error: 'Content-Type must be application/json.', traceId },
      415,
    );
  }
  if (
    !(await consumeRateLimit(
      request,
      evaluationAccess ? 'evaluation' : 'analysis',
      evaluationAccess ? 100 : 20,
      10 * 60 * 1000,
    ))
  ) {
    return secureJson(
      { error: 'Demo request limit reached. Please try again later.', traceId },
      429,
    );
  }

  try {
    const parsed = analyzeRequestSchema.safeParse(await request.json());
    if (!parsed.success)
      return secureJson(
        {
          error: 'Use a fictional scenario between 20 and 3,000 characters.',
          traceId,
        },
        400,
      );
    const { caseText, jurisdiction, turnstileToken, retrievalMode } =
      parsed.data;
    const sensitive = detectSensitiveData(caseText);
    if (sensitive.length) {
      return secureJson(
        {
          error: `Privacy screen stopped this request because it may contain: ${sensitive.join(', ')}. Remove identifying details and try again.`,
          privacyBlocked: true,
          traceId,
        },
        422,
      );
    }
    const turnstile = evaluationAccess
      ? { verified: true, configured: true }
      : await verifyTurnstile(turnstileToken, request, 'commonground_analysis');
    if (!turnstile.verified)
      return secureJson(
        {
          error:
            'Human verification is required before using the live AI demo.',
          traceId,
        },
        403,
      );

    const runtime = workflowRuntimeFromEnvironment();
    const approvalSecret = process.env.APPROVAL_SIGNING_SECRET;
    if (!runtime || !approvalSecret) {
      return secureJson(
        { error: 'The live AI adapter is not configured.', traceId },
        503,
      );
    }

    const db = getDatabase();
    const checkpointer = db ? new D1CheckpointSaver(db) : undefined;

    const result = await executeWorkflow({
      caseText,
      jurisdiction,
      traceId,
      approvalId: crypto.randomUUID(),
      runtime: {
        ...runtime,
        retrievalMode: evaluationAccess ? retrievalMode : 'graph',
      },
      checkpointer,
    });
    if (
      result.awaitingApproval &&
      evaluationAccess &&
      !preserveEvaluationCheckpoint &&
      result.approvalId
    ) {
      await checkpointer
        ?.deleteThread(result.approvalId)
        .catch(() => undefined);
    } else if (result.awaitingApproval) {
      await savePendingApproval(result).catch(() => undefined);
    }
    const approvalToken = result.approvalId
      ? await issueApprovalToken(result.approvalId, approvalSecret)
      : undefined;
    return secureJson({
      ...result,
      approvalToken,
      turnstileConfigured: turnstile.configured,
    });
  } catch (error) {
    const classified = failureClass(error);
    console.error(
      traceId,
      classified,
      error instanceof Error ? error.message : 'Unknown live analysis error',
      error instanceof WorkflowExecutionError && error.cause instanceof Error
        ? error.cause.message
        : '',
    );
    return secureJson(
      {
        error: 'The live analysis could not complete. No action was taken.',
        failureClass: classified,
        failureStage:
          error instanceof WorkflowExecutionError ? error.stage : undefined,
        traceId,
      },
      502,
    );
  }
}

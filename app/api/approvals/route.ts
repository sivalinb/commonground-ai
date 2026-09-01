import { approvalRequestSchema } from '@/lib/contracts';
import { verifyApprovalToken } from '@/lib/approval';
import {
  consumeRateLimit,
  getDatabase,
  recordApproval,
  resetApprovalAfterResumeFailure,
} from '@/lib/db';
import { D1CheckpointSaver } from '@/lib/d1-checkpointer';
import { requireSameOrigin, secureJson } from '@/lib/http';
import { resumeWorkflow } from '@/lib/workflow';
import { workflowRuntimeFromEnvironment } from '@/lib/workflow-runtime';

export async function POST(request: Request) {
  if (!requireSameOrigin(request))
    return secureJson(
      { error: 'Cross-origin requests are not accepted.' },
      403,
    );
  if (!(await consumeRateLimit(request, 'approval', 20, 10 * 60 * 1000))) {
    return secureJson({ error: 'Approval request limit reached.' }, 429);
  }
  try {
    const parsed = approvalRequestSchema.safeParse(await request.json());
    if (!parsed.success)
      return secureJson({ error: 'The approval record is incomplete.' }, 400);
    const secret = process.env.APPROVAL_SIGNING_SECRET;
    if (
      !secret ||
      !(await verifyApprovalToken(
        parsed.data.approvalId,
        parsed.data.approvalToken,
        secret,
      ))
    ) {
      return secureJson(
        { error: 'This reviewer session is invalid or expired.' },
        403,
      );
    }
    const runtime = workflowRuntimeFromEnvironment();
    if (!runtime)
      return secureJson({ error: 'The workflow runtime is unavailable.' }, 503);
    const stored = await recordApproval(parsed.data);
    if (stored.persisted && stored.changed === false) {
      return secureJson(
        { error: 'This approval has already been completed.' },
        409,
      );
    }
    const db = getDatabase();
    const graphResumed = await resumeWorkflow(
      parsed.data.approvalId,
      parsed.data.decision,
      runtime,
      db ? new D1CheckpointSaver(db) : undefined,
    );
    if (!graphResumed) {
      await resetApprovalAfterResumeFailure(
        parsed.data.approvalId,
        parsed.data.decision,
      ).catch(() => undefined);
      return secureJson(
        { error: 'The durable workflow could not be resumed.' },
        409,
      );
    }
    return secureJson({ ...stored, graphResumed, noExternalActionTaken: true });
  } catch {
    return secureJson(
      { error: 'The approval decision could not be recorded.' },
      502,
    );
  }
}

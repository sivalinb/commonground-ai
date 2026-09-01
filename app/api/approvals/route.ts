import { approvalRequestSchema } from '@/lib/contracts';
import { consumeRateLimit, recordApproval } from '@/lib/db';
import { requireSameOrigin, secureJson } from '@/lib/http';
import { resumeWorkflow } from '@/lib/workflow';

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return secureJson({ error: 'Cross-origin requests are not accepted.' }, 403);
  if (!(await consumeRateLimit(request, 'approval', 20, 10 * 60 * 1000))) {
    return secureJson({ error: 'Approval request limit reached.' }, 429);
  }
  try {
    const parsed = approvalRequestSchema.safeParse(await request.json());
    if (!parsed.success) return secureJson({ error: 'The approval record is incomplete.' }, 400);
    const stored = await recordApproval(parsed.data);
    const graphResumed = await resumeWorkflow(parsed.data.approvalId, parsed.data.decision);
    return secureJson({ ...stored, graphResumed, noExternalActionTaken: true });
  } catch {
    return secureJson({ error: 'The approval decision could not be recorded.' }, 502);
  }
}

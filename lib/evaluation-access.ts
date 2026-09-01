function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function hasEvaluationAccess(request: Request) {
  const configured = process.env.EVAL_RUNNER_SECRET;
  const provided = request.headers.get('x-eval-runner-secret');
  return Boolean(
    configured && provided && constantTimeEqual(configured, provided),
  );
}

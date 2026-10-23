// Structured task data carried inside the existing UTF-8 message body.
// These fields never grant permissions or authorize real-project execution.
export const handoffFields = Object.freeze({
  test_report: ['tested_version', 'steps', 'expected', 'actual', 'requested_response'],
  clarification: ['questions', 'requested_response'],
  proposal: ['approach', 'open_questions', 'requested_response'],
  fix_report: ['changed_version', 'changes', 'verification', 'requested_response'],
  retest_result: ['tested_version', 'result', 'observations', 'requested_response'],
});
function record(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function text(value) { return typeof value === 'string' && value.trim().length > 0; }
const lists = new Set(['steps', 'questions', 'open_questions', 'changes', 'verification', 'observations']);
export function encodeHandoff(value) {
  if (!record(value)) throw new Error('Handoff must be an object');
  const allowed = ['schema', 'scope', 'type', 'case_id', 'revision', 'summary', 'references', 'details'];
  if (Object.keys(value).some(k => !allowed.includes(k))) throw new Error('Unknown handoff field');
  if (value.schema !== 'ab.handoff.v1' || value.scope !== 'fictional') throw new Error('Only ab.handoff.v1 fictional handoffs are supported');
  if (!Object.hasOwn(handoffFields, value.type)) throw new Error('Unsupported handoff type');
  if (!text(value.case_id) || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(value.case_id)) throw new Error('Invalid case_id');
  if (!Number.isSafeInteger(value.revision) || value.revision < 1) throw new Error('revision must be a positive safe integer');
  if (!text(value.summary)) throw new Error('summary is required');
  const fields = handoffFields[value.type];
  if (!record(value.details) || Object.keys(value.details).some(k => !fields.includes(k))) throw new Error('Invalid details fields');
  for (const field of fields) {
    const item = value.details[field];
    if (lists.has(field)) {
      if (!Array.isArray(item) || item.length > 30 || item.some(x => !text(x))) throw new Error(`Invalid list: ${field}`);
      if (['steps', 'questions', 'observations'].includes(field) && !item.length) throw new Error(`Empty list: ${field}`);
    } else if (!text(item)) throw new Error(`Missing text: ${field}`);
  }
  if (value.type === 'retest_result' && !['passed', 'failed', 'inconclusive'].includes(value.details.result)) throw new Error('Invalid retest result');
  if (value.references !== undefined && (!Array.isArray(value.references) || value.references.length > 20 || value.references.some(x => !text(x)))) throw new Error('Invalid references');
  const body = JSON.stringify(value);
  if (body.length > 8000) throw new Error('Handoff exceeds the existing 8000-character message limit');
  return body;
}

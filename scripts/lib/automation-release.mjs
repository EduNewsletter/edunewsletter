import { validateIssue } from './newsletter.mjs';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const JOB_ID_PATTERN = /^[A-Za-z0-9-]{8,200}$/;

export function validateAutomationReleaseJob(job) {
  const errors = [];
  const newsletterNo = Number(job?.newsletterNo);
  const versionNo = Number(job?.versionNo);
  const contentHash = String(job?.contentHash ?? '').trim().toLowerCase();
  const expectedIdempotencyKey =
    `${newsletterNo}:${versionNo}:create_release_artifacts:${contentHash}`;

  if (job?.schemaVersion !== 1) errors.push('schemaVersion muss 1 sein.');
  if (!JOB_ID_PATTERN.test(String(job?.jobId ?? ''))) errors.push('jobId ist ungültig.');
  if (job?.action !== 'create_release_artifacts') {
    errors.push('action muss create_release_artifacts sein.');
  }
  if (!Number.isInteger(newsletterNo) || newsletterNo < 1) {
    errors.push('newsletterNo muss eine positive Ganzzahl sein.');
  }
  if (!Number.isInteger(versionNo) || versionNo < 1) {
    errors.push('versionNo muss eine positive Ganzzahl sein.');
  }
  if (!SHA256_PATTERN.test(contentHash)) errors.push('contentHash muss ein SHA-256-Hash sein.');
  if (job?.idempotencyKey !== expectedIdempotencyKey) {
    errors.push('idempotencyKey stimmt nicht mit der Jobidentität überein.');
  }
  if (typeof job?.callbackToken !== 'string'
    || job.callbackToken.length < 32
    || job.callbackToken.length > 500) {
    errors.push('callbackToken ist ungültig.');
  }

  const issue = job?.payload?.issue;
  const version = job?.payload?.version;
  if (!issue || typeof issue !== 'object' || Array.isArray(issue)) {
    errors.push('payload.issue fehlt.');
  } else {
    errors.push(...validateIssue(issue).map((error) => `payload.issue: ${error}`));
    if (issue.issueNumber !== newsletterNo) {
      errors.push('payload.issue.issueNumber stimmt nicht mit newsletterNo überein.');
    }
  }

  if (!version || typeof version !== 'object' || Array.isArray(version)) {
    errors.push('payload.version fehlt.');
  } else {
    if (version.newsletterNo !== newsletterNo) {
      errors.push('payload.version.newsletterNo stimmt nicht mit newsletterNo überein.');
    }
    if (version.versionNo !== versionNo) {
      errors.push('payload.version.versionNo stimmt nicht mit versionNo überein.');
    }
    if (String(version.contentHash ?? '').toLowerCase() !== contentHash) {
      errors.push('payload.version.contentHash stimmt nicht mit contentHash überein.');
    }
  }

  return errors;
}

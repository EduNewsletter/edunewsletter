#!/usr/bin/env node
import crypto from 'node:crypto';
import { ghostDraftPayload, readIssue, renderHtml } from './lib/newsletter.mjs';

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function createToken(key) {
  const [id, secret] = key.split(':');
  if (!id || !secret || !/^[a-f0-9]+$/i.test(secret)) {
    throw new Error('GHOST_ADMIN_API_KEY hat nicht das erwartete Format <id>:<hex-secret>.');
  }
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'HS256', kid: id, typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', Buffer.from(secret, 'hex')).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

const file = process.argv[2];
if (!file) {
  console.error('Verwendung: node scripts/create-ghost-draft.mjs <issue.json>');
  process.exit(2);
}

try {
  const baseUrl = process.env.GHOST_ADMIN_API_URL;
  const key = process.env.GHOST_ADMIN_API_KEY;
  if (!baseUrl || !key) {
    throw new Error('GHOST_ADMIN_API_URL und GHOST_ADMIN_API_KEY müssen gesetzt sein.');
  }
  if (new URL(baseUrl).hostname !== 'edunewsletter.de') {
    throw new Error('Sicherheitsabbruch: GHOST_ADMIN_API_URL muss auf edunewsletter.de zeigen.');
  }

  const issue = await readIssue(file);
  const html = await renderHtml(issue);
  const post = ghostDraftPayload(issue, html);
  const endpoint = new URL('/ghost/api/admin/posts/?source=html', baseUrl);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Ghost ${createToken(key)}`,
      'Content-Type': 'application/json',
      'Accept-Version': 'v6.0',
    },
    body: JSON.stringify({ posts: [post] }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Ghost antwortete mit ${response.status}: ${result.errors?.[0]?.message ?? 'Unbekannter Fehler'}`);
  }
  const created = result.posts?.[0];
  console.log(JSON.stringify({ id: created?.id, title: created?.title, status: created?.status, url: created?.url }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const inputSchema = z.object({
  email: z.string().trim().email().max(160),
  name: z.string().trim().max(80).optional(),
  use: z.string().trim().max(500).optional(),
  source: z.enum(['landing', 'studio']),
  design: z.unknown().optional(),
  png: z.string().max(900_000).optional(),
})

export type WaitlistInput = z.infer<typeof inputSchema>

export type WaitlistResult =
  | { ok: true; via: 'kv' | 'resend' }
  | { ok: false; error: 'not_configured' | 'invalid' | 'upstream' }

function configuredKv() {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return { url: url.replace(/\/$/, ''), token }
}

function configuredResend() {
  const key = process.env.RESEND_API_KEY
  const to = process.env.RESEND_TO
  if (!key || !to) return null
  return { key, to, from: process.env.RESEND_FROM || 'Mission <onboarding@resend.dev>' }
}

/**
 * Stores a waitlist / reservation interest.
 *
 * TODO: connect storage before launch. Either
 *   - Vercel KV / Upstash: KV_REST_API_URL + KV_REST_API_TOKEN
 *   - or Resend: RESEND_API_KEY + RESEND_TO (optional RESEND_FROM)
 * Until one of those is set, submissions are logged and rejected. Never report success.
 */
export const submitWaitlist = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const parsed = inputSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error('Check the email address and try again.')
    }
    return parsed.data
  })
  .handler(async ({ data }): Promise<WaitlistResult> => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const record = {
      id,
      at: new Date().toISOString(),
      email: data.email,
      name: data.name ?? '',
      use: data.use ?? '',
      source: data.source,
      design: data.design ?? null,
      png: data.png ?? null,
    }

    const kv = configuredKv()
    if (kv) {
      const res = await fetch(`${kv.url}/set/waitlist:${id}/${encodeURIComponent(JSON.stringify(record))}?EX=31536000`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${kv.token}` },
      })
      if (!res.ok) {
        console.error('[waitlist] KV write failed', res.status)
        return { ok: false, error: 'upstream' }
      }
      return { ok: true, via: 'kv' }
    }

    const resend = configuredResend()
    if (resend) {
      const text = [
        `Source: ${record.source}`,
        `Email: ${record.email}`,
        `Name: ${record.name || '—'}`,
        `Use: ${record.use || '—'}`,
        '',
        record.design ? `Design JSON:\n${JSON.stringify(record.design, null, 2).slice(0, 80_000)}` : 'No design attached.',
        record.png ? '\nA PNG render was attached as a data URL in the JSON payload below.' : '',
      ].join('\n')
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resend.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: resend.from,
          to: [resend.to],
          subject: `Mission interest · ${record.source} · ${record.email}`,
          text: record.png ? `${text}\n\nPNG (data URL, may be long):\n${record.png}` : text,
        }),
      })
      if (!res.ok) {
        console.error('[waitlist] Resend failed', res.status, await res.text().catch(() => ''))
        return { ok: false, error: 'upstream' }
      }
      return { ok: true, via: 'resend' }
    }

    // TODO: wire KV or Resend. This log is the only record until then.
    console.warn('[TODO waitlist] storage is not configured. Submission was NOT saved.', {
      id,
      email: record.email,
      name: record.name,
      use: record.use,
      source: record.source,
      hasDesign: record.design != null,
      hasPng: Boolean(record.png),
    })
    return { ok: false, error: 'not_configured' }
  })

import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function sendEmail(to, subject, html) {
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const from = process.env.RESEND_FROM ?? 'DevPlatform <noreply@example.com>'

  await resend.emails.send({
    from,
    to,
    subject,
    html,
  })
}

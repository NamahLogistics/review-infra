import { Resend } from 'resend'

function getRequiredEnv(name: string) {
  const value = process.env[name] || ''
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

export function getMailer() {
  const apiKey = getRequiredEnv('RESEND_API_KEY')
  const from = getRequiredEnv('EMAIL_FROM')
  const resend = new Resend(apiKey)

  return {
    async send(params: {
      to: string
      subject: string
      html: string
      replyTo?: string
    }) {
      const { data, error } = await resend.emails.send({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        replyTo: params.replyTo,
      })

      if (error) {
        throw new Error(typeof error === 'string' ? error : JSON.stringify(error))
      }

      return data
    },
  }
}

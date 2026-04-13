import express from 'express'
import { db } from './db'
import { getMailer } from './mailer'
import { requireUser } from './middleware/require-user'

export const testEmailRouter = express.Router()

testEmailRouter.post('/', requireUser, async (req: any, res) => {
  try {
    const { storeId, email } = req.body || {}

    if (!storeId || !email) {
      return res.status(400).json({ error: 'storeId and email required' })
    }

    const store = await db.store.findFirst({
      where: { id: storeId, userId: req.user.id },
      include: { settings: true },
    })

    if (!store) {
      return res.status(404).json({ error: 'Store not found' })
    }

    const subject = store.settings?.emailSubject || 'How was your experience?'
    const body = (store.settings?.emailBody || 'Hi {{name}}, how was your experience with {{product}}?')
      .split('{{name}}').join( 'Shubham')
      .split('{{product}}').join( 'Night')

    const mailer = getMailer()
    const data = await mailer.send({
      to: email,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <p>This is a test email from Review Infra.</p>
          <p>${body}</p>
        </div>
      `,
    })

    return res.json({ success: true, data })
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to send test email' })
  }
})

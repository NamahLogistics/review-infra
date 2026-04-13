import { Router } from 'express'
import { db } from './db'
import { requireUser } from './middleware/require-user'

export const reviewSettingsRouter = Router()

const DEFAULT_SUBJECT = 'How was your experience?'
const DEFAULT_BODY = 'Hi {{name}}, how was your experience with {{product}}? You can leave your review here: {{review_link}}'

function preset(level: string) {
  if (level === 'low') return { sendDelayDays: 5, followUpDelayDays: 0 }
  if (level === 'high') return { sendDelayDays: 2, followUpDelayDays: 2 }
  return { sendDelayDays: 3, followUpDelayDays: 2 }
}

reviewSettingsRouter.get('/:storeId', requireUser, async (req: any, res) => {
  const store = await db.store.findFirst({
    where: { id: req.params.storeId, userId: req.user.id },
  })

  if (!store) return res.status(404).json({ error: 'Store not found' })

  let settings = await db.reviewSettings.findUnique({
    where: { storeId: store.id },
  })

  if (!settings) {
    settings = await db.reviewSettings.create({
      data: {
        storeId: store.id,
        isEnabled: store.autoReviewEnabled,
        maxReminders: store.maxReminders,
        sendDelayDays: store.sendAfterDays,
        emailSubject: DEFAULT_SUBJECT,
        emailBody: DEFAULT_BODY,
      },
    })
  }

  res.json(settings)
})

reviewSettingsRouter.post('/:storeId', requireUser, async (req: any, res) => {
  const store = await db.store.findFirst({
    where: { id: req.params.storeId, userId: req.user.id },
  })

  if (!store) return res.status(404).json({ error: 'Store not found' })

  let settings = await db.reviewSettings.findUnique({
    where: { storeId: store.id },
  })

  if (!settings) {
    settings = await db.reviewSettings.create({
      data: {
        storeId: store.id,
        isEnabled: store.autoReviewEnabled,
        maxReminders: store.maxReminders,
        sendDelayDays: store.sendAfterDays,
        emailSubject: DEFAULT_SUBJECT,
        emailBody: DEFAULT_BODY,
      },
    })
  }

  const body = req.body || {}
  const data: any = {}

  if (typeof body.isEnabled === 'boolean') data.isEnabled = body.isEnabled
  if (typeof body.maxReminders === 'number') data.maxReminders = body.maxReminders
  if (typeof body.sendDelayDays === 'number') data.sendDelayDays = body.sendDelayDays
  if (typeof body.followUpDelayDays === 'number') data.followUpDelayDays = body.followUpDelayDays
  if (typeof body.emailSubject === 'string') data.emailSubject = body.emailSubject
  if (typeof body.emailBody === 'string') data.emailBody = body.emailBody

  if (typeof body.nudgingLevel === 'string') {
    const p = preset(body.nudgingLevel)
    data.nudgingLevel = body.nudgingLevel
    data.sendDelayDays = p.sendDelayDays
    data.followUpDelayDays = p.followUpDelayDays
  }

  const updated = await db.reviewSettings.update({
    where: { storeId: store.id },
    data,
  })

  await db.store.update({
    where: { id: store.id },
    data: {
      autoReviewEnabled: updated.isEnabled,
      maxReminders: updated.maxReminders,
      sendAfterDays: updated.sendDelayDays,
    },
  })

  res.json(updated)
})

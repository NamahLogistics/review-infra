import express from 'express';

export const cronRouter = express.Router();

cronRouter.post('/run-auto-nudges', async (req, res) => {
  const incoming = String(req.headers['x-cron-secret'] || '');
  const secret = process.env.CRON_SECRET || '';

  if (!secret || incoming !== secret) {
    return res.status(401).json({ error: 'Invalid cron secret' });
  }

  const workerToken = process.env.AUTO_NUDGE_WORKER_TOKEN || '';

  const runRes = await fetch(`http://127.0.0.1:${process.env.PORT || 4000}/auto-nudges/run`, {
    method: 'POST',
    headers: {
      'x-worker-token': workerToken,
    },
  });

  const json = await runRes.json();
  res.json(json);
});

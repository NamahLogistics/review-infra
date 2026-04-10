import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from './db';
import { requireUser } from './middleware/require-user';

export const userAuthRouter = express.Router();

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

userAuthRouter.post('/register', async (req, res) => {
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { email, password } = parsed.data;

  const existing = await db.user.findUnique({
    where: { email },
  });

  if (existing) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      email,
      password: hashed,
    },
  });

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || '',
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  });
});

userAuthRouter.post('/login', async (req, res) => {
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.password);

  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || '',
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  });
});

userAuthRouter.get('/me', requireUser, async (req: any, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
  });
});

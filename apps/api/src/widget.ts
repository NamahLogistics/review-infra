import express from 'express';
import fs from 'fs';
import path from 'path';

export const widgetRouter = express.Router();

widgetRouter.get('/widget.js', (_req, res) => {
  const file = path.join(process.cwd(), '..', '..', 'packages', 'widget', 'embed', 'widget.js');
  res.setHeader('Content-Type', 'application/javascript');
  res.send(fs.readFileSync(file, 'utf-8'));
});

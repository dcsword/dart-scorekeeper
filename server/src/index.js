import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { matchesRouter } from './routes.matches.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(morgan('dev'));
app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN }));

app.get('/health', (req, res) => {
  res.json({ ok: true, at: new Date().toISOString() });
});

app.use('/api/matches', matchesRouter);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

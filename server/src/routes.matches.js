import express from 'express';
import { nanoid } from 'nanoid';
import { prisma } from './prisma.js';
import { calcVisit, applyVisit } from './rules.js';

export const matchesRouter = express.Router();

function toClient(match) {
  const players = [...match.players].sort((a, b) => a.order - b.order);
  const turns = match.turns ? [...match.turns] : [];
  return { ...match, players, turns };
}

matchesRouter.post('/', async (req, res) => {
  const { startScore = 501, playersCount = 2, players = [], doubleOut = false } = req.body || {};

  const pc = Number(playersCount) === 1 ? 1 : 2;
  const safeStart = Number.isFinite(Number(startScore)) ? Math.max(1, Math.floor(Number(startScore))) : 501;

  const names = pc === 1
    ? [players?.[0]?.name || 'Player 1']
    : [players?.[0]?.name || 'Player 1', players?.[1]?.name || 'Player 2'];

  const matchId = nanoid();

  const match = await prisma.match.create({
    data: {
      id: matchId,
      startScore: safeStart,
      playersCount: pc,
      doubleOut: Boolean(doubleOut),
      currentPlayerIndex: 0,
      players: {
        create: names.map((name, idx) => ({
          id: nanoid(),
          name,
          score: safeStart,
          order: idx
        }))
      }
    },
    include: { players: true, turns: true }
  });

  res.status(201).json(toClient(match));
});

matchesRouter.get('/:id', async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: req.params.id },
    include: { players: true, turns: { orderBy: { createdAt: 'asc' } } }
  });
  if (!match) return res.status(404).json({ message: 'Match not found' });
  res.json(toClient(match));
});

matchesRouter.post('/:id/turns', async (req, res) => {
  const matchId = req.params.id;
  const { playerId, darts = [] } = req.body || {};

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true }
  });
  if (!match) return res.status(404).json({ message: 'Match not found' });

  const players = [...match.players].sort((a, b) => a.order - b.order);
  const player = players.find(p => p.id === playerId);
  if (!player) return res.status(400).json({ message: 'Invalid playerId' });

  // Turn order enforcement for 2-player mode
  if (match.playersCount === 2) {
    const expected = players[match.currentPlayerIndex];
    if (!expected || expected.id !== playerId) {
      return res.status(409).json({ message: `Turn order: it's ${expected?.name || 'the other player'}'s turn` });
    }
  }

  const { darts: parsed, total, lastIsDouble } = calcVisit(darts);
  const before = player.score;
  const { busted, nextScore, reason } = applyVisit({
    currentScore: before,
    visitTotal: total,
    doubleOut: match.doubleOut,
    lastIsDouble
  });

  const turnId = nanoid();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.turn.create({
      data: {
        id: turnId,
        matchId,
        playerId,
        darts: parsed,
        total,
        scoreBefore: before,
        scoreAfter: nextScore,
        busted,
        bustReason: busted ? reason : null
      }
    });

    await tx.player.update({
      where: { id: playerId },
      data: { score: nextScore }
    });

    let nextIndex = match.currentPlayerIndex;
    if (match.playersCount === 2) {
      nextIndex = (match.currentPlayerIndex + 1) % 2;
    }

    await tx.match.update({
      where: { id: matchId },
      data: { currentPlayerIndex: nextIndex }
    });

    return tx.match.findUnique({
      where: { id: matchId },
      include: { players: true, turns: { orderBy: { createdAt: 'asc' } } }
    });
  });

  res.status(201).json({ match: toClient(updated), turnId });
});

matchesRouter.post('/:id/undo', async (req, res) => {
  const matchId = req.params.id;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true, turns: { orderBy: { createdAt: 'desc' }, take: 1 } }
  });
  if (!match) return res.status(404).json({ message: 'Match not found' });

  const last = match.turns?.[0];
  if (!last) return res.status(400).json({ message: 'No turns to undo' });

  const players = [...match.players].sort((a, b) => a.order - b.order);
  const idx = players.findIndex(p => p.id === last.playerId);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.player.update({
      where: { id: last.playerId },
      data: { score: last.scoreBefore }
    });

    await tx.turn.delete({ where: { id: last.id } });

    await tx.match.update({
      where: { id: matchId },
      data: { currentPlayerIndex: idx >= 0 ? idx : 0 }
    });

    return tx.match.findUnique({
      where: { id: matchId },
      include: { players: true, turns: { orderBy: { createdAt: 'asc' } } }
    });
  });

  res.json({ match: toClient(updated), undone: last });
});

matchesRouter.get('/', async (req, res) => {
  const matches = await prisma.match.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { players: true, turns: { select: { id: true } } }
  });

  const list = matches.map(m => ({
    id: m.id,
    createdAt: m.createdAt,
    startScore: m.startScore,
    playersCount: m.playersCount,
    doubleOut: m.doubleOut,
    currentPlayerIndex: m.currentPlayerIndex,
    players: [...m.players].sort((a, b) => a.order - b.order).map(p => ({ id: p.id, name: p.name, score: p.score })),
    turns: m.turns.length
  }));

  res.json(list);
});

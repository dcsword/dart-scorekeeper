/**
 * Dart parsing + 501 rules.
 *
 * Input per dart supports:
 * - number: "20" (points only; not flagged as double)
 * - notation: S20, D20, T20
 * - bulls: SBULL (25), DBULL (50)
 *
 * Fewer-than-3 darts:
 * - Leave remaining darts blank (""), they will be treated as "not thrown".
 * - "0" means a dart was thrown and missed (still counts as thrown).
 */

const DART_RE = /^(S|D|T)\s*(\d{1,2})$/i;

export function parseDart(raw) {
  if (raw === null || raw === undefined) return { raw: '', points: 0, isDouble: false, thrown: false };
  const s = String(raw).trim().toUpperCase();
  if (s === '') return { raw: '', points: 0, isDouble: false, thrown: false };

  // Bulls
  if (s === 'SBULL' || s === 'BULL' || s === '25') {
    return { raw: s, points: 25, isDouble: false, thrown: true };
  }
  if (s === 'DBULL' || s === '50') {
    return { raw: s, points: 50, isDouble: true, thrown: true };
  }

  // Notation S/D/T
  const m = s.match(DART_RE);
  if (m) {
    const mult = m[1];
    const base = Math.max(0, Math.min(20, parseInt(m[2], 10)));
    const mul = mult === 'S' ? 1 : mult === 'D' ? 2 : 3;
    return { raw: s, points: base * mul, isDouble: mult === 'D', thrown: true };
  }

  // Plain number (including 0)
  const n = Number(s);
  if (Number.isFinite(n)) {
    const points = Math.max(0, Math.min(60, Math.floor(n)));
    return { raw: s, points, isDouble: false, thrown: true };
  }

  // Unknown token => treat as thrown but 0 points
  return { raw: s, points: 0, isDouble: false, thrown: true };
}

export function calcVisit(dartsRaw) {
  // Keep exactly 3 slots for consistent UI/history,
  // but allow blanks to mean "not thrown".
  const darts = (dartsRaw || []).slice(0, 3).map(parseDart);
  while (darts.length < 3) darts.push(parseDart(''));

  const total = darts.reduce((a, d) => a + d.points, 0);

  // Determine last *thrown* dart (blank means not thrown)
  const lastThrown = [...darts].reverse().find(d => d.thrown) || null;
  const lastIsDouble = Boolean(lastThrown?.isDouble);

  return { darts, total, lastIsDouble };
}

export function applyVisit({ currentScore, visitTotal, doubleOut, lastIsDouble }) {
  const next = currentScore - visitTotal;

  // Standard bust if below 0
  if (next < 0) return { busted: true, nextScore: currentScore, reason: 'Below zero' };

  if (!doubleOut) {
    // Simple: 0 is allowed to finish
    return { busted: false, nextScore: next, reason: null };
  }

  // Double-out rules:
  // - cannot leave 1
  // - if hitting 0, last thrown dart must be a double
  if (next === 1) {
    return { busted: true, nextScore: currentScore, reason: 'Cannot finish on 1 (double-out)' };
  }
  if (next === 0 && !lastIsDouble) {
    return { busted: true, nextScore: currentScore, reason: 'Finish requires a double (double-out)' };
  }

  return { busted: false, nextScore: next, reason: null };
}

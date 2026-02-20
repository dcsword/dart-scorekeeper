const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function http(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  createMatch: (payload) => http('/api/matches', { method: 'POST', body: JSON.stringify(payload) }),
  getMatch: (id) => http(`/api/matches/${id}`),
  addTurn: (id, payload) => http(`/api/matches/${id}/turns`, { method: 'POST', body: JSON.stringify(payload) }),
  undo: (id) => http(`/api/matches/${id}/undo`, { method: 'POST' })
};

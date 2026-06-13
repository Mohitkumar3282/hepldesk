import apiClient from './apiClient.js';

/** Build a query string from a filters object, dropping empty values. */
function toQuery(params = {}) {
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

export async function listTickets(filters) {
  const res = await apiClient.get('/tickets', { params: toQuery(filters) });
  return res.data;
}

export async function getStats() {
  const res = await apiClient.get('/tickets/stats');
  return res.data;
}

export async function getTicket(id) {
  const res = await apiClient.get(`/tickets/${id}`);
  return res.data;
}

export async function createTicket(payload) {
  const res = await apiClient.post('/tickets', payload);
  return res.data;
}

export async function updateStatus(id, status, version) {
  const res = await apiClient.patch(`/tickets/${id}/status`, { status, version });
  return res.data;
}

export async function addComment(id, text, version) {
  const res = await apiClient.post(`/tickets/${id}/comments`, { text, version });
  return res.data;
}

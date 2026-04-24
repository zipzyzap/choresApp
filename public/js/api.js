/*
  All HTTP calls to the backend live here.
  Components never call fetch() directly — they go through this module.
  This makes it easy to swap endpoints, add auth headers, or mock for testing.
*/

const Api = {

  // ── Internal helper ──────────────────────────────────────────

  async _request(method, url, body) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  // ── Children ─────────────────────────────────────────────────

  getChildren:       ()       => Api._request('GET',    '/api/children'),
  getChild:          (id)     => Api._request('GET',    `/api/children/${id}`),
  createChild:       (data)   => Api._request('POST',   '/api/children', data),
  updateChild:       (id, data) => Api._request('PATCH', `/api/children/${id}`, data),
  deleteChild:       (id)     => Api._request('DELETE', `/api/children/${id}`),

  // ── Columns ──────────────────────────────────────────────────

  getColumns:        (childId)  => Api._request('GET',    `/api/columns?child_id=${childId}`),
  createColumn:      (data)     => Api._request('POST',   '/api/columns', data),
  updateColumn:      (id, data) => Api._request('PATCH',  `/api/columns/${id}`, data),
  deleteColumn:      (id)       => Api._request('DELETE', `/api/columns/${id}`),

  // ── Items ────────────────────────────────────────────────────

  getItems:          (columnId) => Api._request('GET',    `/api/items?column_id=${columnId}`),
  createItem:        (data)     => Api._request('POST',   '/api/items', data),
  updateItem:        (id, data) => Api._request('PATCH',  `/api/items/${id}`, data),
  deleteItem:        (id)       => Api._request('DELETE', `/api/items/${id}`),

  // ── Completions ──────────────────────────────────────────────

  getCompletions:    (childId, date) => Api._request('GET', `/api/completions?child_id=${childId}&date=${date}`),
  completeItem:      (data)          => Api._request('POST',   '/api/completions', data),
  uncompleteItem:    (data)          => Api._request('DELETE', '/api/completions', data),
  getLog:            (childId, limit) => Api._request('GET', `/api/completions/log?child_id=${childId}&limit=${limit || 30}`),

  // ── Rewards ──────────────────────────────────────────────────

  getRewards:        (childId) => Api._request('GET',    `/api/rewards?child_id=${childId}`),
  createReward:      (data)    => Api._request('POST',   '/api/rewards', data),
  updateReward:      (id, data) => Api._request('PATCH', `/api/rewards/${id}`, data),
  deleteReward:      (id)      => Api._request('DELETE', `/api/rewards/${id}`),
  redeemReward:      (id, childId) => Api._request('POST', `/api/rewards/${id}/redeem`, { child_id: childId }),

  // ── Settings ─────────────────────────────────────────────────

  getSettings:       ()        => Api._request('GET',   '/api/settings'),
  updateSettings:    (data)    => Api._request('PATCH', '/api/settings', data),
  verifyPin:         (pin)     => Api._request('POST',  '/api/settings/verify-pin', { pin }),
  adjustPoints:      (data)    => Api._request('POST',  '/api/settings/adjust-points', data),
  resetDatabase:     (pin)     => Api._request('POST',  '/api/settings/reset', { pin }),

};
import { apiJson, request, readJson, errorMessage, ApiError } from '../../api';

// Host requests use the host token issued at login; guest requests use the
// album's guest session token instead.
const as = (guestToken) => (guestToken ? { guest: guestToken } : 'host');
const hostJson = (path, options) => apiJson(path, { auth: 'host', ...options });
const base = (id) => `/api/events/${encodeURIComponent(id)}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const eventApi = {
  list: () => hostJson('/api/events', { fallback: 'We couldn’t load your event albums.' }).then((b) => b.events),
  create: (fields) =>
    hostJson('/api/events', { method: 'POST', json: fields, fallback: 'Could not create the event.' }).then((b) => b.event),
  get: (id, guestToken) =>
    apiJson(base(id), { auth: as(guestToken), fallback: 'We couldn’t load this album.' }).then((b) => b.event),
  update: (id, changes) =>
    hostJson(base(id), { method: 'PATCH', json: changes, fallback: 'Could not save the settings.' }).then((b) => b.event),

  listPhotos: (id, cursor, guestToken) =>
    apiJson(`${base(id)}/photos${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, {
      auth: as(guestToken),
      fallback: 'We couldn’t load the photos.',
    }),
  updatePhoto: (id, photoId, changes) =>
    hostJson(`${base(id)}/photos/${photoId}`, { method: 'PATCH', json: changes, fallback: 'Could not update the photo.' })
      .then((b) => b.photo),
  removePhoto: (id, photoId) =>
    hostJson(`${base(id)}/photos/${photoId}`, { method: 'DELETE', fallback: 'Could not remove the photo.' }),
  media: (id, photoId, guestToken) =>
    apiJson(`${base(id)}/photos/${photoId}/media`, { method: 'POST', auth: as(guestToken) }).then((b) => b.photo),
  download: (id, photoId, guestToken) =>
    apiJson(`${base(id)}/photos/${photoId}/download`, {
      method: 'POST',
      auth: as(guestToken),
      fallback: 'Could not start the download.',
    }),

  /**
   * One file per request. A retry with the same idempotency key returns the
   * original receipt, and "still uploading" answers are retried after the
   * server's Retry-After.
   */
  async upload(id, file, { idempotencyKey, displayName }, guestToken) {
    for (let attempt = 0; ; attempt += 1) {
      const form = new FormData();
      form.append('idempotencyKey', idempotencyKey);
      if (displayName) form.append('displayName', displayName);
      form.append('image', file);
      const res = await request(`${base(id)}/photos`, { method: 'POST', body: form, auth: as(guestToken), timeout: 120000 });
      const body = await readJson(res);
      if (res.ok) return body.receipt;
      if (body?.error?.code === 'upload_in_progress' && attempt < 3) {
        await sleep(Math.min(Number(res.headers?.get?.('retry-after')) || 3, 10) * 1000);
        continue;
      }
      throw new ApiError(errorMessage(body, `Upload failed (${res.status}).`), res.status, body?.error?.code);
    }
  },

  listInvitations: (id) => hostJson(`${base(id)}/invitations`, { fallback: 'We couldn’t load the invitations.' }).then((b) => b.invitations),
  createInvitation: (id, fields) =>
    hostJson(`${base(id)}/invitations`, { method: 'POST', json: fields, fallback: 'Could not create the link.' }),
  updateInvitation: (id, inviteId, changes) =>
    hostJson(`${base(id)}/invitations/${inviteId}`, { method: 'PATCH', json: changes, fallback: 'Could not update the link.' })
      .then((b) => b.invitation),
  blockSession: (id, sessionId) =>
    hostJson(`${base(id)}/guest-sessions/${sessionId}/block`, { method: 'POST', fallback: 'Could not turn off that session.' }),
  exchange: (secret) =>
    apiJson('/api/event-invitations/exchange', {
      method: 'POST',
      json: { token: secret },
      auth: 'none',
      fallback: 'This invitation link isn’t valid anymore. Ask the host for a new link.',
    }),
};

/** Formats accepted for event photos; anything else is explained, not sent. */
export const EVENT_ACCEPT = {
  types: ['image/jpeg', 'image/png', 'image/webp'],
  input: 'image/jpeg,image/png,image/webp',
  hint: 'JPEG, PNG or WebP, up to 20 MB each.',
  describe(names) {
    const heic = names.some((n) => /\.(heic|heif)$/i.test(n));
    const list = `${names.slice(0, 3).join(', ')}${names.length > 3 ? '…' : ''}`;
    return `Skipped ${names.length} ${names.length === 1 ? 'file' : 'files'} (${list}): only JPEG, PNG and WebP photos can be added.${
      heic ? ' iPhone HEIC photos aren’t supported yet — in Settings › Camera › Formats choose “Most Compatible”, or share them as JPEG.' : ''
    }`;
  },
};

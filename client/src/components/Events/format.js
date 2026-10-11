/** Display helpers shared by the event screens. */

// Event dates are calendar dates (YYYY-MM-DD); format them in UTC so they
// never shift a day in the viewer's time zone.
export function formatEventDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}

export const formatDateTime = (ms) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));

// Compact time for tile captions: no year when it's this year.
export function formatShortTime(ms) {
  const date = new Date(ms);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }), hour: 'numeric', minute: '2-digit',
  }).format(date);
}

/** "a", "a and b", "a, b and c" */
export function listText(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export const formatDay = (ms) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(ms));

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Collecting / closed status label for a host's event. */
export function eventStatus(event) {
  if (event.status === 'archived') return { label: 'Archived', tone: 'neutral' };
  if (!event.guestAccessEnabled) return { label: 'Guest access off', tone: 'neutral' };
  if (!event.uploadsOpen) return { label: 'Uploads closed', tone: 'neutral' };
  return { label: 'Collecting', tone: 'active' };
}

/** Shape an API photo for PhotoCard / Preview / Slideshow. */
export function toCardPhoto(photo, role) {
  const contributor = photo.contributorName || 'Host';
  const badges = [];
  if (photo.isCover) badges.push('Cover');
  if (photo.hidden) badges.push('Hidden');
  return {
    id: photo.id,
    url: photo.thumbUrl,
    title: role === 'host' ? photo.originalName : `Photo from ${contributor}`,
    subtitle: `${contributor} · ${formatShortTime(photo.uploadedAt)}`,
    badges,
    dimmed: Boolean(photo.hidden),
    raw: photo,
  };
}

export const toViewerPhoto = (photo, role) => ({ ...toCardPhoto(photo, role), url: photo.previewUrl });

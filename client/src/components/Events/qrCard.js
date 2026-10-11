import QRCode from 'qrcode';

// QR codes are generated in the browser. Invitation links are secrets and
// must never be sent to a third-party QR service.
const INK = '#0E2A35';
const ACCENT = '#0A7782';

export const qrDataUrl = (link) =>
  QRCode.toDataURL(link, { errorCorrectionLevel: 'M', margin: 2, width: 480, color: { dark: INK, light: '#FFFFFF' } });

function wrap(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
}

/**
 * A printable card (PNG, roughly A5 proportions) with the event title, the QR
 * code and short instructions. Always light, so it prints well.
 */
export async function qrCardBlob({ link, title, dateLabel, canAdd }) {
  const W = 1240;
  const H = 1748;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, W, 24);

  ctx.textAlign = 'center';
  ctx.fillStyle = ACCENT;
  ctx.font = '600 40px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText(canAdd ? 'SHARE YOUR PHOTOS' : 'SEE THE PHOTOS', W / 2, 150);

  ctx.fillStyle = INK;
  ctx.font = '400 84px Georgia, "Times New Roman", serif';
  const titleLines = wrap(ctx, title, W - 160).slice(0, 3);
  titleLines.forEach((l, i) => ctx.fillText(l, W / 2, 270 + i * 100));
  let y = 270 + titleLines.length * 100;
  if (dateLabel) {
    ctx.fillStyle = '#46646F';
    ctx.font = '400 40px Inter, Helvetica, Arial, sans-serif';
    ctx.fillText(dateLabel, W / 2, y);
    y += 40;
  }

  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, link, { errorCorrectionLevel: 'M', margin: 2, width: 820, color: { dark: INK, light: '#FFFFFF' } });
  ctx.drawImage(qr, (W - 820) / 2, y + 40, 820, 820);
  y += 40 + 820 + 90;

  ctx.fillStyle = INK;
  ctx.font = '600 46px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText(canAdd ? 'Scan with your phone camera to add photos' : 'Scan with your phone camera to view the album', W / 2, y);
  ctx.fillStyle = '#46646F';
  ctx.font = '400 36px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText('No app or account needed. Anyone with this code can join.', W / 2, y + 64);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the QR card.'))), 'image/png');
  });
}

export function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const slug = (text) =>
  (text || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'event';

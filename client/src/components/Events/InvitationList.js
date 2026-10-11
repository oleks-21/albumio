import { useState } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatDay } from './format';

export const permissionSummary = (inv) =>
  [inv.canAdd && 'Add', inv.canView && 'View', inv.canDownload && 'Download'].filter(Boolean).join(' · ');

const stateText = (inv) => {
  if (inv.state === 'revoked') return `Revoked ${formatDay(inv.revokedAt)}`;
  if (inv.state === 'expired') return `Expired ${formatDay(inv.expiresAt)}`;
  return `Expires ${formatDay(inv.expiresAt)}`;
};

/**
 * The event's invitation links: safe metadata only. Raw links can't be shown
 * again (only a hash is stored), so "Replace link" revokes and re-issues.
 */
export default function InvitationList({ invitations, error, onRevoke, onReplace }) {
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [replaceTarget, setReplaceTarget] = useState(null);

  if (error) return <Alert severity="error" variant="outlined">{error}</Alert>;
  if (!invitations) return <Typography variant="body2" color="text.secondary">Loading links…</Typography>;
  if (invitations.length === 0) {
    return <Typography variant="body2" color="text.secondary">No links yet.</Typography>;
  }

  return (
    <>
      <ul className="invite-list" aria-label="Invitation links">
        {invitations.map((inv) => (
          <li key={inv.id} className={`invite-row${inv.state === 'active' ? '' : ' is-inactive'}`}>
            <div className="invite-row__text">
              <div className="invite-row__label">{inv.label}</div>
              <div className="invite-row__detail">{permissionSummary(inv)} · {stateText(inv)}</div>
            </div>
            {inv.state === 'active' && (
              <div className="invite-row__actions">
                <Button size="small" onClick={() => setReplaceTarget(inv)}>Replace link</Button>
                <Button size="small" color="error" onClick={() => setRevokeTarget(inv)}>Revoke</Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Revoke this link?"
        confirmLabel="Revoke link"
        onConfirm={() => onRevoke(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
      >
        Everyone using “<strong>{revokeTarget?.label}</strong>” loses access right away, including guests who already have the album open. A revoked link can’t be turned back on.
      </ConfirmDialog>
      <ConfirmDialog
        open={Boolean(replaceTarget)}
        title="Replace this link?"
        confirmLabel="Replace link"
        onConfirm={() => onReplace(replaceTarget)}
        onClose={() => setReplaceTarget(null)}
      >
        “<strong>{replaceTarget?.label}</strong>” stops working, and you get a new link and QR code with the same permissions. Share the new one with the guests who should keep access.
      </ConfirmDialog>
    </>
  );
}

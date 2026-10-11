import { useCallback, useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IosShareIcon from '@mui/icons-material/IosShare';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { eventApi } from './eventApi';
import InvitationList, { permissionSummary } from './InvitationList';
import { qrDataUrl, qrCardBlob, saveBlob, slug } from './qrCard';
import { formatEventDate } from './format';

const DAY = 24 * 60 * 60 * 1000;
const EXPIRY_OPTIONS = [
  { days: 1, label: '1 day' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '1 year' },
];

const defaults = () => ({ label: 'Guest link', canAdd: true, canView: true, canDownload: false, days: 30 });

function Permission({ checked, onChange, label, help, disabled }) {
  return (
    <div>
      <FormControlLabel
        control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />}
        label={<Typography sx={{ fontWeight: 600 }}>{label}</Typography>}
      />
      <Typography variant="body2" color="text.secondary" sx={{ pl: 6.5, mt: -0.5 }}>{help}</Typography>
    </div>
  );
}

/**
 * Create invitation links (each with its own Add / View / Download switches
 * and expiry), show a new link once with its QR code, and manage existing
 * links. Only a hash of each link is stored on the server.
 */
export default function InviteGuestsDialog({ open, event, onClose }) {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [form, setForm] = useState(defaults);
  const [created, setCreated] = useState(null); // { link, invitation, qr }
  const [invitations, setInvitations] = useState(null);
  const [listError, setListError] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [copyState, setCopyState] = useState('');

  const loadList = useCallback(async () => {
    try {
      setInvitations(await eventApi.listInvitations(event.id));
      setListError('');
    } catch (err) {
      setListError(err.message);
    }
  }, [event.id]);

  useEffect(() => {
    if (open) {
      setForm(defaults());
      setCreated(null);
      setError('');
      setCopyState('');
      loadList();
    }
  }, [open, loadList]);

  const set = (key) => (value) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'canView' && !value) next.canDownload = false; // download requires view
      return next;
    });

  const issue = async (fields) => {
    const { invitation, joinPath } = await eventApi.createInvitation(event.id, fields);
    const link = `${window.location.origin}${joinPath}`;
    let qr = '';
    try {
      qr = await qrDataUrl(link);
    } catch {
      /* the link still works without a QR preview */
    }
    setCreated({ link, invitation, qr });
    setCopyState('');
    loadList();
  };

  const create = async () => {
    if (!form.canAdd && !form.canView) {
      setError('Turn on adding or viewing for this link.');
      return;
    }
    setPending(true);
    setError('');
    try {
      await issue({
        label: form.label.trim() || 'Guest link',
        canAdd: form.canAdd,
        canView: form.canView,
        canDownload: form.canView && form.canDownload,
        expiresAt: Date.now() + form.days * DAY,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  const revoke = async (inv) => {
    await eventApi.updateInvitation(event.id, inv.id, { revoke: true });
    await loadList();
  };

  const replace = async (inv) => {
    await eventApi.updateInvitation(event.id, inv.id, { revoke: true });
    const remaining = Math.max(inv.expiresAt - Date.now(), DAY);
    await issue({
      label: inv.label,
      canAdd: inv.canAdd,
      canView: inv.canView,
      canDownload: inv.canDownload,
      expiresAt: Date.now() + Math.min(remaining, 365 * DAY - 60_000),
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(created.link);
      setCopyState('Link copied.');
    } catch {
      setCopyState('Copy didn’t work here. Select the link above and copy it.');
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: event.title, text: `Add your photos to “${event.title}”`, url: created.link });
    } catch {
      /* dismissed or unsupported */
    }
  };

  const downloadCard = async () => {
    try {
      const blob = await qrCardBlob({
        link: created.link,
        title: event.title,
        dateLabel: formatEventDate(event.eventDate),
        canAdd: created.invitation.canAdd,
      });
      saveBlob(blob, `${slug(event.title)}-qr-card.png`);
    } catch (err) {
      setCopyState(err.message);
    }
  };

  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth aria-labelledby="invite-title">
      <DialogTitle id="invite-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5 }}>
        Invite guests
        <IconButton aria-label="Close" onClick={onClose} disabled={pending} sx={{ width: 44, height: 44 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {created ? (
            <section aria-labelledby="invite-created-title">
              <Typography id="invite-created-title" variant="h6" component="h3" sx={{ mb: 1 }}>
                “{created.invitation.label}” is ready
              </Typography>
              <div className="invite-result">
                {created.qr ? (
                  <img className="invite-qr" src={created.qr} alt={`QR code for the “${created.invitation.label}” invitation link`} />
                ) : (
                  <span className="invite-qr" aria-hidden="true" />
                )}
                <Stack spacing={1.5} sx={{ minWidth: 0 }}>
                  <div className="invite-link" aria-label="Invitation link">{created.link}</div>
                  <Typography variant="body2" color="text.secondary">
                    {permissionSummary(created.invitation)}. Anyone with this link or QR code has these permissions.
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={copy}>Copy link</Button>
                    {typeof navigator !== 'undefined' && navigator.share && (
                      <Button variant="outlined" startIcon={<IosShareIcon />} onClick={share}>Share</Button>
                    )}
                    <Button variant="outlined" startIcon={<QrCode2Icon />} onClick={downloadCard}>Download QR card</Button>
                  </Stack>
                  {copyState && <Typography variant="body2" role="status">{copyState}</Typography>}
                </Stack>
              </div>
              <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
                Copy or save this link now — it’s shown only once. Albumio keeps just a fingerprint of it, so it can’t show it again. If you need it later, replace it with a new one.
              </Alert>
              <Button sx={{ mt: 1.5 }} onClick={() => { setCreated(null); setForm(defaults()); }}>Create another link</Button>
            </section>
          ) : (
            <section aria-labelledby="invite-new-title">
              <Typography id="invite-new-title" variant="h6" component="h3" sx={{ mb: 1.5 }}>New link</Typography>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField
                  label="Link name"
                  value={form.label}
                  onChange={(e) => set('label')(e.target.value)}
                  helperText="Only you see this, e.g. “Reception QR” or “Family viewing”."
                  inputProps={{ maxLength: 60 }}
                  disabled={pending}
                />
                <Permission checked={form.canAdd} onChange={set('canAdd')} disabled={pending} label="Can add photos" help="Guests can upload photos from their phone or computer." />
                <Permission checked={form.canView} onChange={set('canView')} disabled={pending} label="Can view the album" help="Guests can browse the photos and play the slideshow. Off means they only see their own uploads." />
                <Permission
                  checked={form.canDownload}
                  onChange={set('canDownload')}
                  disabled={pending || !form.canView}
                  label="Can download originals"
                  help={form.canView ? 'Guests can save full-size originals of visible photos.' : 'Turn on viewing to allow downloads.'}
                />
                <TextField select label="Link expires after" value={form.days} onChange={(e) => set('days')(Number(e.target.value))} disabled={pending}>
                  {EXPIRY_OPTIONS.map((o) => <MenuItem key={o.days} value={o.days}>{o.label}</MenuItem>)}
                </TextField>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Anyone with this link has these permissions.</Typography>
              </Stack>
            </section>
          )}

          <Divider />
          <section aria-labelledby="invite-list-title">
            <Typography id="invite-list-title" variant="h6" component="h3" sx={{ mb: 1.5 }}>Links for this event</Typography>
            <InvitationList invitations={invitations} error={listError} onRevoke={revoke} onReplace={replace} />
          </section>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {created ? (
          <Button variant="contained" onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={pending}>Close</Button>
            <Button variant="contained" onClick={create} disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}>
              Create link
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

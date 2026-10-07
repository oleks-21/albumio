import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useDispatch } from 'react-redux';
import { login } from '../../store/store';
import { request } from '../../api';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { FrameMark } from '../common/BrandMark';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = ({ open, register, handleClose, onSwitchMode }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));

  // Reset form state whenever the dialog is (re)opened or the mode switches,
  // so stale values/errors never carry over between sessions.
  useEffect(() => {
    if (open) {
      setName('');
      setEmail('');
      setPassword('');
      setError('');
      setSubmitting(false);
    }
  }, [open, register]);

  const validate = () => {
    if (register && !name.trim()) return 'Please enter your name.';
    if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.';
    if (!password) return 'Please enter your password.';
    if (register && password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const handleLogin = async () => {
    try {
      const response = await request('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        dispatch(login(email));
        handleClose();
        navigate('/album_display');
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login.');
    }
  };

  const handleRegister = async () => {
    try {
      const response = await request('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (response.ok) {
        // FIX: was dispatch(login(name)) — stored the name as the email and
        // broke every email-keyed API call for newly registered users.
        dispatch(login(email));
        handleClose();
        navigate('/album_display');
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      if (register) {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="auth-dialog-title"
      maxWidth="xs"
      fullWidth
      fullScreen={fullScreen}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          noValidate: true,
          sx: { p: { xs: 1, sm: 1.5 } },
        },
      }}
    >
      <DialogTitle id="auth-dialog-title" sx={{ textAlign: 'center', pb: 0.5 }}>
        <Stack alignItems="center" spacing={1.5}>
          <FrameMark size={36} />
          <Typography component="span" variant="h4" sx={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
            {register ? 'Create your gallery' : 'Welcome back'}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
          {register
            ? 'An account keeps your photos, collections and saved slideshows together.'
            : 'Log in to open your photo library.'}
        </Typography>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" variant="outlined" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {register && (
            <TextField
              label="Name"
              variant="outlined"
              value={name}
              autoFocus
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              fullWidth
            />
          )}
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            value={email}
            autoFocus={!register}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            autoComplete={register ? 'new-password' : 'current-password'}
            helperText={register ? 'At least 6 characters.' : undefined}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {register ? 'Create account' : 'Log in'}
          </Button>
          {onSwitchMode && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {register ? 'Already have an account? ' : 'New to Albumio? '}
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => onSwitchMode(register ? 'login' : 'register')}
                disabled={submitting}
                sx={{ fontWeight: 600, verticalAlign: 'baseline' }}
              >
                {register ? 'Log in' : 'Create an account'}
              </Link>
            </Typography>
          )}
          {fullScreen && (
            <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default Login;

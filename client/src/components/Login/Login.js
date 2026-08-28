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
import { tokens } from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = ({ open, register, handleClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
        sx: {
          backgroundColor: tokens.gray900,
          border: `1px solid ${tokens.gray800}`,
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle id="auth-dialog-title" sx={{ textAlign: 'center', color: tokens.gray100 }}>
        {register ? 'Create your account' : 'Welcome back'}
      </DialogTitle>
      <DialogContent>
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
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {register ? 'Register' : 'Login'}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Backdrop from '@mui/material/Backdrop';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useDispatch } from 'react-redux';
import { login } from '../../store/store';
import { tokens, cardSurface } from '../../theme';


const Login = ({ open, register, handleClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleLogin = async () => {
    try {
      const response = await fetch('https://albumio-backend.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password }),
      });

      if (response.ok) {
        dispatch(login(email));
        handleClose();
        navigate('/album_display');
      } else {
        const data = await response.json();
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('An error occurred during login.');
    }
  };
  const handleRegister = async () => {
    try {
      const response = await fetch('https://albumio-backend.onrender.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      if (response.ok) {
        dispatch(login(name));
        handleClose();
        navigate('/album_display');
      } else {
        const data = await response.json();
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      alert('An error ocurred furing registration')
    }
  }

  return (
    <Backdrop
      sx={(theme) => ({
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(3, 7, 18, 0.7)',
        backdropFilter: 'blur(4px)'
      })}
      open={open}
      onClick={handleClose}
    >
      <Card
        sx={{
          ...cardSurface,
          minWidth: 320,
          padding: 3,
          backgroundColor: tokens.gray900,
          color: tokens.gray200
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent>
          <Typography
            variant="h5"
            sx={{ mb: 2.5, textAlign: 'center', color: tokens.gray100 }}
          >
            {register ? 'Create your account' : 'Welcome back'}
          </Typography>
          {register ? (
            <Stack spacing={2}>
              <TextField label="Name" variant="outlined" onChange={(e) => setName(e.target.value)} />
              <TextField label="Email" variant="outlined" onChange={(e) => setEmail(e.target.value)} />
              <TextField label="Password" variant="outlined" type="password" onChange={(e) => setPassword(e.target.value)} />
              <Button variant="contained" color="primary" onClick={handleRegister}>Register</Button>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <TextField
                label="Email"
                variant="outlined"
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField label="Password" variant="outlined" type="password" onChange={(e) => setPassword(e.target.value)} />
              <Button variant="contained" color="primary" onClick={handleLogin}>Login</Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Backdrop>
  );
};

export default Login;

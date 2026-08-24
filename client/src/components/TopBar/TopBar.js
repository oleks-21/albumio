import React, { useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/store';
import { useLocation, useNavigate } from 'react-router-dom';
import Login from '../Login/Login';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert'; // ⋮ icon
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { tokens, gradients, hairlineBorder } from '../../theme';

const hairlineBefore = hairlineBorder;

// Secondary (dark) button treatment
const darkButtonSx = {
  position: 'relative',
  color: tokens.gray300,
  backgroundImage: gradients.darkButton,
  fontSize: 13,
  px: 1.75,
  py: 0.5,
  '&::before': hairlineBefore,
  '&:hover': { backgroundImage: gradients.darkButton },
};

export default function TopBar() {
  const email = useSelector(state => state.user.email);
  const isLoggedIn = useSelector(state => state.user.isLoggedIn);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [name, setName] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const fetchName = async () => {
      try {
        const response = await fetch(`https://albumio-backend.onrender.com/api/user-name?email=${email}`);
        const data = await response.json();
        if (response.ok) {
          setName(data.name);
        } else {
          console.warn(data.error);
          setName(email);
        }
      } catch (err) {
        console.error('Error fetching name:', err);
        setName(email);
      }
    };

    if (isLoggedIn && email) {
      fetchName();
    }
  }, [isLoggedIn, email]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const [open, setOpen] = useState(false);
  const [register, setRegister] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setRegister(false);
  };
  const handleOpenRegister = () => {
    setOpen(true);
    setRegister(true);
  };
  const handleClose = () => setOpen(false);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          backgroundImage: 'none',
          boxShadow: 'none',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid',
          borderImageSource: gradients.hairline,
          borderImageSlice: 1,
        }}
      >
        <Box
          sx={{
            width: '100%',
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* Full-width bar */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              height: 56,
            }}
          >
            {/* Left: drawer menu button + brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                edge="start"
                onClick={() => setDrawerOpen(true)}
                sx={{ color: tokens.gray300 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: tokens.gray100,
                  userSelect: 'none',
                }}
              >
                AlbumIo
              </Typography>
            </Box>

            {/* Right: Login/Register or Hello/Logout */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Detect if we are on mobile */}
              {isMobile ? (
                <>
                  <IconButton
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ color: tokens.gray300 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    disableScrollLock
                    PaperProps={{
                      sx: {
                        mt: 1,
                        backgroundColor: tokens.gray900,
                        color: tokens.gray200,
                        border: `1px solid ${tokens.gray800}`,
                        borderRadius: 2,
                      },
                    }}
                  >
                    {isLoggedIn ? (
                      <>
                        <MenuItem disabled>Hello, {name || email}</MenuItem>
                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                      </>
                    ) : (
                      <>
                        <MenuItem onClick={handleOpen}>Login</MenuItem>
                        <MenuItem onClick={handleOpenRegister}>Register</MenuItem>
                      </>
                    )}
                  </Menu>
                </>
              ) : (
                // Desktop view: inline buttons
                <>
                  {isLoggedIn ? (
                    <>
                      <Typography
                        variant="body2"
                        sx={{ color: tokens.mutedTextStrong, mr: 0.5 }}
                      >
                        Hello, {name || email}
                      </Typography>
                      <Button onClick={handleLogout} sx={darkButtonSx}>
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleOpen} sx={darkButtonSx}>
                        Login
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenRegister}
                        sx={{ fontSize: 13, px: 1.75, py: 0.5 }}
                      >
                        Register
                      </Button>
                    </>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Box>
      </AppBar>

      {/* Drawer Menu */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            backgroundColor: tokens.gray900,
            color: tokens.gray200,
            borderRight: `1px solid ${tokens.gray800}`,
          },
        }}
      >
        <List
          sx={{
            '& .MuiListItemText-primary': {
              fontWeight: 500,
              letterSpacing: '-0.0125em',
            },
            '& .MuiListItem-root': {
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.08)' },
            },
          }}
        >

          {isLoggedIn && (location.pathname === "/") ? (
            <ListItem button onClick={() => navigate('/album_display')}>
              <ListItemText primary="My Album" />
            </ListItem>
          ) : (
            <ListItem button onClick={() => navigate('/')}>
              <ListItemText primary="Home" />
            </ListItem>
          )}
          <ListItem button onClick={() => navigate('/about')}>
            <ListItemText primary="About" />
          </ListItem>
        </List>
      </Drawer>

      <Login open={open} register={register} handleClose={handleClose} />
    </>
  );
}

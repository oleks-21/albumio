import { API_BASE } from '../../api';
import { useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/store';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { tokens, HEADER_HEIGHT } from '../../theme';
import BrandMark from '../common/BrandMark';

const LIBRARY_PATH = '/album_display';

const navLinkSx = (active) => ({
  color: active ? tokens.text : tokens.textSecondary,
  fontWeight: active ? 600 : 500,
  px: 1.5,
  minHeight: 44,
  borderRadius: 1,
  '&:hover': { color: tokens.text, backgroundColor: tokens.surfaceSubtle },
});

export default function TopBar({ onOpenAuth }) {
  const email = useSelector(state => state.user.email);
  const isLoggedIn = useSelector(state => state.user.isLoggedIn);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState(null);

  useEffect(() => {
    const fetchName = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/user-name?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        setName(response.ok && data.name ? data.name : email);
      } catch (err) {
        setName(email);
      }
    };

    if (isLoggedIn && email) {
      fetchName();
    }
  }, [isLoggedIn, email]);

  const displayName = name || email;
  const onLibrary = location.pathname === LIBRARY_PATH;
  // Workspace pages use the full window width; marketing pages are centered.
  const wide = onLibrary || location.pathname === '/edit';

  const handleLogout = () => {
    setAccountAnchor(null);
    setDrawerOpen(false);
    dispatch(logout());
    navigate('/');
  };

  // Close any open menu before showing the auth dialog so it never sits on top.
  const openAuth = (mode) => {
    setAccountAnchor(null);
    setDrawerOpen(false);
    onOpenAuth?.(mode);
  };

  const links = isLoggedIn
    ? [
        { label: 'Home', to: '/' },
        { label: 'My library', to: LIBRARY_PATH },
        { label: 'About', to: '/about' },
      ]
    : [
        { label: 'How it works', to: { pathname: '/', hash: '#how-it-works' } },
        { label: 'About', to: '/about' },
      ];
  const isActive = (to) => typeof to === 'string' && location.pathname === to;

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        color="inherit"
        component="header"
        sx={{
          backgroundColor: tokens.headerBg,
          backdropFilter: 'saturate(1.4) blur(8px)',
          WebkitBackdropFilter: 'saturate(1.4) blur(8px)',
          borderBottom: `1px solid ${tokens.border}`,
          color: tokens.text,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: wide ? 'none' : 1200 + 2 * 48,
            mx: 'auto',
            px: wide ? 2 : { xs: 2, sm: 3, md: 6 },
            height: { xs: HEADER_HEIGHT.xs, md: HEADER_HEIGHT.md },
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            component={RouterLink}
            to="/"
            aria-label="Albumio home"
            sx={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', borderRadius: 1, minHeight: 44 }}
          >
            <BrandMark />
          </Box>

          {/* Desktop page navigation */}
          <Box component="nav" aria-label="Main" sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, ml: 3 }}>
            {links.map((link) => (
              <Button
                key={link.label}
                component={RouterLink}
                to={link.to}
                aria-current={isActive(link.to) ? 'page' : undefined}
                sx={navLinkSx(isActive(link.to))}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isLoggedIn ? (
              <>
                {!onLibrary && (
                  <Button variant="contained" component={RouterLink} to={LIBRARY_PATH}>
                    Open library
                  </Button>
                )}
                <Button
                  onClick={(e) => setAccountAnchor(e.currentTarget)}
                  aria-label={`Account menu for ${displayName}`}
                  aria-haspopup="menu"
                  aria-expanded={Boolean(accountAnchor)}
                  sx={{ display: { xs: 'none', md: 'inline-flex' }, color: tokens.text, gap: 1, px: 1, minHeight: 44 }}
                >
                  <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: tokens.selected, color: tokens.accentHover }}>
                    {(displayName || '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box component="span" sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {displayName}
                  </Box>
                  <ExpandMoreIcon fontSize="small" sx={{ color: tokens.textSecondary }} />
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => openAuth('login')}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: tokens.text, minHeight: 44 }}
                >
                  Log in
                </Button>
                <Button variant="contained" onClick={() => openAuth('register')}>
                  Create account
                </Button>
              </>
            )}
            <IconButton
              aria-label="Open menu"
              aria-controls={drawerOpen ? 'site-menu' : undefined}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { md: 'none' }, color: tokens.text, width: 44, height: 44 }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
      </AppBar>

      <Menu
        anchorEl={accountAnchor}
        open={Boolean(accountAnchor)}
        onClose={() => setAccountAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 220, border: `1px solid ${tokens.border}`, borderRadius: 2 } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography sx={{ fontWeight: 600 }} noWrap>{displayName}</Typography>
          {name && name !== email && (
            <Typography variant="body2" color="text.secondary" noWrap>{email}</Typography>
          )}
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ minHeight: 44 }}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Log out
        </MenuItem>
      </Menu>

      {/* Phone/tablet menu */}
      <Drawer
        id="site-menu"
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: 'min(320px, 86vw)', backgroundColor: tokens.page } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, height: HEADER_HEIGHT.xs }}>
          <Typography sx={{ fontWeight: 600 }}>Menu</Typography>
          <IconButton aria-label="Close menu" onClick={() => setDrawerOpen(false)} sx={{ width: 44, height: 44 }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List component="nav" aria-label="Main">
          {links.map((link) => (
            <ListItemButton
              key={link.label}
              component={RouterLink}
              to={link.to}
              selected={isActive(link.to)}
              aria-current={isActive(link.to) ? 'page' : undefined}
              onClick={() => setDrawerOpen(false)}
              sx={{ minHeight: 48 }}
            >
              <ListItemText primary={link.label} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {isLoggedIn ? (
            <>
              <Typography variant="body2" color="text.secondary" noWrap>
                Signed in as <strong>{displayName}</strong>
              </Typography>
              <Button variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ minHeight: 44 }}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="contained" onClick={() => openAuth('register')} sx={{ minHeight: 44 }}>
                Create account
              </Button>
              <Button variant="outlined" onClick={() => openAuth('login')} sx={{ minHeight: 44 }}>
                Log in
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
}

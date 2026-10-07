import './App.css';
import { Suspense, lazy, useCallback, useState } from 'react';
import TopBar from './components/TopBar/TopBar';
import MainPage from './components/MainPage/MainPage';
import Login from './components/Login/Login';
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme, { HEADER_HEIGHT } from './theme';

// Code-split the routes that aren't part of the first paint. MainPage (the
// landing page) and TopBar stay eager; the logged-in Album subtree, the canvas
// editor, About and NotFound load on demand.
const Album = lazy(() => import('./components/Album/Album'));
const EditImage = lazy(() => import('./components/EditImage/EditImage'));
const About = lazy(() => import('./components/About/About'));
const NotFound = lazy(() => import('./components/NotFound/NotFound'));

// Defined at module scope so it isn't recreated on every App render.
function ProtectedRoute({ children }) {
  const isLoggedIn = useSelector(state => state.user.isLoggedIn);
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

function RouteFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress aria-label="Loading page" />
    </Box>
  );
}

export default function App() {
  // One auth dialog shared by the header and the homepage hero.
  const [auth, setAuth] = useState({ open: false, register: false });
  const openAuth = useCallback((mode) => setAuth({ open: true, register: mode === 'register' }), []);
  const closeAuth = useCallback(() => setAuth((prev) => ({ ...prev, open: false })), []);

  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TopBar onOpenAuth={openAuth} />
        <Box aria-hidden sx={{ height: { xs: HEADER_HEIGHT.xs, md: HEADER_HEIGHT.md } }} />
        <main className="App-main" id="main">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<MainPage onOpenAuth={openAuth} />} />
              <Route path="/about" element={<About />} />
              <Route path="/edit" element={<EditImage />} />
              <Route
                path="/album_display"
                element={
                  <ProtectedRoute>
                    <Album />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Login open={auth.open} register={auth.register} handleClose={closeAuth} onSwitchMode={openAuth} />
      </ThemeProvider>
    </div>
  );
}

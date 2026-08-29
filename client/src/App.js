import './App.css';
import { Suspense, lazy } from 'react';
import TopBar from './components/TopBar/TopBar';
import MainPage from './components/MainPage/MainPage';
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import { Toolbar } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import darkTheme from './theme';

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
      <CircularProgress />
    </Box>
  );
}

export default function App() {
  return (
    <div className="App">
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <TopBar />
        <Box>
          <Toolbar />
          <header className="App-header">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<MainPage />} />
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
          </header>
        </Box>
      </ThemeProvider>
    </div>
  );
}

import './App.css';
import TopBar from './components/TopBar/TopBar';
import MainPage from './components/MainPage/MainPage';
import Album from './components/Album/Album';
import About from './components/About/About';
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import { Toolbar } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import EditImage from './components/EditImage/EditImage';
import NotFound from './components/NotFound/NotFound';
import darkTheme from './theme';

// Defined at module scope so it isn't recreated on every App render.
function ProtectedRoute({ children }) {
  const isLoggedIn = useSelector(state => state.user.isLoggedIn);
  return isLoggedIn ? children : <Navigate to="/" replace />;
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
          </header>
        </Box>
      </ThemeProvider>
    </div>
  );
}

import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { useColorScheme } from '@mui/material/styles';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { tokens } from '../../theme';

/** The scheme currently on screen, resolving "system" to the OS preference. */
export function useResolvedScheme() {
  const { mode, systemMode, setMode } = useColorScheme();
  const resolved = (mode === 'system' ? systemMode : mode) || 'light';
  return { resolved, setMode };
}

/**
 * Switches between light and dark mode. Follows the OS setting until the
 * person picks one; the choice is remembered in localStorage by MUI.
 */
export default function ColorModeToggle({ variant = 'icon', sx }) {
  const { resolved, setMode } = useResolvedScheme();
  const next = resolved === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next} mode`;
  const icon = resolved === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />;

  if (variant === 'button') {
    return (
      <Button variant="outlined" startIcon={icon} onClick={() => setMode(next)} sx={{ minHeight: 44, ...sx }}>
        {resolved === 'dark' ? 'Light mode' : 'Dark mode'}
      </Button>
    );
  }

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        onClick={() => setMode(next)}
        sx={{ width: 44, height: 44, color: tokens.text, ...sx }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
}
